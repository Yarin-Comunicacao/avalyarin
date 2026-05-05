import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router, adminProcedure, businessProcedure } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { z } from "zod";
import {
  getAllCategories,
  getCategoriesWithCounts,
  getCategoryBySlug,
  getEstablishmentsByCategory,
  getEstablishmentBySlug,
  getEstablishmentWithMenu,
  getNearbyEstablishments,
  searchAll,
  saveRating,
  getUserRatings,
  getRatingById,
  getEstablishmentRatings,
  // Admin
  getAdminStats,
  getAllUsers,
  updateUserRole,
  adminUpdateEstablishment,
  adminDeleteEstablishment,
  getAllClaims,
  reviewClaim,
  // Business
  submitClaim,
  getUserClaims,
  getBusinessEstablishments,
  businessUpdateEstablishment,
  businessAddMenuItem,
  businessDeleteMenuItem,
  // Rankings
  getUserRatedEstablishmentsByCategory,
  getUserRanking,
  saveUserRanking,
  getUserRankingSummary,
  getDiscoveryEstablishments,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await getCategoriesWithCounts();
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getCategoryBySlug(input.slug);
      }),
  }),

  establishments: router({
    byCategory: publicProcedure
      .input(z.object({
        categorySlug: z.string(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getEstablishmentsByCategory(input.categorySlug, input.limit, input.offset);
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getEstablishmentBySlug(input.slug);
      }),
    
    getWithMenu: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await getEstablishmentWithMenu(input.slug);
      }),
    
    nearby: publicProcedure
      .input(z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().min(0.5).max(50).default(3),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        return await getNearbyEstablishments(input.lat, input.lng, input.radiusKm, input.limit);
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return await searchAll(input.query);
      }),
  }),

  ratings: router({
    save: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["direct", "analytic"]),
        visitDate: z.string().optional(),
        overallScore: z.number().min(0).max(115).optional(),
        subtotal: z.number().optional(),
        servicePercent: z.number().optional(),
        couvert: z.number().optional(),
        valet: z.number().optional(),
        parking: z.number().optional(),
        totalCost: z.number().optional(),
        criteriaScores: z.any().optional(),
        bonusScores: z.any().optional(),
        items: z.array(z.object({
          menuItemId: z.number().optional(),
          itemName: z.string(),
          score: z.number().min(0).max(115),
          comment: z.string().optional(),
          quantity: z.number().optional(),
          price: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        return await saveRating(userId, input);
      }),

    myRatings: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        return await getUserRatings(userId, limit, offset);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getRatingById(input.id, ctx.user!.id);
      }),

    byEstablishment: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getEstablishmentRatings(input.establishmentId, input.limit, input.offset);
      }),
  }),

  // ============ ADMIN PANEL ============
  admin: router({
    stats: adminProcedure.query(async () => {
      return await getAdminStats();
    }),

    users: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        return await getAllUsers(input?.limit ?? 50, input?.offset ?? 0);
      }),

    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin", "owner", "business"]),
      }))
      .mutation(async ({ input }) => {
        return await updateUserRole(input.userId, input.role);
      }),

    updateEstablishment: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        neighborhood: z.string().optional(),
        phone: z.string().optional(),
        instagram: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await adminUpdateEstablishment(id, data);
      }),

    deleteEstablishment: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await adminDeleteEstablishment(input.id);
      }),

    claims: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getAllClaims(input?.status);
      }),

    reviewClaim: adminProcedure
      .input(z.object({
        claimId: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await reviewClaim(input.claimId, ctx.user!.id, input.status, input.adminNotes);
      }),
  }),

  // ============ RANKINGS ============
  rankings: router({
    /** Get establishments the user has rated in a category (options for ranking) */
    ratedInCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getUserRatedEstablishmentsByCategory(ctx.user!.id, input.categoryId);
      }),

    /** Get the user's current ranking for a category */
    getByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getUserRanking(ctx.user!.id, input.categoryId);
      }),

    /** Save/update the user's ranking for a category */
    save: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        items: z.array(z.object({
          establishmentId: z.number(),
          position: z.number().min(1).max(10),
        })).min(1).max(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return await saveUserRanking(ctx.user!.id, input.categoryId, input.items);
      }),

    /** Get summary of all user rankings across categories */
    summary: protectedProcedure.query(async ({ ctx }) => {
      return await getUserRankingSummary(ctx.user!.id);
    }),

    /** Get discovery suggestions (unrated establishments nearby) */
    discover: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        limit: z.number().min(1).max(20).default(6),
      }))
      .query(async ({ ctx, input }) => {
        return await getDiscoveryEstablishments(ctx.user!.id, input.categoryId, input.lat, input.lng, input.limit);
      }),
  }),

  // ============ BUSINESS PANEL ============
  business: router({
    submitClaim: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        businessName: z.string().min(1),
        contactPhone: z.string().min(1),
        contactEmail: z.string().email(),
        proofDescription: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return await submitClaim(ctx.user!.id, input);
      }),

    myClaims: protectedProcedure.query(async ({ ctx }) => {
      return await getUserClaims(ctx.user!.id);
    }),

    myEstablishments: businessProcedure.query(async ({ ctx }) => {
      return await getBusinessEstablishments(ctx.user!.id);
    }),

    updateEstablishment: businessProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        instagram: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { establishmentId, ...data } = input;
        return await businessUpdateEstablishment(ctx.user!.id, establishmentId, data);
      }),

    addMenuItem: businessProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { establishmentId, ...data } = input;
        return await businessAddMenuItem(ctx.user!.id, establishmentId, data);
      }),

    deleteMenuItem: businessProcedure
      .input(z.object({ menuItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await businessDeleteMenuItem(ctx.user!.id, input.menuItemId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
