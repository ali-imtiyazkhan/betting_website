import { Router } from "express";
import { prisma } from "db";

const router = Router();

// Get all markets
router.get("/markets", async (req, res) => {
  const markets = await prisma.market.findMany();
  res.json({
    markets,
  });
});

// Get a single market by ID
router.get("/market", async (req, res) => {
  const market = await prisma.market.findFirst({
    where: {
      id: req.query.marketId as string,
    },
  });

  res.json({
    market,
  });
});

export default router;
