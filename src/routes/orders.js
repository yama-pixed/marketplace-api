import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = Router();

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// GET /api/orders — Admin: all orders; User: own orders
router.get('/', authenticate, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { buyerId: req.user.id };
  const orders = await prisma.order.findMany({
    where,
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      orderItems: { include: { item: { select: { id: true, title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(orders);
});

// GET /api/orders/:id — Owner or Admin
router.get(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    return order ? order.buyerId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid order ID' });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        orderItems: { include: { item: { select: { id: true, title: true, price: true } } } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  }
);

// POST /api/orders — Authenticated users
// Body: { items: [{ itemId, quantity }] }
router.post('/', authenticate, async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required and must not be empty' });
  }

  // Validate all items exist and have enough stock
  let total = 0;
  const orderItemsData = [];

  for (const entry of items) {
    if (!entry.itemId || !entry.quantity || entry.quantity < 1) {
      return res.status(400).json({ error: 'Each item must have itemId and quantity >= 1' });
    }

    const item = await prisma.item.findUnique({ where: { id: entry.itemId } });
    if (!item) return res.status(404).json({ error: `Item ${entry.itemId} not found` });
    if (item.quantity < entry.quantity) {
      return res.status(400).json({ error: `Insufficient stock for item ${entry.itemId}` });
    }

    total += item.price * entry.quantity;
    orderItemsData.push({ itemId: item.id, quantity: entry.quantity, price: item.price });
  }

  // Create order and decrement stock in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        buyerId: req.user.id,
        total,
        orderItems: { create: orderItemsData },
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        orderItems: { include: { item: { select: { id: true, title: true } } } },
      },
    });

    // Decrement stock for each item
    for (const entry of orderItemsData) {
      await tx.item.update({
        where: { id: entry.itemId },
        data: { quantity: { decrement: entry.quantity } },
      });
    }

    return newOrder;
  });

  return res.status(201).json(order);
});

// PUT /api/orders/:id — Admin: update status; Owner: cancel only
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    return order ? order.buyerId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid order ID' });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    // Regular users can only cancel their own orders
    if (req.user.role !== 'ADMIN' && status !== 'CANCELLED') {
      return res.status(403).json({ error: 'Users can only cancel orders; admins can set any status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        orderItems: { include: { item: { select: { id: true, title: true } } } },
      },
    });
    return res.json(order);
  }
);

// DELETE /api/orders/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid order ID' });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  await prisma.order.delete({ where: { id } });
  return res.json({ message: 'Order deleted successfully' });
});

export default router;
