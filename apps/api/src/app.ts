import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import blogAutomationRoutes from './routes/blog-automation.js';
import dashboardRoutes from './routes/dashboard.js';
import leadRoutes from './routes/leads.js';
import postRoutes from './routes/posts.js';
import propertyRoutes from './routes/properties.js';
import redirectsRoutes from './routes/redirects.js';
import settingsRoutes from './routes/settings.js';
import testimonialRoutes from './routes/testimonials.js';
import themeRoutes from './routes/themes.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 400 : 1000,
  standardHeaders: true,
  legacyHeaders: false
});

const uploadsPath = fileURLToPath(new URL('../../web/public/uploads', import.meta.url));

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Origem não permitida pelo CORS.'));
      }
    })
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use((req, res, next) => {
    const startedAt = performance.now();

    res.on('finish', () => {
      const duration = Math.round((performance.now() - startedAt) * 100) / 100;
      const shouldLog = duration >= 250 || req.originalUrl.startsWith('/api/themes') || req.originalUrl.startsWith('/api/properties');

      if (shouldLog) {
        console.info(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${duration}ms`);
      }
    });

    next();
  });
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      etag: true,
      maxAge: env.NODE_ENV === 'production' ? '7d' : '1h',
      immutable: env.NODE_ENV === 'production',
      setHeaders(res) {
        res.setHeader(
          'Cache-Control',
          env.NODE_ENV === 'production' ? 'public, max-age=604800, immutable' : 'public, max-age=3600, stale-while-revalidate=86400'
        );
      }
    })
  );
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use('/api', globalRateLimiter);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'portal-imobiliario-api',
      environment: env.NODE_ENV
    });
  });

  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/blog-automation', blogAutomationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/redirects', redirectsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/testimonials', testimonialRoutes);
  app.use('/api/themes', themeRoutes);
  app.use('/api/theme-layouts', themeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
