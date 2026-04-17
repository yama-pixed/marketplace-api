import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/reviews — Public: list all reviews
router.get('/', async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      item: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(reviews);
});

// GET /api/reviews/:id — Public
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid review ID' });
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      item: { select: { id: true, title: true } },
    },
  });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  return res.json(review);
});

// POST /api/reviews — Authenticated users
router.post('/', authenticate, async (req, res) => {
  const { rating, comment, itemId } = req.body;
  if (!rating || !itemId) return res.status(400).json({ error: 'rating and itemId are required' });
  if (typeof rating !== 'number' || rating < 1 || rating > 5)
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const review = await prisma.review.create({
    data: { rating, comment, userId: req.user.id, itemId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      item: { select: { id: true, title: true } },
    },
  });
  return res.status(201).json(review);
});

// PUT /api/reviews/:id — Owner or Admin
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const review = await prisma.review.findUnique({ where: { id: Number(req.params.id) } });
    return review ? review.userId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid review ID' });
    const { rating, comment } = req.body;
    if (!rating && comment === undefined) return res.status(400).json({ error: 'Provide rating or comment' });
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5))
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    const data = {};
    if (rating) data.rating = rating;
    if (comment !== undefined) data.comment = comment;
    const review = await prisma.review.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, title: true } },
      },
    });
    return res.json(review);
  }
);

// DELETE /api/reviews/:id — Owner or Admin
router.delete(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const review = await prisma.review.findUnique({ where: { id: Number(req.params.id) } });
    return review ? review.userId : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid review ID' });
    await prisma.review.delete({ where: { id } });
    return res.json({ message: 'Review deleted successfully' });
  }
);

export default router;