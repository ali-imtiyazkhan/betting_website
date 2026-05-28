import { Router } from "express";
import { prisma } from "db";
import { middleware } from "../middleware";
import { SplitSchema, OnrampSchema, OfframpSchema } from "../types";

const router = Router();

router.get("/balance", middleware, async (req, res) => {
  const userId = req.userId as string;
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  res.json({
    balance: user?.usdBalance,
  });
});

router.get("/positions", middleware, async (req, res) => {
  const userId = req.userId as string;
  const positions = await prisma.position.findMany({
    where: {
      userId,
    },
  });

  res.json({
    positions,
  });
});

router.post("/history", middleware, async (req, res) => {
  const userId = req.userId as string;
  const history = await prisma.orderHistory.findMany({
    where: {
      userId,
    },
  });

  res.json({
    history,
  });
});

router.post("/onramp", middleware, async (req, res) => {
  const { success, data } = OnrampSchema.safeParse(req.body);
  const userId = req.userId as string;

  if (!success) {
    res.status(411).json({
      message: "Incorrect inputs",
    });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const userResponse = await tx.$queryRaw<
        { id: string; address: string; usdBalance: number }[]
      >`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
      const user = userResponse[0];
      if (!user) {
        throw new Error("User not found");
      }

      // Convert USD amount to cents (integer) for storage
      const amountInCents = Math.round(data.amount * 100);

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          usdBalance: {
            increment: amountInCents,
          },
        },
      });
    });

    res.json({
      message: "Onramp successful",
      amount: data.amount,
    });
  } catch (error: any) {
    console.error("Error processing onramp:", error);
    res.status(500).json({
      message: "Error processing onramp",
    });
  }
});

router.post("/offramp", middleware, async (req, res) => {
  const { success, data } = OfframpSchema.safeParse(req.body);
  const userId = req.userId as string;

  if (!success) {
    res.status(411).json({
      message: "Incorrect inputs",
    });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const userResponse = await tx.$queryRaw<
        { id: string; address: string; usdBalance: number }[]
      >`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
      const user = userResponse[0];
      if (!user) {
        throw new Error("User not found");
      }

      // Convert USD amount to cents (integer) for storage
      const amountInCents = Math.round(data.amount * 100);

      if (user.usdBalance < amountInCents) {
        throw new Error("Insufficient USD balance");
      }

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          usdBalance: {
            decrement: amountInCents,
          },
        },
      });
    });

    res.json({
      message: "Offramp successful",
      amount: data.amount,
    });
  } catch (error: any) {
    console.error("Error processing offramp:", error);
    if (error.message === "Insufficient USD balance") {
      res.status(403).json({
        message: "Insufficient USD balance for offramp",
      });
    } else {
      res.status(500).json({
        message: "Error processing offramp",
      });
    }
  }
});

router.post("/split", middleware, async (req, res) => {
  const { data, success } = SplitSchema.safeParse(req.body);
  const userId = req.userId as string;
  if (!success) {
    res.status(411).json({ message: "Incorrect inputs" });
    return;
  }
  const marketId = data?.marketId;

  await prisma.$transaction(async (tx) => {
    const userResponse = await tx.$queryRaw<
      { id: string; address: string; usdBalance: number }[]
    >`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
    const user = userResponse[0];
    if (!user) {
      throw new Error("User not found");
    }

    if (user.usdBalance < data.amount) {
      res.status(403).json({
        message: "sorry you are not allowed to do this",
      });
      return;
    }

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        usdBalance: {
          decrement: data.amount,
        },
      },
    });

    await tx.position.upsert({
      where: {
        userId_marketId_type: {
          marketId,
          userId,
          type: "Yes",
        },
      },
      create: {
        marketId,
        userId,
        type: "Yes",
        qty: data.amount,
      },
      update: {
        qty: {
          increment: data.amount,
        },
      },
    });

    await tx.position.upsert({
      where: {
        userId_marketId_type: {
          marketId,
          userId,
          type: "No",
        },
      },
      create: {
        marketId,
        userId,
        type: "No",
        qty: data.amount,
      },
      update: {
        qty: {
          increment: data.amount,
        },
      },
    });

    await tx.orderHistory.create({
      data: {
        orderType: "Split",
        userId,
        price: 0,
        qty: data.amount,
        marketId: data.marketId,
      },
    });
  });

  // Explicitly send success response (since original transaction ended but response wasn't sent in index.ts)
  res.json({
    message: "Split successful",
  });
});

router.post("/merge", middleware, async (req, res) => {
  const { data, success } = SplitSchema.safeParse(req.body);
  const userId = req.userId as string;
  if (!success) {
    res.status(411).json({ message: "Incorrect inputs" });
    return;
  }
  const marketId = data?.marketId;

  try {
    await prisma.$transaction(async (tx) => {
      const userResponse = await tx.$queryRaw<
        { id: string; address: string; usdBalance: number }[]
      >`SELECT * FROM "User" WHERE id=${userId} FOR UPDATE;`;
      const user = userResponse[0];
      if (!user) {
        throw new Error("User not found");
      }

      const yesPosition = await tx.position.findFirst({
        where: {
          userId,
          marketId,
          type: "Yes",
        },
      });

      const noPosition = await tx.position.findFirst({
        where: {
          userId,
          marketId,
          type: "No",
        },
      });

      if (!yesPosition || yesPosition.qty < data.amount) {
        throw new Error("Insufficient Yes position");
      }

      if (!noPosition || noPosition.qty < data.amount) {
        throw new Error("Insufficient No position");
      }

      await tx.position.update({
        where: {
          userId_marketId_type: {
            userId,
            marketId,
            type: "Yes",
          },
        },
        data: {
          qty: {
            decrement: data.amount,
          },
        },
      });

      await tx.position.update({
        where: {
          userId_marketId_type: {
            userId,
            marketId,
            type: "No",
          },
        },
        data: {
          qty: {
            decrement: data.amount,
          },
        },
      });

      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          usdBalance: {
            increment: data.amount,
          },
        },
      });

      await tx.orderHistory.create({
        data: {
          orderType: "Merge",
          userId,
          price: 0,
          qty: data.amount,
          marketId: data.marketId,
        },
      });
    });
    res.json({
      message: "Merge successful",
    });
  } catch (error: any) {
    console.error("Error merging:", error);
    if (
      error.message === "Insufficient Yes position" ||
      error.message === "Insufficient No position"
    ) {
      res.status(403).json({
        message: "Sorry you dont have enough position",
      });
    } else {
      res.status(500).json({
        message: "Error merging",
      });
    }
  }
});

export default router;
