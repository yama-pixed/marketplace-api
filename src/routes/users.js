import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users — Admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return res.json(users);
});

// GET /api/users/:id — Admin or self
router.get(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    return user ? user.id : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid user ID' });
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  }
);

// PUT /api/users/:id — Admin or self
router.put(
  '/:id',
  authenticate,
  requireOwnerOrAdmin(async (req) => {
    const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    return user ? user.id : null;
  }),
  async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid user ID' });
    const { name, email } = req.body;
    if (!name && !email) return res.status(400).json({ error: 'Provide at least name or email to update' });
    const data = {};
    if (name) data.name = name;
    if (email) {
      const exists = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (exists) return res.status(409).json({ error: 'Email already in use' });
      data.email = email;
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, updatedAt: true },
    });
    return res.json(user);
  }
);

// DELETE /api/users/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid user ID' });
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
});

export default router;