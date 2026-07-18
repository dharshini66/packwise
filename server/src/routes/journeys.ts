import { JourneyType, ItemCategory } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const journeyInput = z.object({
  title: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  type: z.nativeEnum(JourneyType),
  departureAt: z.string().datetime(),
  returnAt: z.string().datetime().nullable().optional(),
  blueprintId: z.string().min(1).optional(),
});
const itemInput = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.nativeEnum(ItemCategory).default(ItemCategory.OTHER),
  quantity: z.number().int().min(1).max(50).default(1),
});

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const journeys = await prisma.journey.findMany({
    where: { userId: req.userId }, include: { items: { orderBy: { name: "asc" } } }, orderBy: { departureAt: "asc" },
  });
  res.json({ journeys });
});

router.post("/", async (req: AuthRequest, res) => {
  const result = journeyInput.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Please complete each journey detail." });
  const { blueprintId, ...data } = result.data;

  let itemsToCreate: { name: string; category: ItemCategory; quantity: number }[] = [];
  if (blueprintId) {
    const blueprint = await prisma.blueprint.findFirst({
      where: { id: blueprintId, OR: [{ userId: null }, { userId: req.userId }] },
      include: { items: true },
    });
    if (!blueprint) return res.status(404).json({ message: "Selected blueprint could not be found." });
    itemsToCreate = blueprint.items.map(({ name, category, quantity }) => ({ name, category, quantity }));
  }

  const journey = await prisma.journey.create({
    data: {
      ...data,
      departureAt: new Date(data.departureAt),
      returnAt: data.returnAt ? new Date(data.returnAt) : null,
      userId: req.userId!,
      items: itemsToCreate.length ? { create: itemsToCreate } : undefined,
    },
    include: { items: true },
  });
  res.status(201).json({ journey });
});

router.patch("/:journeyId", async (req: AuthRequest, res) => {
  const result = journeyInput.partial().safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Those journey details are not valid." });
  const journeyId = String(req.params.journeyId);
  const existing = await prisma.journey.findFirst({ where: { id: journeyId, userId: req.userId } });
  if (!existing) return res.status(404).json({ message: "Journey not found." });
  const data = result.data;
  const journey = await prisma.journey.update({
    where: { id: existing.id }, data: { ...data, departureAt: data.departureAt ? new Date(data.departureAt) : undefined, returnAt: data.returnAt === undefined ? undefined : data.returnAt ? new Date(data.returnAt) : null }, include: { items: true },
  });
  res.json({ journey });
});

router.delete("/:journeyId", async (req: AuthRequest, res) => {
  const result = await prisma.journey.deleteMany({ where: { id: String(req.params.journeyId), userId: req.userId } });
  if (!result.count) return res.status(404).json({ message: "Journey not found." });
  res.status(204).end();
});

router.post("/:journeyId/items", async (req: AuthRequest, res) => {
  const input = itemInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: "Please provide a valid travel item." });
  const journey = await prisma.journey.findFirst({ where: { id: String(req.params.journeyId), userId: req.userId } });
  if (!journey) return res.status(404).json({ message: "Journey not found." });
  const item = await prisma.manifestItem.create({ data: { ...input.data, journeyId: journey.id } });
  res.status(201).json({ item });
});

router.patch("/:journeyId/items/:itemId", async (req: AuthRequest, res) => {
  const input = z.object({ isStamped: z.boolean() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ message: "Invalid stamp status." });
  const item = await prisma.manifestItem.findFirst({ where: { id: String(req.params.itemId), journeyId: String(req.params.journeyId), journey: { userId: req.userId } } });
  if (!item) return res.status(404).json({ message: "Travel item not found." });
  const updated = await prisma.manifestItem.update({ where: { id: item.id }, data: input.data });
  res.json({ item: updated });
});

router.delete("/:journeyId/items/:itemId", async (req: AuthRequest, res) => {
  const result = await prisma.manifestItem.deleteMany({ where: { id: String(req.params.itemId), journeyId: String(req.params.journeyId), journey: { userId: req.userId } } });
  if (!result.count) return res.status(404).json({ message: "Travel item not found." });
  res.status(204).end();
});

export default router;