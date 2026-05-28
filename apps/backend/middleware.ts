import { createClient } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";

const supabase = createClient(
  "https://cuhkvmwygnxpqfagufte.supabase.co",
  "sb_secret_fltRWrt9OPjNgkJPALkJxw_DSazmndd",
);

export async function middleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  console.log("token that is sent from frontend:", authHeader);

  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(403).json({ message: "No token provided" });
    return;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    console.log("user is:", user);
    console.log("error is:", error);

    if (user) {
      req.userId = user.id;
      req.body.user = user;
      next();
    } else {
      res.status(403).json({ message: "Incorrect credentials" });
    }
  } catch (e) {
    res.status(403).json({ message: "Incorrect credentials" });
  }
}
