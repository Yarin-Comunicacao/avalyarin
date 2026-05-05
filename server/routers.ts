import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
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
        overallScore: z.number().min(1).max(10).optional(),
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
          score: z.number().min(1).max(10),
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
});

export type AppRouter = typeof appRouter;
