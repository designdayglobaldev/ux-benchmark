import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import categoryRoutes from './routes/category.routes';
import subcategoryRoutes from './routes/subcategory.routes';
import appRoutes from './routes/app.routes';
import flowRoutes from './routes/flow.routes';
import uiElementRoutes from './routes/uiElement.routes';
import patternRoutes from './routes/pattern.routes';
import screenRoutes from './routes/screen.routes';
import analyticsRoutes from './routes/analytics.routes';
import aiRoutes from './routes/ai.routes';
import searchRoutes from './routes/search.routes';
import authRoutes from './routes/auth.routes';
import exportRoutes from './routes/export.routes';
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

app.get('/', (req, res) => {
  res.json({ message: 'Hello from the UX Library API!' });
});

// API Routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/subcategories', subcategoryRoutes);
app.use('/api/v1/apps', appRoutes);
app.use('/api/v1/flows', flowRoutes);
app.use('/api/v1/ui-elements', uiElementRoutes);
app.use('/api/v1/patterns', patternRoutes);
app.use('/api/v1/screens', screenRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/export', exportRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger restart 9
