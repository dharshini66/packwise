import { ItemCategory, JourneyType } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const item = z.object({ name: z.string().trim().min(1).max(80), category: z.nativeEnum(ItemCategory).default(ItemCategory.OTHER), quantity: z.number().int().min(1).max(50).default(1) });
const blueprintInput = z.object({ name: z.string().trim().min(2).max(60), type: z.nativeEnum(JourneyType), items: z.array(item).min(1).max(60) });

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const blueprints = await prisma.blueprint.findMany({ where: { OR: [{ userId: null }, { userId: req.userId }] }, include: { items: { orderBy: { name: "asc" } } }, orderBy: { createdAt: "asc" } });
  res.json({ blueprints });
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = blueprintInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Give your blueprint a name and at least one travel item." });
  const blueprint = await prisma.blueprint.create({ data: { name: parsed.data.name, type: parsed.data.type, userId: req.userId, items: { create: parsed.data.items } }, include: { items: true } });
  res.status(201).json({ blueprint });
});

router.post("/from-journey/:journeyId", async (req: AuthRequest, res) => {
  const journey = await prisma.journey.findFirst({ where: { id: String(req.params.journeyId), userId: req.userId }, include: { items: true } });
  if (!journey) return res.status(404).json({ message: "Journey not found." });
  if (!journey.items.length) return res.status(400).json({ message: "Add at least one item before saving a blueprint." });
  const blueprint = await prisma.blueprint.create({ data: { name: `${journey.title} Blueprint`, type: journey.type, userId: req.userId, items: { create: journey.items.map(({ name, category, quantity }) => ({ name, category, quantity })) } }, include: { items: true } });
  res.status(201).json({ blueprint });
});

router.post("/:blueprintId/apply/:journeyId", async (req: AuthRequest, res) => {
  const blueprint = await prisma.blueprint.findFirst({ where: { id: String(req.params.blueprintId), OR: [{ userId: null }, { userId: req.userId }] }, include: { items: true } });
  const journey = await prisma.journey.findFirst({ where: { id: String(req.params.journeyId), userId: req.userId } });
  if (!blueprint || !journey) return res.status(404).json({ message: "Blueprint or journey not found." });
  await prisma.manifestItem.createMany({ data: blueprint.items.map(({ name, category, quantity }) => ({ name, category, quantity, journeyId: journey.id })), skipDuplicates: true });
  res.json({ message: `${blueprint.items.length} travel items added to your manifest.` });
});

router.delete("/:blueprintId", async (req: AuthRequest, res) => {
  const result = await prisma.blueprint.deleteMany({ where: { id: String(req.params.blueprintId), userId: req.userId } });
  if (!result.count) return res.status(404).json({ message: "Only your own blueprints can be removed." });
  res.status(204).end();
});

export default router;
