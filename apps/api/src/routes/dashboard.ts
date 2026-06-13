import { PropertyReviewStatus } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, BACKOFFICE_ROLES, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

function buildDashboardFallback() {
  return {
    properties: 0,
    developments: 0,
    owners: 0,
    posts: 0,
    testimonials: 0,
    leads: 0,
    featured: 0,
    launches: 0,
    pendingApproval: 0,
    totalViews: 0,
    mostViewedProperty: null,
    topViewedProperties: [],
    last7dViews: 0,
    last30dViews: 0,
    recentProperties: [],
    recentLeads: [],
    recentAccesses: []
  };
}

let lastDashboardPayload: ReturnType<typeof buildDashboardFallback> | null = null;

router.get(
  '/',
  authMiddleware,
  requireRole(BACKOFFICE_ROLES),
  asyncHandler(async (_req, res) => {
    try {
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const [
        properties,
        developments,
        posts,
        testimonials,
        leads,
        featured,
        launches,
        pendingApproval,
        totalViews,
        ownerRows,
        recentProperties,
        recentLeads,
        recentAccesses,
        topViewedProperties,
        last7dViews,
        last30dViews
      ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { category: 'LOTEAMENTO' } }),
      prisma.post.count(),
      prisma.testimonial.count(),
      prisma.lead.count(),
      prisma.property.count({ where: { featured: true, approved: true } }),
      prisma.property.count({ where: { launch: true, approved: true } }),
      prisma.property.count({ where: { reviewStatus: PropertyReviewStatus.PENDING } }),
      prisma.property.aggregate({ _sum: { viewCount: true } }),
      prisma.property.findMany({
        where: { ownerEmail: { not: null } },
        distinct: ['ownerEmail'],
        select: { ownerEmail: true }
      }),
      prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          propertyCode: true,
          city: true,
          district: true,
          createdAt: true,
          featured: true,
          launch: true,
          approved: true,
          reviewStatus: true,
          submittedByOwner: true,
          ownerName: true,
          viewCount: true
        }
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          propertyCode: true,
          propertyTitle: true,
          propertyCity: true,
          pageOrigin: true,
          createdAt: true,
          status: true
        }
      }),
      prisma.propertyView.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          visitorKey: true,
          createdAt: true,
          property: {
            select: {
              id: true,
              title: true,
              propertyCode: true,
              city: true,
              district: true,
              slug: true
            }
          }
        }
      }),
      prisma.property.findMany({
        where: { approved: true },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          slug: true,
          title: true,
          propertyCode: true,
          city: true,
          district: true,
          viewCount: true,
          createdAt: true
        }
      }),
      prisma.propertyView.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.propertyView.count({ where: { createdAt: { gte: last30Days } } })
    ]);

    const normalizedTopViewedProperties = topViewedProperties.map((item) => ({
      ...item,
      viewCount: item.viewCount || 0
    }));

      const payload = {
        properties,
        developments,
        owners: ownerRows.length,
        posts,
        testimonials,
        leads,
        featured,
        launches,
        pendingApproval,
        totalViews: totalViews._sum.viewCount || 0,
        mostViewedProperty: normalizedTopViewedProperties[0] || null,
        topViewedProperties: normalizedTopViewedProperties,
        last7dViews,
        last30dViews,
        recentProperties,
        recentLeads,
        recentAccesses
      };

      lastDashboardPayload = payload;
      res.json(payload);
    } catch (error) {
      console.warn('[dashboard] fallback payload returned after query failure', error);
      res.json(lastDashboardPayload || buildDashboardFallback());
    }
  })
);

export default router;
