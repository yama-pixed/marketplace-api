import jwt from 'jsonwebtoken';

// Verifies JWT; attaches user to req.user
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Requires ADMIN role
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Requires ownership OR admin
export function requireOwnerOrAdmin(getOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      if (ownerId === null) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      if (req.user.role === 'ADMIN' || req.user.id === ownerId) {
        return next();
      }
      return res.status(403).json({ error: 'Access forbidden: you do not own this resource' });
    } catch {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}
