import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/items — Public
router.get('/', async (req, res) => {
  const items = await prisma.item.findMany({
    include: {
      seller: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(items);
});

// GET /api/items/:id — Public
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid item ID' });
  const item = await prisma.item.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true, email: true } } },
  });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  return res.json(item);
});

// POST /api/items — Authenticated
router.post('/', authenticate, async (req, res) => {
  const { title, description, price, quantity } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ error: 'title and price are required' });
  }
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'price must be a non-negative number' });
  }
  const item = await prisma.item.create({
    data: { title, description, price, quantity: quantity ?? 1, sellerId: req.user.id },
    include: { seller: { select: { id: true, name: true, email: true } } },
  });
  return res.status(201).json(item);
});

// PUT /api/items/:id — Owner or Admin
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const item = await prisma.item.findUnique({ where: { id: Number(req.params.id) } });
    return item ? item.sellerId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid item ID' });
    const { title, description, price, quantity } = req.body;
    if (!title && description === undefined && price === undefined && quantity === undefined) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
      return res.status(400).json({ error: 'price must be a non-negative number' });
    }
    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = price;
    if (quantity !== undefined) data.quantity = quantity;
    const item = await prisma.item.update({
      where: { id },
      data,
      include: { seller: { select: { id: true, name: true, email: true } } },
    });
    return res.json(item);
  }
);

// DELETE /api/items/:id — Owner or Admin
router.delete(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const item = await prisma.item.findUnique({ where: { id: Number(req.params.id) } });
    return item ? item.sellerId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid item ID' });
    await prisma.item.delete({ where: { id } });
    return res.status(204).send();
  }
);

export default router;