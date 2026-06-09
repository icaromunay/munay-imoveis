import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { analyticsDateFromKey, getAnalyticsDateKey, parseAnalyticsRange } from '../utils/analytics.js';

const router = Router();

const visitorSchema = z.object({
  visitorKey: z.string().trim().min(16).max(120)
});

const homeVideoSchema = visitorSchema.extend({
  eventType: z.enum(['PLAY', 'PROGRESS_25', 'PROGRESS_50', 'PROGRESS_75', 'COMPLETE'])
});

const propertyContactSchema = visitorSchema.extend({
  action: z.enum(['WHATSAPP', 'SCHEDULE_VISIT'])
});

const viewsQuerySchema = z.object({
  range: z.enum(['today', '7d', '30d', '90d', 'custom']).optional().default('30d'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

function startOfToday() {
  return analyticsDateFromKey(getAnalyticsDateKey());
}

function sumNumber<T>(items: T[], getter: (item: T) => number | null | undefined) {
  return items.reduce((total, item) => total + Number(getter(item) || 0), 0);
}

router.post(
  '/home/visit',
  asyncHandler(async (req, res) => {
    const parsed = visitorSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Visitante inválido.');
    }

    const date = startOfToday();
    const { visitorKey } = parsed.data;

    const tracked = await prisma.$transaction(async (tx) => {
      const existing = await tx.homeAnalyticsVisitorDay.findUnique({
        where: { visitorKey_date: { visitorKey, date } }
      });

      if (existing?.visited) {
        return false;
      }

      if (existing) {
        await tx.homeAnalyticsVisitorDay.update({
          where: { id: existing.id },
          data: { visited: true }
        });
      } else {
        await tx.homeAnalyticsVisitorDay.create({
          data: {
            visitorKey,
            date,
            visited: true
          }
        });
      }

      await tx.homeAnalyticsDaily.upsert({
        where: { date },
        create: { date, homeVisits: 1 },
        update: { homeVisits: { increment: 1 } }
      });

      return true;
    });

    res.status(tracked ? 201 : 200).json({ tracked });
  })
);

router.post(
  '/home-video',
  asyncHandler(async (req, res) => {
    const parsed = homeVideoSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Evento de vídeo inválido.');
    }

    const date = startOfToday();
    const { visitorKey, eventType } = parsed.data;

    const fieldMap = {
      PLAY: { visitorField: 'videoPlayTracked', dailyField: 'homeVideoPlays' },
      PROGRESS_25: { visitorField: 'watched25Tracked', dailyField: 'watched25' },
      PROGRESS_50: { visitorField: 'watched50Tracked', dailyField: 'watched50' },
      PROGRESS_75: { visitorField: 'watched75Tracked', dailyField: 'watched75' },
      COMPLETE: { visitorField: 'watched100Tracked', dailyField: 'watched100' }
    } as const;

    const config = fieldMap[eventType];

    const tracked = await prisma.$transaction(async (tx) => {
      const existing = await tx.homeAnalyticsVisitorDay.findUnique({
        where: { visitorKey_date: { visitorKey, date } }
      });

      const alreadyTracked = existing ? Boolean(existing[config.visitorField]) : false;
      if (alreadyTracked) {
        return false;
      }

      if (existing) {
        await tx.homeAnalyticsVisitorDay.update({
          where: { id: existing.id },
          data: { [config.visitorField]: true }
        });
      } else {
        await tx.homeAnalyticsVisitorDay.create({
          data: {
            visitorKey,
            date,
            [config.visitorField]: true
          }
        });
      }

      await tx.homeAnalyticsDaily.upsert({
        where: { date },
        create: { date, [config.dailyField]: 1 },
        update: { [config.dailyField]: { increment: 1 } }
      });

      return true;
    });

    res.status(tracked ? 201 : 200).json({ tracked });
  })
);

router.post(
  '/properties/:slug/contact-click',
  asyncHandler(async (req, res) => {
    const parsed = propertyContactSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, 'Evento de contato inválido.');
    }

    const property = await prisma.property.findFirst({
      where: { slug: String(req.params.slug), approved: true },
      select: { id: true }
    });

    if (!property) {
      throw new AppError(404, 'Imóvel não encontrado.');
    }

    const date = startOfToday();
    const updateField = parsed.data.action === 'WHATSAPP' ? 'whatsappClicks' : 'scheduleVisitClicks';

    await prisma.propertyAnalyticsDaily.upsert({
      where: { propertyId_date: { propertyId: property.id, date } },
      create: {
        propertyId: property.id,
        date,
        [updateField]: 1
      },
      update: {
        [updateField]: { increment: 1 }
      }
    });

    res.status(201).json({ tracked: true });
  })
);

router.get(
  '/views',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = viewsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, 'Filtro inválido.', parsed.error.flatten());
    }

    const selectedRange = parseAnalyticsRange(parsed.data);
    const last7 = parseAnalyticsRange({ range: '7d' });
    const last30 = parseAnalyticsRange({ range: '30d' });
    const today = parseAnalyticsRange({ range: 'today' });

    const [homeToday, homeLast7, homeLast30, homeTotal, homeRows, propertyDailyRows, allProperties] = await Promise.all([
      prisma.homeAnalyticsDaily.aggregate({
        where: { date: { gte: today.start, lte: today.end } },
        _sum: { homeVisits: true }
      }),
      prisma.homeAnalyticsDaily.aggregate({
        where: { date: { gte: last7.start, lte: last7.end } },
        _sum: { homeVisits: true }
      }),
      prisma.homeAnalyticsDaily.aggregate({
        where: { date: { gte: last30.start, lte: last30.end } },
        _sum: { homeVisits: true }
      }),
      prisma.homeAnalyticsDaily.aggregate({
        _sum: {
          homeVisits: true,
          homeVideoPlays: true,
          watched25: true,
          watched50: true,
          watched75: true,
          watched100: true
        }
      }),
      prisma.homeAnalyticsDaily.findMany({
        where: { date: { gte: selectedRange.start, lte: selectedRange.end } },
        orderBy: { date: 'asc' }
      }),
      prisma.propertyAnalyticsDaily.findMany({
        where: { date: { gte: selectedRange.start, lte: selectedRange.end } },
        orderBy: [{ date: 'asc' }],
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              propertyCode: true,
              coverImage: true,
              city: true,
              district: true,
              viewCount: true,
              createdAt: true,
              approved: true
            }
          }
        }
      }),
      prisma.property.findMany({
        where: { approved: true },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          slug: true,
          propertyCode: true,
          coverImage: true,
          city: true,
          district: true,
          viewCount: true,
          createdAt: true
        }
      })
    ]);

    const propertyMap = new Map(
      allProperties.map((property) => [
        property.id,
        {
          id: property.id,
          title: property.title,
          slug: property.slug,
          propertyCode: property.propertyCode,
          coverImage: property.coverImage,
          city: property.city,
          district: property.district,
          totalViews: Number(property.viewCount || 0),
          periodViews: 0,
          whatsappClicks: 0,
          scheduleVisitClicks: 0,
          totalConversions: 0,
          lastViewedAt: null as string | null,
          createdAt: property.createdAt.toISOString()
        }
      ])
    );

    for (const row of propertyDailyRows) {
      const current = propertyMap.get(row.propertyId);
      if (!current) continue;
      current.periodViews += Number(row.propertyViews || 0);
      current.whatsappClicks += Number(row.whatsappClicks || 0);
      current.scheduleVisitClicks += Number(row.scheduleVisitClicks || 0);
      current.totalConversions = current.whatsappClicks + current.scheduleVisitClicks;
      const rowLastViewedAt = row.lastViewedAt ? row.lastViewedAt.toISOString() : null;
      if (rowLastViewedAt && (!current.lastViewedAt || rowLastViewedAt > current.lastViewedAt)) {
        current.lastViewedAt = rowLastViewedAt;
      }
    }

    const propertyStats = Array.from(propertyMap.values())
      .map((item) => ({
        ...item,
        conversionRate: item.periodViews > 0 ? Number(((item.totalConversions / item.periodViews) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.periodViews - a.periodViews || b.totalConversions - a.totalConversions || b.totalViews - a.totalViews);

    const topViewed = propertyStats
      .filter((item) => item.periodViews > 0 || item.totalViews > 0)
      .slice(0, 10)
      .map((item, index) => ({
        position: index + 1,
        title: item.title,
        propertyCode: item.propertyCode,
        views: item.periodViews > 0 ? item.periodViews : item.totalViews,
        slug: item.slug
      }));

    const topContacts = [...propertyStats]
      .filter((item) => item.totalConversions > 0)
      .sort((a, b) => b.totalConversions - a.totalConversions || b.whatsappClicks - a.whatsappClicks || b.scheduleVisitClicks - a.scheduleVisitClicks)
      .slice(0, 10)
      .map((item) => ({
        title: item.title,
        propertyCode: item.propertyCode,
        whatsappClicks: item.whatsappClicks,
        scheduleVisitClicks: item.scheduleVisitClicks,
        totalConversions: item.totalConversions,
        slug: item.slug
      }));

    const homeByDate = new Map(homeRows.map((row) => [row.date.toISOString().slice(0, 10), row]));
    const propertyByDate = new Map<string, { whatsappClicks: number; scheduleVisitClicks: number }>();

    for (const row of propertyDailyRows) {
      const key = row.date.toISOString().slice(0, 10);
      const current = propertyByDate.get(key) || { whatsappClicks: 0, scheduleVisitClicks: 0 };
      current.whatsappClicks += Number(row.whatsappClicks || 0);
      current.scheduleVisitClicks += Number(row.scheduleVisitClicks || 0);
      propertyByDate.set(key, current);
    }

    const labels: string[] = [];
    const homeVisitsSeries: number[] = [];
    const videoPlaysSeries: number[] = [];
    const whatsappSeries: number[] = [];
    const scheduleSeries: number[] = [];

    const cursor = new Date(selectedRange.start);
    const endCursor = new Date(selectedRange.end);
    while (cursor <= endCursor) {
      const key = cursor.toISOString().slice(0, 10);
      labels.push(key);
      homeVisitsSeries.push(Number(homeByDate.get(key)?.homeVisits || 0));
      videoPlaysSeries.push(Number(homeByDate.get(key)?.homeVideoPlays || 0));
      whatsappSeries.push(Number(propertyByDate.get(key)?.whatsappClicks || 0));
      scheduleSeries.push(Number(propertyByDate.get(key)?.scheduleVisitClicks || 0));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    res.json({
      selectedRange: {
        range: selectedRange.range,
        startDate: selectedRange.startKey,
        endDate: selectedRange.endKey
      },
      summary: {
        homeVisitsToday: Number(homeToday._sum.homeVisits || 0),
        homeVisitsLast7Days: Number(homeLast7._sum.homeVisits || 0),
        homeVisitsLast30Days: Number(homeLast30._sum.homeVisits || 0),
        homeVisitsTotal: Number(homeTotal._sum.homeVisits || 0),
        homeVideoPlays: sumNumber(homeRows, (item) => item.homeVideoPlays),
        watched25: sumNumber(homeRows, (item) => item.watched25),
        watched50: sumNumber(homeRows, (item) => item.watched50),
        watched75: sumNumber(homeRows, (item) => item.watched75),
        watched100: sumNumber(homeRows, (item) => item.watched100),
        whatsappClicks: sumNumber(propertyStats, (item) => item.whatsappClicks),
        scheduleVisitClicks: sumNumber(propertyStats, (item) => item.scheduleVisitClicks)
      },
      topViewed,
      topContacts,
      propertyStats,
      charts: {
        labels,
        homeVisits: homeVisitsSeries,
        videoPlays: videoPlaysSeries,
        whatsappClicks: whatsappSeries,
        scheduleVisitClicks: scheduleSeries
      }
    });
  })
);

export default router;
