import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const credentials = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});

function issueToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const result = credentials.safeParse(req.body);
  if (!result.success || !result.data.name) {
    return res.status(400).json({ message: "Name, email, and an 8-character password are required." });
  }
  const { name, email, password } = result.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "A traveler with this email already exists." });

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true, name: true, email: true },
  });
  return res.status(201).json({ user, token: issueToken(user.id) });
});

router.post("/login", async (req, res) => {
  const result = credentials.pick({ email: true, password: true }).safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Enter a valid email and password." });
  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user || !(await bcrypt.compare(result.data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Those travel credentials do not match." });
  }
  return res.json({ user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user.id) });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true },
  });
  return res.json({ user });
});

export default router;
