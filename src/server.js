import express from 'express';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import itemsRouter from './routes/items.js';
import ordersRouter from './routes/orders.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/items', itemsRouter);
app.use('/api/orders', ordersRouter);

// Swagger UI
const swaggerDocument = YAML.load(join(__dirname, '../openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/', (req, res) => res.json({ message: 'Marketplace API is running 🛒' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Docs: http://localhost:${PORT}/api/docs`);
});
