import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

const prismaLogConfig = env.NODE_ENV === 'development'
  ? [
      { emit: 'event', level: 'query' } as const,
      { emit: 'stdout', level: 'warn' } as const,
      { emit: 'stdout', level: 'error' } as const
    ]
  : [
      { emit: 'stdout', level: 'warn' } as const,
      { emit: 'stdout', level: 'error' } as const
    ];

export const prisma = new PrismaClient({
  log: prismaLogConfig
});

if (env.NODE_ENV !== 'production') {
  prisma.$on('query', (event) => {
    const duration = Number(event.duration || 0);

    if (duration >= 200) {
      const queryLabel = String(event.query || '').replace(/\s+/g, ' ').trim().slice(0, 120);
      console.info(`[prisma] ${duration}ms ${queryLabel}`);
    }
  });
}
