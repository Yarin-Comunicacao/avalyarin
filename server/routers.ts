import { COOKIE_NAME } from "@shared/const";
import { ADDRESS_REGEX } from "@shared/address-validation";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router, adminProcedure, businessProcedure, supportProcedure, ownerProcedure, criticProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
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
  getEstablishmentsByNeighborhood,
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
  getBusinessNotifications,
  businessUpdateEstablishment,
  businessAddMenuItem,
  businessUpdateMenuItem,
  businessDeleteMenuItem,
  getBusinessRatingNotifications,
  markBusinessNotificationRead,
  // Rankings
  getUserRatedEstablishmentsByCategory,
  getUserRanking,
  saveUserRanking,
  getUserRankingSummary,
  getDiscoveryEstablishments,
  // Username
  checkUsernameAvailable,
  generateUsernameSuggestions,
  setUsername,
  getUserProfile,
  getPublicProfileByUsername,
  updateUserProfile,
  // Create
  createEstablishment,
  // Code Backup
  generateCodeBackup,
  getCodeBackups,
  // Survey & Age Verification
  saveSurveyData,
  getUserSurveyData,
  submitAgeVerification,
  getAgeVerificationRequests,
  reviewAgeVerification,
  getUserAgeVerificationStatus,
  // Events
  createGroupEvent,
  getGroupEvents,
  getEventById,
  getEventRsvps,
  rsvpEvent,
  getUserEvents,
  cancelGroupEvent,
  getEventsByEstablishment,
  saveUserLocation,
  getIntegration,
  setIntegration,
  getAllIntegrations,
  deleteIntegration,
} from "./db";
import {
  createGroup,
  getMyGroups,
  getFollowedGroups,
  getGroupById,
  getGroupMembers,
  deleteGroup,
  inviteToGroup,
  getPendingInvites,
  respondToInvite,
  followGroup,
  unfollowGroup,
  shareRatingToGroup,
  getGroupFeed,
  searchUsersByUsername,
  discoverInfluencerGroups,
  isGroupMember,
  removeMemberFromGroup,
  getUserPlanOrDefault,
  countUserGroups,
  updateGroup,
} from "./db-groups";
import {
  getUserNobilitySummary,
  getUserCategoryBadges,
  getUserNeighborhoodBadges,
  getUserEstablishmentBadges,
  getCategoryNobilityProgress,
  getNeighborhoodNobilityProgress,
  getEstablishmentNobilityProgress,
  NOBILITY_TITLES,
  CATEGORY_THRESHOLDS,
  NEIGHBORHOOD_THRESHOLDS,
  ESTABLISHMENT_THRESHOLDS,
  ELIGIBLE_NEIGHBORHOODS,
  getSpecialNeighborhoodInsignias,
  getNeighborhoodPreposition,
  SPECIAL_NEIGHBORHOOD_INSIGNIAS,
} from "./db-nobility";
import {
  getUserProgression,
  checkAndProcessLevelUp,
  PROGRESSION_LEVELS,
} from "./db-progression";
import {
  getActivePostsForHome,
  getActivePostsByType,
  getSavedEstablishmentPosts,
  incrementPostView,
  incrementPostTap,
  toggleSaveEstablishment,
  isEstablishmentSaved,
  getUserSavedEstablishmentIds,
  createEstablishmentPost,
  expireOldPosts,
  getSavedEstablishmentsWithDetails,
} from "./db-posts";
import {
  createPromoCode,
  validatePromoCode,
  usePromoCode,
  getUserPromoCodes,
  deletePromoCode,
  getAdminPromoCodes,
  approvePromoCode,
  rejectPromoCode,
  isCodeTaken,
  getPromoCodeStats,
} from "./db-promo";
import {
  getAdminCategoriesWithCounts,
  getAdminEstablishmentsByCategory,
  toggleEstablishmentStatus,
  getAdminEstablishmentDetail,
  adminAddMenuItem,
  adminUpdateMenuItem,
  adminDeleteMenuItem,
  uploadMenuItemImage,
  getMenuCategories,
  getMenuCategoriesWithOrder,
  reorderMenuCategories,
} from "./db-admin-estab";
import {
  getRatingsForInfluencerApplication,
  submitInfluencerApplication,
  getInfluencerApplications,
  approveInfluencerApplication,
  rejectInfluencerApplication,
  getMyInfluencerApplication,
  proposePartnership,
  respondToPartnership,
  supportApprovePartnership,
  supportRejectPartnership,
  getInfluencerPartnerships,
  getEstablishmentPartnerships,
  getReceivedB2BPartnerships,
  listAvailableEstablishmentsForPartnership,
  getSupportPendingPartnerships,
} from "./db-influencer";
import {
  getUserPlanDetails,
  canUserRate,
  upgradePlan,
  cancelSubscription,
  downgradePlan,
  getBusinessPlanDetails,
  upgradeBusinessPlan,
  adminGrantPlan,
  getAdminSubscriptions,
  PLAN_LIMITS,
  BUSINESS_PLAN_LIMITS,
} from "./db-plans";
import {
  getAdminDashboard,
  getBusinessInsights,
  getUserStats,
} from "./db-analytics";
import {
  registerQrScan,
  getLatestQrScan,
  classifyRatingSource,
  determineRatingSource,
  checkVerifiedStatus,
  updateVerifiedStatus,
  getUserQrScans,
  isNearEstablishment,
} from "./db-qr";
import {
  followInfluencer,
  unfollowInfluencer,
  isFollowingInfluencer,
  getFollowerCount,
  getFollowedInfluencers,
  getInfluencerProfile,
  getInfluencerRatings,
  getInfluencerFeed,
  listInfluencers,
} from "./db-influencer-follow";
import {
  getOwnerStats,
  getOwnerGrowth,
  getOwnerFinancials,
  getSystemHealth,
  getSystemAuditLog,
} from "./db-owner";
import {
  submitCriticApplication,
  getCriticApplications,
  approveCriticApplication,
  rejectCriticApplication,
  getMyCriticProfile,
  updateCriticProfile,
  getCriticPublicProfile,
  getCriticRatings,
  hasEstablishmentCriticSeal,
} from "./db-critic";
import {
  getSupportAssignments,
  getSupportTickets,
  supportHasAccessToEstab,
  assignEstabsToSupport,
  revokeEstabFromSupport,
  createSupportTicket,
  resolveSupportTicket,
  getSupportStats,
  getAllSupportUsers,
  getSupportAssignmentCounts,
} from "./db-support";
import {
  sendGroupMessage,
  getGroupMessages,
  sendSupportMessage,
  getSupportConversation,
  getSupportConversationList,
  markSupportMessagesAsRead,
  getUserSupportMessages,
  sendEstabSupportMessage,
  getEstabSupportMessages,
  markEstabMessagesAsRead,
  getSupportEstabConversationList,
  sendBusinessBroadcast,
  getBusinessBroadcasts,
  getUserBroadcastFeed,
  followBusiness,
  unfollowBusiness,
  isFollowingBusiness,
  getBusinessFollowerCount,
  getUserFollowedEstablishments,
} from "./db-chat";
import {
  followUser, unfollowUser, isFollowing, isMutualFollow,
  getFollowers, getFollowing, getFollowCounts, getMutualFollows,
  sendDirectMessage, getDirectMessages, markDMsAsRead, getDMConversations,
} from "./db-follows";
import {
  createEstablishmentEvent,
  listActiveEvents,
  listBusinessEvents,
  cancelEstablishmentEvent,
  getEstablishmentEvent,
  EVENT_TYPES,
} from "./db-events";

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

    byNeighborhood: publicProcedure
      .input(z.object({ neighborhood: z.string().min(1), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getEstablishmentsByNeighborhood(input.neighborhood, input.limit || 50);
      }),

    // Public: list active events for an establishment
    activeEvents: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await listActiveEvents(input.establishmentId);
      }),

    // Public: get single event details
    getEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await getEstablishmentEvent(input.eventId);
      }),
  }),

  ratings: router({
    save: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["direct", "analytic"]),
        visitDate: z.string().optional(),
        overallScore: z.number().min(0).max(10).optional(),
        subtotal: z.number().optional(),
        servicePercent: z.number().optional(),
        couvert: z.number().optional(),
        valet: z.number().optional(),
        parking: z.number().optional(),
        totalCost: z.number().optional(),
        criteriaScores: z.any().optional(),

        items: z.array(z.object({
          menuItemId: z.number().optional(),
          itemName: z.string(),
          score: z.number().min(0).max(10),
          comment: z.string().optional(),
          quantity: z.number().optional(),
          price: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        // Business accounts cannot create ratings
        if (ctx.user!.role === "business") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Contas empresariais não podem avaliar estabelecimentos." });
        }
        // Determine rating source (presencial/hibrido/remoto)
        const source = await determineRatingSource(userId, input.establishmentId);
        // Influencers can only rate via QR (presencial or hibrido)
        if (ctx.user!.role === "influencer" && source === "remoto") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Influencers só podem avaliar presencialmente. Escaneie o QR Code do estabelecimento antes de avaliar.",
          });
        }
        // Check daily rating limit based on plan (influencers are unlimited)
        if (ctx.user!.role !== "influencer") {
          const rateCheck = await canUserRate(userId);
          if (!rateCheck.allowed) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Limite diário de avaliações atingido (${PLAN_LIMITS[rateCheck.plan].dailyRatings}/dia). Faça upgrade do seu plano para avaliar mais!`,
            });
          }
        }
        const result = await saveRating(userId, { ...input, source });
        // Check verified status after saving (non-blocking)
        try {
          if (source === "presencial") {
            await updateVerifiedStatus(userId);
          }
        } catch (e) {
          console.error("[Verified] Status check failed:", e);
        }
        // Check level-up after saving rating (non-blocking)
        let levelUp = null;
        try {
          levelUp = await checkAndProcessLevelUp(userId);
        } catch (e) {
          console.error("[Progression] Level-up check failed:", e);
        }
        // Calculate relevance score (non-blocking, fire-and-forget)
        if (result?.id) {
          import("./relevance").then(({ scoreAndSaveRelevance }) => {
            scoreAndSaveRelevance(result.id).catch((e: unknown) =>
              console.error("[Relevance] Score calculation failed:", e)
            );
          });
        }
        return { ...result, levelUp, source };
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
        filterItemName: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await getEstablishmentRatings(input.establishmentId, input.limit, input.offset, input.filterItemName);
      }),

    publicUserRatings: publicProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getUserRatings(input.userId, input.limit, input.offset);
      }),

    uploadPhoto: protectedProcedure
      .input(z.object({
        ratingId: z.number(),
        base64Data: z.string(), // base64-encoded image
        mimeType: z.string().default("image/jpeg"),
        taggedItemIds: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        const buffer = Buffer.from(input.base64Data, "base64");
        const ext = input.mimeType.includes("png") ? "png" : "jpg";
        const key = `ratings/${input.ratingId}/photo_${Date.now()}.${ext}`;
        const { storagePut } = await import("./storage");
        const { key: storageKey, url } = await storagePut(key, buffer, input.mimeType);
        const { saveRatingPhoto } = await import("./db");
        return await saveRatingPhoto({
          ratingId: input.ratingId,
          userId,
          storageKey,
          url,
          taggedItemIds: input.taggedItemIds,
        });
      }),

    getPhotos: publicProcedure
      .input(z.object({ ratingId: z.number() }))
      .query(async ({ input }) => {
        const { getRatingPhotos } = await import("./db");
        return await getRatingPhotos(input.ratingId);
      }),

    getEstablishmentPhotos: publicProcedure
      .input(z.object({
        establishmentId: z.number(),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        const { getEstablishmentPhotos } = await import("./db");
        return await getEstablishmentPhotos(input.establishmentId, input.limit);
      }),

    // Gallery — user's own photos
    myGallery: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const { getUserGallery } = await import("./db");
        return await getUserGallery(ctx.user!.id, input.limit, input.offset);
      }),

    // Gallery — any user's public photos
    userGallery: publicProcedure
      .input(z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const { getPublicUserGallery } = await import("./db");
        return await getPublicUserGallery(input.userId, input.limit, input.offset);
      }),

    // Like / Unlike a photo
    toggleLike: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { togglePhotoLike } = await import("./db");
        return await togglePhotoLike(input.photoId, ctx.user!.id);
      }),

    // Get like status for a batch of photos
    likesBatch: publicProcedure
      .input(z.object({ photoIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const { getPhotoLikesBatch } = await import("./db");
        const userId = (ctx as any).user?.id;
        return await getPhotoLikesBatch(input.photoIds, userId);
      }),

    // Share photo to a group
    shareToGroup: protectedProcedure
      .input(z.object({
        photoId: z.number(),
        groupId: z.number(),
        comment: z.string().max(280).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { sharePhotoToGroup } = await import("./db");
        return await sharePhotoToGroup({
          photoId: input.photoId,
          userId: ctx.user!.id,
          groupId: input.groupId,
          comment: input.comment,
        });
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
        role: z.enum(["user", "influencer", "business", "support", "admin", "owner"]),
      }))
      .mutation(async ({ input }) => {
        return await updateUserRole(input.userId, input.role);
      }),

    updateEstablishment: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().refine(
          (val) => !val || ADDRESS_REGEX.test(val.trim()),
          { message: 'Endereço deve começar com logradouro válido (Rua, Avenida, Alameda, etc.)' }
        ).optional(),
        addressNumber: z.string().refine(
          (val) => {
            if (!val || val.trim() === '') return true;
            const t = val.trim().toLowerCase();
            if (t === 's/n' || t === 'sn') return true;
            const n = parseInt(t, 10);
            return !isNaN(n) && n >= 1 && n <= 15000 && String(n) === t;
          },
          { message: 'Número deve ser de 1 a 15000 ou "s/n"' }
        ).optional(),
        complement: z.string().max(200, 'Complemento deve ter no máximo 200 caracteres').optional(),
        description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
        neighborhood: z.string().optional(),
        phone: z.string().optional(),
        instagram: z.string().optional(),
        hours: z.string().optional(),
        active: z.boolean().optional(),
        status: z.enum(['active', 'hidden', 'pending']).optional(),
        image: z.string().optional(),
        logo: z.string().optional(),
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

    establishmentsByCategory: adminProcedure
      .input(z.object({
        categorySlug: z.string(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getEstablishmentsByCategory(input.categorySlug, input.limit, input.offset, true);
      }),

    createEstablishment: adminProcedure
      .input(z.object({
        name: z.string().min(2).max(255),
        categoryId: z.number().min(1),
        address: z.string().min(5, "Endereço é obrigatório (mín. 5 caracteres)").refine(
          (val) => ADDRESS_REGEX.test(val.trim()),
          { message: 'Endereço deve começar com logradouro válido (Rua, Avenida, Alameda, etc.)' }
        ),
        addressNumber: z.string().refine(
          (val) => {
            if (!val || val.trim() === '') return true;
            const t = val.trim().toLowerCase();
            if (t === 's/n' || t === 'sn') return true;
            const n = parseInt(t, 10);
            return !isNaN(n) && n >= 1 && n <= 15000 && String(n) === t;
          },
          { message: 'Número deve ser de 1 a 15000 ou "s/n"' }
        ).optional(),
        complement: z.string().max(200, 'Complemento máx. 200 caracteres').optional(),
        description: z.string().max(500, 'Descrição máx. 500 caracteres').optional(),
        neighborhood: z.string().min(2, "Bairro é obrigatório"),
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        phone: z.string().min(8, "Telefone é obrigatório (mín. 8 caracteres)"),
        instagram: z.string().min(2, "Instagram é obrigatório"),
        hours: z.string().min(3, "Horário de funcionamento é obrigatório"),
        image: z.string().optional(),
        logo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validar complemento obrigatório para endereços em shoppings/galerias/food halls
        const MULTI_TENANT_KEYWORDS = /shopping|galeria|food hall|mercado municipal|food park|centro comercial|mall/i;
        if (MULTI_TENANT_KEYWORDS.test(input.address || '') && (!input.complement || input.complement.trim().length < 2)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Complemento obrigatório para estabelecimentos em shoppings, galerias ou food halls (ex: Loja 42, Piso 2, Box 15)',
          });
        }
        return await createEstablishment(input);
      }),

    generateCodeBackup: adminProcedure
      .mutation(async () => {
        return await generateCodeBackup();
      }),

    getCodeBackups: adminProcedure
      .query(async () => {
        return await getCodeBackups();
      }),

    // ============ ADMIN ESTAB MANAGEMENT ============
    categoriesWithCounts: adminProcedure.query(async () => {
      return await getAdminCategoriesWithCounts();
    }),

    estabByCategory: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        status: z.enum(['active', 'hidden', 'pending']).default('active'),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        return await getAdminEstablishmentsByCategory(input.categoryId, input.status, input.limit, input.offset);
      }),

    toggleVisibility: adminProcedure
      .input(z.object({
        ids: z.array(z.number()).min(1),
        status: z.enum(['active', 'hidden', 'pending']),
      }))
      .mutation(async ({ input }) => {
        return await toggleEstablishmentStatus(input.ids, input.status);
      }),

    estabDetail: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getAdminEstablishmentDetail(input.id);
      }),

    addMenuItem: adminProcedure
      .input(z.object({
        establishmentId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        imageThumbUrl: z.string().optional(),
        imageThumbKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await adminAddMenuItem(input);
      }),

    updateMenuItem: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
        imageThumbUrl: z.string().optional(),
        imageThumbKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await adminUpdateMenuItem(id, data);
      }),

    deleteMenuItem: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await adminDeleteMenuItem(input.id);
      }),

    menuCategories: adminProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getMenuCategories(input.establishmentId);
      }),

    menuCategoriesWithOrder: adminProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getMenuCategoriesWithOrder(input.establishmentId);
      }),

    reorderMenuCategories: adminProcedure
      .input(z.object({
        establishmentId: z.number(),
        orderedNames: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        return await reorderMenuCategories(input.establishmentId, input.orderedNames);
      }),

    // Influencer applications
    influencerApplications: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await getInfluencerApplications(input?.status);
      }),

    approveInfluencer: adminProcedure
      .input(z.object({
        applicationId: z.number(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await approveInfluencerApplication(input.applicationId, input.adminNotes);
      }),

    rejectInfluencer: adminProcedure
      .input(z.object({
        applicationId: z.number(),
        adminNotes: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return await rejectInfluencerApplication(input.applicationId, input.adminNotes);
      }),

    // Partnerships - admin can still view (delegated to support for approval)
    pendingPartnerships: adminProcedure.query(async () => {
      return await getSupportPendingPartnerships();
    }),

    // ============ DUPLICATE ALERTS ============
    duplicateAlerts: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
      .query(async ({ input }) => {
        const { listDuplicateAlerts } = await import("./db");
        return await listDuplicateAlerts(input.status);
      }),

    duplicateAlertCount: adminProcedure.query(async () => {
      const { getPendingDuplicateAlertCount } = await import("./db");
      return await getPendingDuplicateAlertCount();
    }),

    reviewDuplicate: adminProcedure
      .input(z.object({
        alertId: z.number(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { reviewDuplicateAlert } = await import("./db");
        await reviewDuplicateAlert(input.alertId, input.decision, ctx.user!.id, input.notes);
        return { success: true };
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
        address: z.string().refine(
          (val) => !val || ADDRESS_REGEX.test(val.trim()),
          { message: 'Endereço deve começar com logradouro válido (Rua, Avenida, Alameda, etc.)' }
        ).optional(),
        addressNumber: z.string().refine(
          (val) => {
            if (!val || val.trim() === '') return true;
            const t = val.trim().toLowerCase();
            if (t === 's/n' || t === 'sn') return true;
            const n = parseInt(t, 10);
            return !isNaN(n) && n >= 1 && n <= 15000 && String(n) === t;
          },
          { message: 'Número deve ser de 1 a 15000 ou "s/n"' }
        ).optional(),
        complement: z.string().max(200, 'Complemento máx. 200 caracteres').optional(),
        description: z.string().max(500, 'Descrição máx. 500 caracteres').optional(),
        neighborhood: z.string().optional(),
        phone: z.string().optional(),
        instagram: z.string().optional(),
        hours: z.string().optional(),
        image: z.string().optional(),
        logo: z.string().optional(),
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

    updateMenuItem: businessProcedure
      .input(z.object({
        menuItemId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { menuItemId, ...data } = input;
        return await businessUpdateMenuItem(ctx.user!.id, menuItemId, data);
      }),

    deleteMenuItem: businessProcedure
      .input(z.object({ menuItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await businessDeleteMenuItem(ctx.user!.id, input.menuItemId);
      }),

    notifications: businessProcedure.query(async ({ ctx }) => {
      return await getBusinessNotifications(ctx.user!.id);
    }),

    ratingNotifications: businessProcedure.query(async ({ ctx }) => {
      return await getBusinessRatingNotifications(ctx.user!.id);
    }),

    markNotificationRead: businessProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await markBusinessNotificationRead(ctx.user!.id, input.notificationId);
      }),

    // Partnerships for business
    partnerships: businessProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getEstablishmentPartnerships(input.establishmentId);
      }),

    respondPartnership: businessProcedure
      .input(z.object({
        partnershipId: z.number(),
        accept: z.boolean(),
        estabNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await respondToPartnership(input.partnershipId, input.accept, input.estabNotes);
      }),

    // Business proposes partnership to an influencer
    proposePartnership: businessProcedure
      .input(z.object({
        partnershipType: z.enum(["influencer", "business"]),
        establishmentId: z.number(),
        influencerId: z.number().optional(),
        partnerEstablishmentId: z.number().optional(),
        terms: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the business user owns this establishment
        const myEstabs = await getBusinessEstablishments(ctx.user!.id);
        const ownsEstab = myEstabs.some((e: any) => e.id === input.establishmentId);
        if (!ownsEstab) throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a este estabelecimento." });

        const id = await proposePartnership({
          partnershipType: input.partnershipType,
          influencerId: input.influencerId,
          partnerEstablishmentId: input.partnerEstablishmentId,
          establishmentId: input.establishmentId,
          terms: input.terms,
          proposedBy: "establishment",
        });
        return { id };
      }),

    // List available influencers for partnership proposals
    availableInfluencers: businessProcedure.query(async () => {
      return await listInfluencers();
    }),

    // List available establishments for B2B partnership
    availableEstablishments: businessProcedure
      .input(z.object({ excludeIds: z.array(z.number()).optional(), search: z.string().optional() }))
      .query(async ({ input }) => {
        return await listAvailableEstablishmentsForPartnership(input.excludeIds ?? [], input.search);
      }),

    // Get received B2B partnership proposals
    receivedB2BPartnerships: businessProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getReceivedB2BPartnerships(input.establishmentId);
      }),

    // Respond to a received B2B partnership (accept/reject)
    respondToB2BPartnership: businessProcedure
      .input(z.object({
        partnershipId: z.number(),
        accept: z.boolean(),
        estabNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await respondToPartnership(input.partnershipId, input.accept, input.estabNotes);
      }),

    // Send broadcast to followers
    sendBroadcast: businessProcedure
      .input(z.object({ establishmentId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        // Verify the business user owns this establishment
        const myEstabs = await getBusinessEstablishments(ctx.user!.id);
        const ownsEstab = myEstabs.some((e: any) => e.id === input.establishmentId);
        if (!ownsEstab) throw new TRPCError({ code: "FORBIDDEN", message: "Voc\u00ea n\u00e3o tem acesso a este estabelecimento." });
        return await sendBusinessBroadcast(ctx.user!.id, input.establishmentId, input.content);
      }),

    // Get broadcasts for an establishment
    broadcasts: businessProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getBusinessBroadcasts(input.establishmentId);
      }),

    // Get follower count
    followerCount: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getBusinessFollowerCount(input.establishmentId);
      }),

    // ===== ESTABLISHMENT EVENTS =====
    createEvent: businessProcedure
      .input(z.object({
        establishmentId: z.number(),
        title: z.string().min(3).max(255),
        description: z.string().min(200).max(550),
        coverImageUrl: z.string(),
        coverImageKey: z.string().optional(),
        startDate: z.number(),
        endDate: z.number(),
        locationType: z.enum(["establishment", "custom"]),
        customAddress: z.string().optional(),
        customAddressNumber: z.string().optional(),
        customNeighborhood: z.string().optional(),
        customCity: z.string().optional(),
        entryType: z.enum(["free", "paid"]),
        paidType: z.enum(["single", "batches"]).optional(),
        singlePrice: z.number().optional(),
        hasDoorPrice: z.boolean().optional(),
        doorPrice: z.number().optional(),
        eventType: z.string(),
        ticketUrl: z.string().url().optional(),
        batches: z.array(z.object({
          batchNumber: z.number(),
          batchName: z.string(),
          price: z.number(),
          expiresAt: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const myEstabs = await getBusinessEstablishments(ctx.user!.id);
        const ownsEstab = myEstabs.some((e: any) => e.id === input.establishmentId);
        if (!ownsEstab) throw new TRPCError({ code: "FORBIDDEN", message: "Voc\u00ea n\u00e3o tem acesso a este estabelecimento." });
        if (input.endDate <= input.startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "Data de t\u00e9rmino deve ser posterior ao in\u00edcio." });
        if (input.locationType === "custom" && !input.customAddress) throw new TRPCError({ code: "BAD_REQUEST", message: "Endere\u00e7o customizado \u00e9 obrigat\u00f3rio." });
        return await createEstablishmentEvent({ ...input, createdById: ctx.user!.id });
      }),

    listEvents: businessProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await listBusinessEvents(input.establishmentId);
      }),

    cancelEvent: businessProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await cancelEstablishmentEvent(input.eventId, ctx.user!.id);
      }),

    getEventTypes: publicProcedure.query(() => EVENT_TYPES),
   }),

  // User profile & username
  // Survey data persistence
  survey: router({
    // Public endpoint: returns active survey questions by phase (dynamic from DB)
    questions: publicProcedure
      .input(z.object({ phase: z.enum(["onboarding", "explorer", "connoisseur"]) }))
      .query(async ({ input }) => {
        const { getSurveyQuestions } = await import("./db");
        const all = await getSurveyQuestions(input.phase);
        // Return only active questions, ordered by sortOrder
        return all.filter(q => q.active);
      }),
    save: protectedProcedure
      .input(z.object({
        birthdate: z.string().optional(),
        region: z.string().optional(),
        frequency: z.string().optional(),
        avgSpend: z.string().optional(),
        categories: z.array(z.string()).optional(),
        priorities: z.array(z.string()).optional(),
        discovery: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await saveSurveyData(ctx.user!.id, input, input.birthdate);
      }),
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSurveyData(ctx.user!.id);
    }),
  }),

  // Age verification
  ageVerification: router({
    submit: protectedProcedure
      .input(z.object({
        documentUrl: z.string().min(1),
        documentKey: z.string().min(1),
        requestedBirthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      }))
      .mutation(async ({ ctx, input }) => {
        return await submitAgeVerification(ctx.user!.id, input);
      }),
    status: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAgeVerificationStatus(ctx.user!.id);
    }),
    // Admin-only
    list: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return await getAgeVerificationRequests(input?.status);
      }),
    review: adminProcedure
      .input(z.object({
        requestId: z.number(),
        status: z.enum(["approved", "rejected"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await reviewAgeVerification(input.requestId, ctx.user!.id, input.status, input.adminNotes);
      }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProfile(ctx.user!.id);
    }),
    checkUsername: protectedProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ ctx, input }) => {
        const available = await checkUsernameAvailable(input.username, ctx.user!.id);
        return { available };
      }),
    suggestUsernames: protectedProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ ctx, input }) => {
        return await generateUsernameSuggestions(input.name, ctx.user!.id);
      }),
    setUsername: protectedProcedure
      .input(z.object({ username: z.string().min(3).max(30) }))
      .mutation(async ({ ctx, input }) => {
        return await setUsername(ctx.user!.id, input.username);
      }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(100).optional(),
        username: z.string().min(3).max(30).optional(),
        birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await updateUserProfile(ctx.user!.id, input);
      }),
    saveLocation: protectedProcedure
      .input(z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }))
      .mutation(async ({ ctx, input }) => {
        return await saveUserLocation(ctx.user!.id, input.lat, input.lng);
      }),
    publicByUsername: publicProcedure
      .input(z.object({ username: z.string().min(1) }))
      .query(async ({ input }) => {
        return await getPublicProfileByUsername(input.username);
      }),
  }),

  groups: router({
    // Get user's own groups (private + influencer they created)
    myGroups: protectedProcedure.query(async ({ ctx }) => {
      return await getMyGroups(ctx.user!.id);
    }),

    // Get influencer groups user follows
    followedGroups: protectedProcedure.query(async ({ ctx }) => {
      return await getFollowedGroups(ctx.user!.id);
    }),

    // Discover influencer groups
    discover: protectedProcedure.query(async ({ ctx }) => {
      return await discoverInfluencerGroups(ctx.user!.id);
    }),

    // Get group details
    getById: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new Error("Grupo não encontrado");
        const isMember = await isGroupMember(input.groupId, ctx.user!.id);
        const members = isMember ? await getGroupMembers(input.groupId) : [];
        return { ...group, isMember, members };
      }),

    // Get group feed (shared ratings)
    feed: protectedProcedure
      .input(z.object({ groupId: z.number(), limit: z.number().default(20), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const isMember = await isGroupMember(input.groupId, ctx.user!.id);
        if (!isMember) throw new Error("Você não é membro deste grupo");
        return await getGroupFeed(input.groupId, input.limit, input.offset);
      }),

    // Create a group
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(255),
        description: z.string().max(500).optional(),
        type: z.enum(["private", "influencer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createGroup({
          name: input.name,
          description: input.description,
          type: input.type,
          creatorId: ctx.user!.id,
        });
      }),

    // Update a group (only creator)
    update: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        name: z.string().min(2).max(255).optional(),
        description: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.creatorId !== ctx.user!.id) throw new Error("Sem permissão");
        await updateGroup(input.groupId, { name: input.name, description: input.description });
        return { success: true };
      }),

    // Delete a group (only creator)
    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.creatorId !== ctx.user!.id) throw new Error("Sem permissão");
        await deleteGroup(input.groupId);
        return { success: true };
      }),

    // Invite user to private group
    invite: protectedProcedure
      .input(z.object({ groupId: z.number(), username: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.type !== "private") throw new Error("Grupo inválido");
        if (group.creatorId !== ctx.user!.id) {
          const isMember = await isGroupMember(input.groupId, ctx.user!.id);
          if (!isMember) throw new Error("Sem permissão");
        }
        // Find user by username
        const results = await searchUsersByUsername(input.username);
        const target = results.find(u => u.username === input.username);
        if (!target) throw new Error("Usuário não encontrado");
        return await inviteToGroup(input.groupId, ctx.user!.id, target.id);
      }),

    // Get pending invites for current user
    pendingInvites: protectedProcedure.query(async ({ ctx }) => {
      return await getPendingInvites(ctx.user!.id);
    }),

    // Respond to invite
    respondInvite: protectedProcedure
      .input(z.object({ inviteId: z.number(), accept: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        return await respondToInvite(input.inviteId, ctx.user!.id, input.accept);
      }),

    // Follow influencer group
    follow: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.type !== "influencer") throw new Error("Grupo inválido");
        await followGroup(input.groupId, ctx.user!.id);
        return { success: true };
      }),

    // Unfollow influencer group
    unfollow: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await unfollowGroup(input.groupId, ctx.user!.id);
        return { success: true };
      }),

    // Share rating to group
    shareRating: protectedProcedure
      .input(z.object({ groupId: z.number(), ratingId: z.number(), note: z.string().max(500).optional() }))
      .mutation(async ({ ctx, input }) => {
        const isMember = await isGroupMember(input.groupId, ctx.user!.id);
        if (!isMember) throw new Error("Você não é membro deste grupo");
        return await shareRatingToGroup(input.groupId, input.ratingId, ctx.user!.id, input.note);
      }),

    // Remove member from group (only creator/admin)
    removeMember: protectedProcedure
      .input(z.object({ groupId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.creatorId !== ctx.user!.id) throw new Error("Sem permissão");
        await removeMemberFromGroup(input.groupId, input.userId);
        return { success: true };
      }),

    // Search users by username (for inviting)
    searchUsers: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return await searchUsersByUsername(input.query, ctx.user!.id);
      }),

    // Get user plan info
    myPlan: protectedProcedure.query(async ({ ctx }) => {
      const plan = await getUserPlanOrDefault(ctx.user!.id);
      const groupCount = await countUserGroups(ctx.user!.id);
      const planType = plan as keyof typeof PLAN_LIMITS;
      return { plan, groupCount, maxGroups: PLAN_LIMITS[planType]?.maxGroups ?? 3 };
    }),
    // ==================== GROUP CHAT ====================
    // Send message to group chat (140 chars max)
    sendMessage: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        content: z.string().min(1).max(140),
        type: z.enum(["text", "share_rating", "share_establishment", "share_profile"]).default("text"),
        referenceId: z.number().optional(),
        referenceSlug: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isMember = await isGroupMember(input.groupId, ctx.user!.id);
        if (!isMember) throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste grupo" });
        const msgId = await sendGroupMessage(input.groupId, ctx.user!.id, input.content, input.type, input.referenceId, input.referenceSlug);
        return { id: msgId };
      }),
    // List messages from group chat
    messages: protectedProcedure
      .input(z.object({ groupId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const isMember = await isGroupMember(input.groupId, ctx.user!.id);
        if (!isMember) throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste grupo" });
        return await getGroupMessages(input.groupId, input.limit, input.offset);
      }),
  }),

  // ============ NOBILITY BADGES ============
  nobility: router({
    // Get full summary of all nobility badges for current user
    summary: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNobilitySummary(ctx.user!.id);
    }),

    // Get category badges only
    categoryBadges: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCategoryBadges(ctx.user!.id);
    }),

    // Get neighborhood badges only
    neighborhoodBadges: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNeighborhoodBadges(ctx.user!.id);
    }),

    // Get establishment badges only
    establishmentBadges: protectedProcedure.query(async ({ ctx }) => {
      return await getUserEstablishmentBadges(ctx.user!.id);
    }),

    // Get progress for a specific category
    categoryProgress: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getCategoryNobilityProgress(ctx.user!.id, input.categoryId);
      }),

    // Get progress for a specific neighborhood
    neighborhoodProgress: protectedProcedure
      .input(z.object({ neighborhood: z.string() }))
      .query(async ({ ctx, input }) => {
        return await getNeighborhoodNobilityProgress(ctx.user!.id, input.neighborhood);
      }),

    // Get progress for a specific establishment
    establishmentProgress: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getEstablishmentNobilityProgress(ctx.user!.id, input.establishmentId);
      }),

    // Get special neighborhood insígnias
    specialInsignias: protectedProcedure.query(async ({ ctx }) => {
      const neighborhoodBadges = await getUserNeighborhoodBadges(ctx.user!.id);
      return await getSpecialNeighborhoodInsignias(ctx.user!.id, neighborhoodBadges);
    }),

    // Public: get nobility summary for any user (for public profiles)
    publicSummary: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getUserNobilitySummary(input.userId);
      }),
    // Get constants (thresholds, titles, eligible neighborhoods)
    constants: publicProcedure.query(() => {
      return {
        titles: NOBILITY_TITLES,
        categoryThresholds: CATEGORY_THRESHOLDS,
        neighborhoodThresholds: NEIGHBORHOOD_THRESHOLDS,
        establishmentThresholds: ESTABLISHMENT_THRESHOLDS,
        eligibleNeighborhoods: ELIGIBLE_NEIGHBORHOODS,
        specialInsigniaDefinitions: SPECIAL_NEIGHBORHOOD_INSIGNIAS.map(s => ({
          id: s.id,
          male: s.male,
          female: s.female,
          neutral: s.neutral,
          requirement: s.requirement,
          description: s.description,
        })),
      };
    }),
  }),

  // ==================== PROGRESSION ====================
  progression: router({
    // Get user's current progression (level, points, phrase, next level)
    me: protectedProcedure.query(async ({ ctx }) => {
      return await getUserProgression(ctx.user!.id);
    }),

    // Check level-up after rating (called by frontend after saving a rating)
    checkLevelUp: protectedProcedure.mutation(async ({ ctx }) => {
      return await checkAndProcessLevelUp(ctx.user!.id);
    }),

    // Get progression constants (levels list)
    levels: publicProcedure.query(() => {
      return PROGRESSION_LEVELS;
    }),
  }),

  // ==================== ESTABLISHMENT POSTS ====================
  posts: router({
    // Get active posts for Home carousel (public)
    active: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return await getActivePostsForHome(input?.limit || 20);
      }),

    // Get posts from saved/followed establishments
    saved: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getSavedEstablishmentPosts(ctx.user!.id, input?.limit || 20);
      }),

    // Record a view on a post
    recordView: publicProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementPostView(input.postId);
        return { success: true };
      }),

    // Record a tap/click on a post
    recordTap: publicProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input }) => {
        await incrementPostTap(input.postId);
        return { success: true };
      }),

    // Toggle save/follow an establishment
    toggleSave: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const saved = await toggleSaveEstablishment(ctx.user!.id, input.establishmentId);
        // Auto follow/unfollow business broadcasts when saving/unsaving
        if (saved) {
          await followBusiness(input.establishmentId, ctx.user!.id);
        } else {
          await unfollowBusiness(input.establishmentId, ctx.user!.id);
        }
        return { saved };
      }),

    // Check if establishment is saved
    isSaved: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await isEstablishmentSaved(ctx.user!.id, input.establishmentId);
      }),

    // Get all saved establishment IDs
    savedIds: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSavedEstablishmentIds(ctx.user!.id);
    }),

    // Get saved establishments with full details (for Meus Locais page)
    savedEstablishments: protectedProcedure.query(async ({ ctx }) => {
      return await getSavedEstablishmentsWithDetails(ctx.user!.id);
    }),

    // Create a post (business accounts only)
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["event", "promotion", "brand", "menu_daily", "new_item", "collab"]),
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        imageUrl: z.string(),
        imageKey: z.string().optional(),
        linkUrl: z.string().optional(),
        startsAt: z.date(),
        expiresAt: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only business or admin/owner can create posts
        if (!['business', 'admin', 'owner'].includes(ctx.user!.role)) {
          throw new Error("Apenas contas empresariais podem criar postagens.");
        }
        const postId = await createEstablishmentPost({
          ...input,
          userId: ctx.user!.id,
        });
        return { postId };
      }),

    // Get active posts by type (for /busca?tipo= page)
    byType: publicProcedure
      .input(z.object({ type: z.string().min(1), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await getActivePostsByType(input.type, input.limit || 30);
      }),

    // Expire old posts (admin utility)
    expireOld: protectedProcedure.mutation(async ({ ctx }) => {
      if (!['admin', 'owner'].includes(ctx.user!.role)) {
        throw new Error("Apenas admins podem executar esta ação.");
      }
      const count = await expireOldPosts();
      return { expired: count };
    }),

    // Get user's broadcast feed (from businesses they follow)
    broadcastFeed: protectedProcedure.query(async ({ ctx }) => {
      return await getUserBroadcastFeed(ctx.user!.id);
    }),
  }),

  // ============================================================
  // Influencer
  // ============================================================
  influencer: router({
    // Get my ratings for application (last 365 days with qualification status)
    myRatings: protectedProcedure.query(async ({ ctx }) => {
      return await getRatingsForInfluencerApplication(ctx.user!.id);
    }),

    // Submit influencer application
    submitApplication: protectedProcedure
      .input(z.object({
        selectedRatingIds: z.array(z.number()).min(50),
        totalRatings: z.number(),
        qualifiedRatings: z.number(),
        motivation: z.string().optional(),
        socialMedia: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await submitInfluencerApplication({
          userId: ctx.user!.id,
          ...input,
        });
        return { id };
      }),

    // Get my application status
    myApplication: protectedProcedure.query(async ({ ctx }) => {
      return await getMyInfluencerApplication(ctx.user!.id);
    }),

    // Propose a partnership (influencer only)
    proposePartnership: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        terms: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user!.role !== "influencer") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas influencers podem propor parcerias." });
        }
        const id = await proposePartnership({
          partnershipType: "influencer",
          influencerId: ctx.user!.id,
          establishmentId: input.establishmentId,
          terms: input.terms,
          proposedBy: "influencer",
        });
        return { id };
      }),

    // Get my partnerships (influencer)
    myPartnerships: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user!.role !== "influencer") {
        return [];
      }
      return await getInfluencerPartnerships(ctx.user!.id);
    }),
  }),

  // ============================================================
  // Promo Codes
  // ============================================================
  promo: router({
    // Validate a code for a specific establishment (public — used on QR scan page)
    validate: publicProcedure
      .input(z.object({
        code: z.string().min(1).max(20),
        establishmentId: z.number(),
        userId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // If no userId, just check if code exists and is active
        const result = await validatePromoCode(
          input.code,
          input.establishmentId,
          input.userId ?? 0
        );
        if (!result) return { valid: false, promo: null };
        return {
          valid: true,
          promo: {
            id: result.id,
            code: result.code,
            type: result.type,
            value: result.value,
            description: result.description,
            firstVisitOnly: result.firstVisitOnly,
          },
        };
      }),

    // Register usage of a code
    use: protectedProcedure
      .input(z.object({
        codeId: z.number(),
        establishmentId: z.number(),
        discountApplied: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await usePromoCode({
          codeId: input.codeId,
          userId: ctx.user!.id,
          establishmentId: input.establishmentId,
          discountApplied: input.discountApplied,
        });
        return { id };
      }),

    // Create a new promo code (business or influencer)
    create: protectedProcedure
      .input(z.object({
        code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/i, "Código deve conter apenas letras e números"),
        type: z.enum(["percentage", "buy_one_get_one", "free_item", "fixed_discount"]),
        value: z.number().optional(),
        description: z.string().max(500).optional(),
        establishmentId: z.number().optional(),
        startsAt: z.number().optional(),
        expiresAt: z.number().optional(),
        maxUses: z.number().optional(),
        maxUsesPerUser: z.number().optional(),
        firstVisitOnly: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!['business', 'admin', 'owner'].includes(ctx.user!.role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas contas empresariais ou influencers podem criar códigos.' });
        }
        // Check promo code limit based on plan
        const userPlan = await getUserPlanDetails(ctx.user!.id);
        const maxCodes = userPlan.limits.maxPromoCodes;
        if (maxCodes !== null) {
          const existingCodes = await getUserPromoCodes(ctx.user!.id);
          const activeCodes = existingCodes.filter((c: any) => c.status === 'active' || c.status === 'pending_approval');
          if (activeCodes.length >= maxCodes) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Limite de ${maxCodes} código(s) ativo(s) atingido no seu plano. Faça upgrade para criar mais!`,
            });
          }
        }
        // Check if code is taken
        const taken = await isCodeTaken(input.code);
        if (taken) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Este código já está em uso.' });
        }
        const creatorType = ctx.user!.role === 'business' ? 'business' : 'influencer';
        const id = await createPromoCode({
          ...input,
          creatorId: ctx.user!.id,
          creatorType: creatorType as "business" | "influencer",
        });
        return { id };
      }),

    // List my promo codes
    myCodes: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPromoCodes(ctx.user!.id);
    }),

    // Delete my promo code
    delete: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await deletePromoCode(input.codeId, ctx.user!.id);
        if (!success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não foi possível excluir este código.' });
        }
        return { success: true };
      }),

    // Admin: list all codes
    adminList: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await getAdminPromoCodes(input?.status);
      }),

    // Admin: approve code
    adminApprove: adminProcedure
      .input(z.object({ codeId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await approvePromoCode(input.codeId, input.notes);
        return { success: true };
      }),

    // Admin: reject code
    adminReject: adminProcedure
      .input(z.object({ codeId: z.number(), notes: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await rejectPromoCode(input.codeId, input.notes);
        return { success: true };
      }),

    // Stats for a code (owner or admin)
    stats: protectedProcedure
      .input(z.object({ codeId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await getPromoCodeStats(input.codeId);
      }),
  }),

  // ============================================================
  // Plans & Subscriptions
  // ============================================================
  plans: router({
    // Get current user's plan details
    myPlan: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user!.id;
      const details = await getUserPlanDetails(userId);
      const rateCheck = await canUserRate(userId);
      return {
        ...details,
        ratingsToday: rateCheck.remaining,
        canRate: rateCheck.allowed,
      };
    }),

    // Check if user can rate (used before showing rating page)
    canRate: protectedProcedure.query(async ({ ctx }) => {
      return await canUserRate(ctx.user!.id);
    }),

    // Get all plan options (public)
    options: publicProcedure.query(() => {
      return {
        user: [
          {
            id: "free",
            name: "Explorador",
            price: 0,
            period: "",
            limits: PLAN_LIMITS.free,
            features: [
              "3 avaliações por dia",
              "Até 3 grupos",
              "Perfil básico",
              "Ver avaliações da comunidade",
              "Salvar locais favoritos",
            ],
          },
          {
            id: "premium",
            name: "Conhecedor",
            price: 9.9,
            period: "/mês",
            limits: PLAN_LIMITS.premium,
            popular: true,
            features: [
              "5 avaliações por dia",
              "Grupos ilimitados",
              "Criar grupo de influencer",
              "\"Double\" na primeira visita",
              "Selo Conhecedor no perfil",
              "Filtros avançados de busca",
            ],
          },
          {
            id: "embaixador",
            name: "Embaixador",
            price: 19.9,
            period: "/mês",
            limits: PLAN_LIMITS.embaixador,
            features: [
              "Avaliações ilimitadas",
              "Tudo do Conhecedor",
              "Descontos em parceiros",
              "Destaque nas avaliações",
              "Convites para inaugurações",
              "Suporte prioritário",
              "Acesso a eventos exclusivos",
            ],
          },
        ],
        business: [
          {
            id: "free",
            name: "Básico",
            price: 0,
            period: "",
            limits: BUSINESS_PLAN_LIMITS.free,
            features: [
              "Perfil do estabelecimento",
              "QR Code personalizado",
              "1 código promocional ativo",
              "Notificações de avaliações",
            ],
          },
          {
            id: "premium",
            name: "Premium",
            price: 29.9,
            period: "/mês",
            limits: BUSINESS_PLAN_LIMITS.premium,
            features: [
              "Códigos promocionais ilimitados",
              "Analytics e métricas",
              "Destaque no app",
              "Tudo do plano Básico",
            ],
          },
        ],
      };
    }),

    // Upgrade plan (simulated — no real payment yet)
    upgrade: protectedProcedure
      .input(z.object({
        plan: z.enum(["premium", "embaixador"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        return await upgradePlan({
          userId,
          plan: input.plan,
          paymentMethod: "admin_grant", // TODO: integrate real payment
          durationMonths: 1,
        });
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      return await cancelSubscription(ctx.user!.id);
    }),

    // Downgrade to free (immediate)
    downgrade: protectedProcedure.mutation(async ({ ctx }) => {
      return await downgradePlan(ctx.user!.id);
    }),

    // Business plan details
    businessPlan: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await getBusinessPlanDetails(input.establishmentId);
      }),

    // Upgrade business plan
    upgradeBusiness: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await upgradeBusinessPlan({
          establishmentId: input.establishmentId,
          userId: ctx.user!.id,
        });
      }),

    // Admin: grant plan to user
    adminGrant: adminProcedure
      .input(z.object({
        userId: z.number(),
        plan: z.enum(["premium", "embaixador"]),
        durationMonths: z.number().min(1).max(12).default(1),
      }))
      .mutation(async ({ input }) => {
        return await adminGrantPlan(input.userId, input.plan, input.durationMonths);
      }),

    // Admin: list subscriptions
    adminSubscriptions: adminProcedure
      .input(z.object({ status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await getAdminSubscriptions(input?.status);
      }),
  }),

  // ============================================================
  // Analytics & Insights (cached, lazy-loaded)
  // ============================================================
  analytics: router({
    // Admin dashboard - full platform metrics
    adminDashboard: adminProcedure.query(async () => {
      return await getAdminDashboard();
    }),

    // Business insights - per establishment
    businessInsights: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user owns this establishment or is admin
        if (ctx.user!.role !== "admin" && ctx.user!.role !== "owner") {
          const estabs = await getBusinessEstablishments(ctx.user!.id);
          const owns = estabs.some((e: any) => e.id === input.establishmentId);
          if (!owns) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Sem acesso a este estabelecimento." });
          }
        }
        return await getBusinessInsights(input.establishmentId);
      }),

    // User personal stats
    myStats: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStats(ctx.user!.id);
    }),
  }),

  // ============================================================
  // QR Scan & Presential Ratings
  // ============================================================
  qr: router({
    // Register a QR scan with geolocation
    scan: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        return await registerQrScan({
          userId,
          establishmentId: input.establishmentId,
          latitude: input.latitude,
          longitude: input.longitude,
        });
      }),

    // Get latest scan for a specific establishment
    latestScan: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const scan = await getLatestQrScan(ctx.user!.id, input.establishmentId);
        if (!scan) return { scan: null, source: "remoto" as const };
        const source = classifyRatingSource(scan.scannedAt);
        return { scan, source };
      }),

    // Get all user's QR scans
    myScans: protectedProcedure.query(async ({ ctx }) => {
      return await getUserQrScans(ctx.user!.id);
    }),
  }),

  // ============================================================
  // Influencer Follow & Public Profiles
  // ============================================================
  influencerProfile: router({
    // Get influencer public profile
    get: publicProcedure
      .input(z.object({ influencerId: z.number() }))
      .query(async ({ input }) => {
        return await getInfluencerProfile(input.influencerId);
      }),

    // Get influencer's recent ratings
    ratings: publicProcedure
      .input(z.object({ influencerId: z.number(), limit: z.number().max(50).default(20) }))
      .query(async ({ input }) => {
        return await getInfluencerRatings(input.influencerId, input.limit);
      }),

    // List all influencers (discovery)
    list: publicProcedure.query(async () => {
      return await listInfluencers();
    }),

    // Follow an influencer
    follow: protectedProcedure
      .input(z.object({ influencerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user!.id === input.influencerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Voc\u00ea n\u00e3o pode seguir a si mesmo." });
        }
        return await followInfluencer(ctx.user!.id, input.influencerId);
      }),

    // Unfollow an influencer
    unfollow: protectedProcedure
      .input(z.object({ influencerId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await unfollowInfluencer(ctx.user!.id, input.influencerId);
      }),

    // Check if following
    isFollowing: protectedProcedure
      .input(z.object({ influencerId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await isFollowingInfluencer(ctx.user!.id, input.influencerId);
      }),

    // Get followed influencers list
    following: protectedProcedure.query(async ({ ctx }) => {
      return await getFollowedInfluencers(ctx.user!.id);
    }),

    // Get feed from followed influencers
    feed: protectedProcedure.query(async ({ ctx }) => {
      return await getInfluencerFeed(ctx.user!.id);
    }),
  }),

  // ============================================================
  // SUPPORT ROUTES
  // ============================================================
  support: router({
    // Get my assigned establishments
    myAssignments: supportProcedure.query(async ({ ctx }) => {
      return await getSupportAssignments(ctx.user!.id);
    }),

    // Get my stats
    myStats: supportProcedure.query(async ({ ctx }) => {
      return await getSupportStats(ctx.user!.id);
    }),

    // Get my tickets
    myTickets: supportProcedure.query(async ({ ctx }) => {
      return await getSupportTickets(ctx.user!.id);
    }),

    // Create a ticket
    createTicket: supportProcedure
      .input(z.object({
        establishmentId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate support has access to this estab
        const hasAccess = await supportHasAccessToEstab(ctx.user!.id, input.establishmentId);
        if (!hasAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Voc\u00ea n\u00e3o tem acesso a este estabelecimento" });
        }
        return await createSupportTicket({
          ...input,
          supportUserId: ctx.user!.id,
          createdById: ctx.user!.id,
        });
      }),

    // Resolve a ticket
    resolveTicket: supportProcedure
      .input(z.object({
        ticketId: z.number(),
        resolution: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await resolveSupportTicket(input.ticketId, input.resolution);
        return { success: true };
      }),

    // Check access to estab
    hasAccess: supportProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await supportHasAccessToEstab(ctx.user!.id, input.establishmentId);
      }),

    // Flag duplicate establishment
    flagDuplicate: supportProcedure
      .input(z.object({
        existingEstablishmentId: z.number(),
        newEstablishmentId: z.number(),
        reason: z.enum(["same_address", "same_phone", "same_address_phone", "manual"]),
        notes: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createDuplicateAlert } = await import("./db");
        await createDuplicateAlert({
          existingEstablishmentId: input.existingEstablishmentId,
          newEstablishmentId: input.newEstablishmentId,
          reason: input.reason,
          flaggedBy: ctx.user!.id,
          notes: input.notes,
        });
        return { success: true };
      }),

    // Detect duplicates for a given establishment
    detectDuplicates: supportProcedure
      .input(z.object({
        phone: z.string().optional(),
        address: z.string().optional(),
        excludeId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { detectDuplicates } = await import("./db");
        return await detectDuplicates(input.phone, input.address, input.excludeId);
      }),
  }),

  // Admin: manage support assignments
  adminSupport: router({
    // List all support users
    listSupportUsers: adminProcedure.query(async () => {
      return await getAllSupportUsers();
    }),

    // Get assignment counts
    assignmentCounts: adminProcedure.query(async () => {
      return await getSupportAssignmentCounts();
    }),

    // Assign estabs to support
    assignEstabs: adminProcedure
      .input(z.object({
        supportUserId: z.number(),
        establishmentIds: z.array(z.number()).min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        await assignEstabsToSupport(input.supportUserId, input.establishmentIds, ctx.user!.id);
        return { success: true };
      }),

    // Revoke estab from support
    revokeEstab: adminProcedure
      .input(z.object({
        supportUserId: z.number(),
        establishmentId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await revokeEstabFromSupport(input.supportUserId, input.establishmentId);
        return { success: true };
      }),

    // Get assignments for a specific support user
    getUserAssignments: adminProcedure
      .input(z.object({ supportUserId: z.number() }))
      .query(async ({ input }) => {
        return await getSupportAssignments(input.supportUserId);
      }),
  }),
  // Owner: Edit any establishment directly
  ownerUpdateEstablishment: ownerProcedure
    .input(z.object({
      establishmentId: z.number(),
      name: z.string().optional(),
      address: z.string().refine(
        (val) => !val || ADDRESS_REGEX.test(val.trim()),
        { message: 'Endereço deve começar com logradouro válido (Rua, Avenida, Alameda, etc.)' }
      ).optional(),
      addressNumber: z.string().refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const t = val.trim().toLowerCase();
          if (t === 's/n' || t === 'sn') return true;
          const n = parseInt(t, 10);
          return !isNaN(n) && n >= 1 && n <= 15000 && String(n) === t;
        },
        { message: 'Número deve ser de 1 a 15000 ou "s/n"' }
      ).optional(),
      complement: z.string().max(200).optional(),
      description: z.string().max(500).optional(),
      neighborhood: z.string().optional(),
      phone: z.string().optional(),
      instagram: z.string().optional(),
      hours: z.string().optional(),
      image: z.string().optional(),
      logo: z.string().optional(),
      categoryId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { establishmentId, ...data } = input;
      const db = (await import("./db")).getDb();
      const dbInstance = await db;
      if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
      const { establishments } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await dbInstance.update(establishments).set(data).where(eq(establishments.id, establishmentId));
      // Sync visibility
      const { syncEstablishmentVisibility } = await import("./db");
      await syncEstablishmentVisibility(establishmentId);
      return { success: true };
    }),

  // Owner Panel
  ownerPanel: router({
    stats: ownerProcedure.query(async () => {
      return await getOwnerStats();
    }),
    growth: ownerProcedure.query(async () => {
      return await getOwnerGrowth();
    }),
    financials: ownerProcedure.query(async () => {
      return await getOwnerFinancials();
    }),
  }),
  // System Panel (owner only)
  systemPanel: router({
    health: ownerProcedure.query(async () => {
      return await getSystemHealth();
    }),
    auditLog: ownerProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
      .query(async ({ input }) => {
        return await getSystemAuditLog(input?.limit || 20);
      }),
  }),

  // ============ INTEGRATIONS (owner/admin) ============
  integrations: router({
    list: adminProcedure.query(async () => {
      return await getAllIntegrations();
    }),
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const value = await getIntegration(input.key);
        return { key: input.key, value };
      }),
    set: adminProcedure
      .input(z.object({
        key: z.string().min(1).max(128),
        value: z.string().max(2000),
        label: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await setIntegration(input.key, input.value, input.label || input.key, ctx.user!.id);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ input }) => {
        await deleteIntegration(input.key);
        return { success: true };
      }),
    // Public endpoint to get GTM ID (no auth required for frontend injection)
    getGtmId: publicProcedure.query(async () => {
      const value = await getIntegration("gtm_id");
      return { gtmId: value };
    }),
  }),

  // ============ CRITIC (Crítico Gastronômico) ============
  critic: router({
    // Submit application to become a critic
    submitApplication: protectedProcedure
      .input(z.object({
        displayName: z.string().min(2).max(255),
        bio: z.string().max(2000).optional(),
        publication: z.string().min(2).max(255),
        publicationUrl: z.string().url().max(512).optional(),
        specialty: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await submitCriticApplication({
          userId: ctx.user!.id,
          ...input,
        });
      }),

    // Get my critic profile/application status
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getMyCriticProfile(ctx.user!.id);
    }),

    // Update my critic profile (approved critics only)
    updateProfile: criticProcedure
      .input(z.object({
        displayName: z.string().min(2).max(255).optional(),
        bio: z.string().max(2000).optional(),
        publication: z.string().min(2).max(255).optional(),
        publicationUrl: z.string().url().max(512).optional(),
        specialty: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await updateCriticProfile(ctx.user!.id, input);
      }),

    // Get my ratings as a critic
    myRatings: criticProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
      .query(async ({ ctx, input }) => {
        return await getCriticRatings(ctx.user!.id, input?.limit || 20);
      }),

    // Public: get critic profile by username
    publicProfile: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        return await getCriticPublicProfile(input.username);
      }),

    // Public: get critic's ratings
    publicRatings: publicProcedure
      .input(z.object({ username: z.string(), limit: z.number().min(1).max(100).default(20) }))
      .query(async ({ input }) => {
        const profile = await getCriticPublicProfile(input.username);
        if (!profile) return [];
        return await getCriticRatings(profile.userId, input.limit);
      }),

    // Public: check if establishment has critic seal
    establishmentSeal: publicProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ input }) => {
        return await hasEstablishmentCriticSeal(input.establishmentId);
      }),

    // Admin: list all applications
    adminList: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return await getCriticApplications(input?.status);
      }),

    // Admin: approve application
    adminApprove: adminProcedure
      .input(z.object({
        applicationId: z.number(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await approveCriticApplication(input.applicationId, ctx.user!.id, input.adminNotes);
      }),

    // Admin: reject application
    adminReject: adminProcedure
      .input(z.object({
        applicationId: z.number(),
        adminNotes: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return await rejectCriticApplication(input.applicationId, ctx.user!.id, input.adminNotes);
      }),
  }),

  // ============ GROUP EVENTS / CALENDAR ============
  chat: router({
    // Support conversations list (legacy - by user)
    supportConversations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user!.role !== "support") throw new TRPCError({ code: "FORBIDDEN" });
      return await getSupportConversationList(ctx.user!.id);
    }),
    // Support conversations list by establishment
    supportEstabConversations: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user!.role !== "support" && ctx.user!.role !== "admin" && ctx.user!.role !== "owner") throw new TRPCError({ code: "FORBIDDEN" });
      return await getSupportEstabConversationList(ctx.user!.id);
    }),
    // Support messages with a specific user
    supportMessages: protectedProcedure
      .input(z.object({ partnerId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user!.role !== "support") throw new TRPCError({ code: "FORBIDDEN" });
        return await getSupportConversation(ctx.user!.id, input.partnerId);
      }),
    // Support sends message to user
    sendSupportMessage: protectedProcedure
      .input(z.object({ recipientId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user!.role !== "support") throw new TRPCError({ code: "FORBIDDEN" });
        return await sendSupportMessage(ctx.user!.id, input.recipientId, input.content);
      }),
    // Mark messages as read
    markRead: protectedProcedure
      .input(z.object({ senderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await markSupportMessagesAsRead(ctx.user!.id, input.senderId);
      }),
    // Find user by username for starting new chat
    findUserForChat: protectedProcedure
      .input(z.object({ username: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user!.role !== "support") throw new TRPCError({ code: "FORBIDDEN" });
        const { getDb } = await import("./db");
        const db = await getDb();
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const found = await db!.select({ id: users.id, name: users.name, username: users.username, role: users.role })
          .from(users).where(eq(users.username, input.username)).limit(1);
        if (found.length === 0) return null;
        return found[0];
      }),
    // User gets their support messages
    mySupportMessages: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSupportMessages(ctx.user!.id);
    }),
    // User sends message to support
    sendToSupport: protectedProcedure
      .input(z.object({ content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        // Find the support user assigned to this user (or first support user)
        const { getDb } = await import("./db");
        const db = await getDb();
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const supportUsers = await db!.select({ id: users.id }).from(users).where(eq(users.role, "support")).limit(1);
        if (supportUsers.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum suporte disponível" });
        return await sendSupportMessage(ctx.user!.id, supportUsers[0].id, input.content);
      }),
    // ===== CHAT POR ESTABELECIMENTO (Business <-> Support) =====
    estabMessages: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user!.role !== "business" && ctx.user!.role !== "support" && ctx.user!.role !== "admin" && ctx.user!.role !== "owner")
          throw new TRPCError({ code: "FORBIDDEN" });
        return await getEstabSupportMessages(input.establishmentId);
      }),
    sendEstabMessage: protectedProcedure
      .input(z.object({ establishmentId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user!.role !== "business" && ctx.user!.role !== "support" && ctx.user!.role !== "admin" && ctx.user!.role !== "owner")
          throw new TRPCError({ code: "FORBIDDEN" });
        // Find the support user assigned to this establishment
        const { getDb } = await import("./db");
        const db = await getDb();
        const { users, supportAssignments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        let recipientId: number;
        if (ctx.user!.role === "business") {
          // Business sends to support assigned to this estab
          const assigned = await db!.select({ userId: supportAssignments.supportUserId })
            .from(supportAssignments)
            .where(eq(supportAssignments.establishmentId, input.establishmentId))
            .limit(1);
          if (assigned.length === 0) {
            // Fallback: first support user
            const supportUsers = await db!.select({ id: users.id }).from(users).where(eq(users.role, "support")).limit(1);
            if (supportUsers.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum suporte disponível" });
            recipientId = supportUsers[0].id;
          } else {
            recipientId = assigned[0].userId;
          }
        } else {
          // Support/admin/owner sends — find the business owner of this estab
          const { businessClaims } = await import("../drizzle/schema");
          const { and: andOp } = await import("drizzle-orm");
          const claim = await db!.select({ userId: businessClaims.userId })
            .from(businessClaims)
            .where(andOp(eq(businessClaims.establishmentId, input.establishmentId), eq(businessClaims.status, "approved")))
            .limit(1);
          if (claim.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Nenhum dono encontrado para este estabelecimento" });
          recipientId = claim[0].userId;
        }
        return await sendEstabSupportMessage(ctx.user!.id, recipientId, input.establishmentId, input.content);
      }),
    markEstabRead: protectedProcedure
      .input(z.object({ establishmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markEstabMessagesAsRead(ctx.user!.id, input.establishmentId);
        return { success: true };
      }),
  }),
  events: router({
    create: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        establishmentId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        eventDate: z.string(), // ISO string
        maxGuests: z.number().min(1).max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        // Verify user is a member of the group
        const isMember = await isGroupMember(input.groupId, userId);
        if (!isMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste grupo." });
        }
        return await createGroupEvent({
          groupId: input.groupId,
          creatorId: userId,
          establishmentId: input.establishmentId,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          maxGuests: input.maxGuests,
        });
      }),

    listByGroup: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        status: z.enum(["active", "cancelled", "completed"]).default("active"),
      }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        const isMember = await isGroupMember(input.groupId, userId);
        if (!isMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste grupo." });
        }
        return await getGroupEvents(input.groupId, input.status);
      }),

    getById: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        const event = await getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado." });
        }
        // Verify user is member of the event's group
        const isMember = await isGroupMember(event.groupId, ctx.user!.id);
        if (!isMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a este evento." });
        }
        const rsvps = await getEventRsvps(input.eventId);
        return { ...event, rsvps };
      }),

    rsvp: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        status: z.enum(["confirmed", "maybe", "declined"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user!.id;
        // Verify event exists and user is member of its group
        const event = await getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado." });
        }
        const isMember = await isGroupMember(event.groupId, userId);
        if (!isMember) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não é membro deste grupo." });
        }
        return await rsvpEvent(input.eventId, userId, input.status);
      }),

    myEvents: protectedProcedure
      .input(z.object({
        upcoming: z.boolean().default(true),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserEvents(ctx.user!.id, input?.upcoming ?? true);
      }),

    cancel: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await cancelGroupEvent(input.eventId, ctx.user!.id);
      }),

    listByEstablishment: businessProcedure
      .input(z.object({
        establishmentId: z.number(),
        upcoming: z.boolean().default(true),
      }))
      .query(async ({ ctx, input }) => {
        // Verify the business user owns this establishment
        const myEstabs = await getBusinessEstablishments(ctx.user!.id);
        const ownsEstab = myEstabs.some((e: any) => e.id === input.establishmentId);
        if (!ownsEstab) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem acesso a este estabelecimento." });
        }
        return await getEventsByEstablishment(input.establishmentId, input.upcoming);
      }),
  }),

  // ============ SOCIAL (Follows + DMs) ============
  social: router({
    follow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await followUser(ctx.user!.id, input.userId);
        return { success: true };
      }),
    unfollow: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await unfollowUser(ctx.user!.id, input.userId);
        return { success: true };
      }),
    isFollowing: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ ctx, input }) => {
        const following = await isFollowing(ctx.user!.id, input.userId);
        const mutual = following ? await isMutualFollow(ctx.user!.id, input.userId) : false;
        return { following, mutual };
      }),
    followers: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await getFollowers(input.userId || ctx.user!.id);
      }),
    following: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await getFollowing(input.userId || ctx.user!.id);
      }),
    counts: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await getFollowCounts(input.userId);
      }),
    mutuals: protectedProcedure
      .query(async ({ ctx }) => {
        return await getMutualFollows(ctx.user!.id);
      }),
    // DMs
    dmConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return await getDMConversations(ctx.user!.id);
      }),
    dmMessages: protectedProcedure
      .input(z.object({ partnerId: z.number(), limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        // Only allow DMs between mutual follows
        const mutual = await isMutualFollow(ctx.user!.id, input.partnerId);
        if (!mutual) throw new TRPCError({ code: "FORBIDDEN", message: "Chat disponível apenas entre seguidores mútuos." });
        return await getDirectMessages(ctx.user!.id, input.partnerId, input.limit, input.offset);
      }),
    dmSend: protectedProcedure
      .input(z.object({ recipientId: z.number(), content: z.string().min(1).max(500) }))
      .mutation(async ({ ctx, input }) => {
        const mutual = await isMutualFollow(ctx.user!.id, input.recipientId);
        if (!mutual) throw new TRPCError({ code: "FORBIDDEN", message: "Chat disponível apenas entre seguidores mútuos." });
        const id = await sendDirectMessage(ctx.user!.id, input.recipientId, input.content);
        return { id };
      }),
    dmMarkRead: protectedProcedure
      .input(z.object({ senderId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markDMsAsRead(ctx.user!.id, input.senderId);
        return { success: true };
      }),
  }),

  // ============ SURVEY QUESTIONS MANAGEMENT (Owner) ============
  surveyManagement: router({
    list: ownerProcedure
      .input(z.object({ phase: z.enum(["onboarding", "explorer", "connoisseur"]).optional() }).optional())
      .query(async ({ input }) => {
        const { getSurveyQuestions } = await import("./db");
        return await getSurveyQuestions(input?.phase);
      }),
    create: ownerProcedure
      .input(z.object({
        phase: z.enum(["onboarding", "explorer", "connoisseur"]),
        questionId: z.string().min(1).max(64),
        title: z.string().min(1).max(255),
        subtitle: z.string().optional(),
        type: z.enum(["single", "multi", "score", "text", "birthdate"]),
        icon: z.string().max(64).optional(),
        maxSelect: z.number().min(1).max(20).optional(),
        lowScoreThreshold: z.number().min(1).max(10).optional(),
        options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        lowScoreReasons: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        parentQuestionId: z.number().nullable().optional(),
        triggerOption: z.string().max(500).nullable().optional(),
        sortOrder: z.number().default(0),
        active: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const { createSurveyQuestion } = await import("./db");
        return await createSurveyQuestion(input);
      }),
    update: ownerProcedure
      .input(z.object({
        id: z.number(),
        phase: z.enum(["onboarding", "explorer", "connoisseur"]).optional(),
        questionId: z.string().min(1).max(64).optional(),
        title: z.string().min(1).max(255).optional(),
        subtitle: z.string().optional(),
        type: z.enum(["single", "multi", "score", "text", "birthdate"]).optional(),
        icon: z.string().max(64).optional(),
        maxSelect: z.number().min(1).max(20).optional(),
        lowScoreThreshold: z.number().min(1).max(10).optional(),
        options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        lowScoreReasons: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
        parentQuestionId: z.number().nullable().optional(),
        triggerOption: z.string().max(500).nullable().optional(),
        sortOrder: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const { updateSurveyQuestion } = await import("./db");
        await updateSurveyQuestion(id, data);
        return { success: true };
      }),
    delete: ownerProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteSurveyQuestion } = await import("./db");
        await deleteSurveyQuestion(input.id);
        return { success: true };
      }),
    reorder: ownerProcedure
      .input(z.object({ orderedIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const { reorderSurveyQuestions } = await import("./db");
        await reorderSurveyQuestions(input.orderedIds);
        return { success: true };
      }),
    seed: ownerProcedure
      .mutation(async () => {
        const { getSurveyQuestions, createSurveyQuestion } = await import("./db");
        const existing = await getSurveyQuestions();
        if (existing.length > 0) return { seeded: false, message: "Perguntas já existem" };
        // Seed onboarding questions
        const onboardingQuestions = [
          { phase: "onboarding" as const, questionId: "birthdate", title: "DATA DE NASCIMENTO", subtitle: "Selecione sua data de nascimento", type: "birthdate" as const, icon: "Cake", sortOrder: 0 },
          { phase: "onboarding" as const, questionId: "region", title: "ONDE VOCÊ MORA", subtitle: "Em qual região de São Paulo você mora?", type: "single" as const, icon: "MapPin", sortOrder: 1, options: [{label:"Zona Norte",value:"zona-norte"},{label:"Zona Sul",value:"zona-sul"},{label:"Zona Leste",value:"zona-leste"},{label:"Zona Oeste",value:"zona-oeste"},{label:"Centro",value:"centro"},{label:"Região Metropolitana de São Paulo (ABC, Guarulhos, Osasco..)",value:"grande-sp"},{label:"Campinas e Região Metropolitana de Campinas",value:"campinas"},{label:"Jundiaí e Região Metropolitana de Jundiaí",value:"jundiai"},{label:"Não moro em São Paulo",value:"fora-sp"}] },
          { phase: "onboarding" as const, questionId: "frequency", title: "FREQUÊNCIA", subtitle: "Com que frequência você sai para comer ou beber fora?", type: "single" as const, icon: "Clock", sortOrder: 2, options: [{label:"Quase todos os dias",value:"diariamente"},{label:"2 a 3 vezes por semana",value:"2-3x-semana"},{label:"1 vez por semana",value:"1x-semana"},{label:"Quinzenalmente",value:"quinzenal"},{label:"1 vez por mês",value:"mensal"},{label:"Raramente",value:"raramente"}] },
          { phase: "onboarding" as const, questionId: "spend", title: "GASTO MÉDIO", subtitle: "Quanto você costuma gastar por pessoa quando sai?", type: "single" as const, icon: "DollarSign", sortOrder: 3, options: [{label:"Até R$ 30",value:"ate-30"},{label:"R$ 30 a R$ 60",value:"30-60"},{label:"R$ 60 a R$ 100",value:"60-100"},{label:"R$ 100 a R$ 150",value:"100-150"},{label:"R$ 150 a R$ 250",value:"150-250"},{label:"Acima de R$ 250",value:"250-mais"}] },
          { phase: "onboarding" as const, questionId: "categories", title: "CATEGORIAS FAVORITAS", subtitle: "Selecione até 5 tipos de lugar que você mais frequenta", type: "multi" as const, icon: "Utensils", maxSelect: 5, sortOrder: 4, options: [{label:"Bar / Boteco",value:"bar-boteco"},{label:"Cervejaria artesanal",value:"cervejaria"},{label:"Coquetelaria / Speakeasy",value:"coquetelaria"},{label:"Pub / Bar musical",value:"pub"},{label:"Restaurante casual",value:"restaurante"},{label:"Hamburgueria",value:"hamburgueria"},{label:"Pizzaria",value:"pizzaria"},{label:"Cafeteria / Brunch",value:"cafeteria"},{label:"Gastrobar / Autoral",value:"gastrobar"},{label:"Balada / Club",value:"balada"}] },
          { phase: "onboarding" as const, questionId: "priorities", title: "O QUE IMPORTA MAIS", subtitle: "Selecione até 3 fatores mais importantes para você", type: "multi" as const, icon: "Heart", maxSelect: 3, sortOrder: 5, options: [{label:"Qualidade dos drinks / bebidas",value:"drinks"},{label:"Qualidade da comida",value:"comida"},{label:"Ambiente / decoração",value:"ambiente"},{label:"Atendimento",value:"atendimento"},{label:"Preço justo / custo-benefício",value:"preco"},{label:"Localização / proximidade",value:"localizacao"},{label:"Música / entretenimento",value:"musica"},{label:"Variedade do cardápio",value:"variedade"}] },
          { phase: "onboarding" as const, questionId: "discovery", title: "COMO DESCOBRE LUGARES", subtitle: "Selecione até 3 formas que você mais usa para descobrir novos bares", type: "multi" as const, icon: "Compass", maxSelect: 3, sortOrder: 6, options: [{label:"Indicação de amigos/família",value:"indicacao"},{label:"Instagram / TikTok",value:"redes-sociais"},{label:"Google Maps / Google Search",value:"google"},{label:"Apps de avaliação (TripAdvisor, Yelp)",value:"apps-avaliacao"},{label:"Apps de delivery (iFood, Rappi)",value:"delivery"},{label:"Blogs e sites especializados",value:"blogs"},{label:"Passando na rua / por acaso",value:"acaso"}] },
        ];
        // Seed explorer questions
        const explorerQuestions = [
          { phase: "explorer" as const, questionId: "companionPreference", title: "COM QUEM VOCÊ SAI", subtitle: "Com quem você mais costuma sair?", type: "single" as const, icon: "Users", sortOrder: 0, options: [{label:"Sozinho(a)",value:"sozinho"},{label:"Com parceiro(a)",value:"parceiro"},{label:"Com amigos (grupo pequeno)",value:"amigos-pequeno"},{label:"Com amigos (grupo grande)",value:"amigos-grande"},{label:"Com família",value:"familia"},{label:"Depende da ocasião",value:"depende"}] },
          { phase: "explorer" as const, questionId: "bestTime", title: "MELHOR HORÁRIO", subtitle: "Qual horário você mais gosta de sair?", type: "single" as const, icon: "Calendar", sortOrder: 1, options: [{label:"Almoço (11h-14h)",value:"almoco"},{label:"Happy hour (17h-20h)",value:"happy-hour"},{label:"Jantar (20h-23h)",value:"jantar"},{label:"Noite (23h+)",value:"noite"},{label:"Brunch / manhã de fim de semana",value:"brunch"},{label:"Qualquer horário",value:"qualquer"}] },
          { phase: "explorer" as const, questionId: "waitTolerance", title: "TOLERÂNCIA DE ESPERA", subtitle: "Quanto tempo você aceita esperar por uma mesa?", type: "single" as const, icon: "Clock", sortOrder: 2, options: [{label:"Não espero, vou embora",value:"zero"},{label:"Até 15 minutos",value:"15min"},{label:"Até 30 minutos",value:"30min"},{label:"Até 1 hora",value:"1h"},{label:"Espero o quanto for preciso se o lugar vale",value:"ilimitado"}] },
          { phase: "explorer" as const, questionId: "dealbreaker", title: "O QUE TE FAZ NÃO VOLTAR", subtitle: "Qual fator te faz nunca mais voltar a um lugar? (Até 2)", type: "multi" as const, icon: "Zap", maxSelect: 2, sortOrder: 3, options: [{label:"Atendimento ruim / grosseria",value:"atendimento-ruim"},{label:"Comida/bebida de baixa qualidade",value:"qualidade-ruim"},{label:"Preço abusivo",value:"preco-abusivo"},{label:"Sujeira / falta de higiene",value:"sujeira"},{label:"Demora absurda",value:"demora"},{label:"Barulho excessivo",value:"barulho"},{label:"Falta de segurança",value:"inseguranca"}] },
          { phase: "explorer" as const, questionId: "drinkPreference", title: "BEBIDA PREFERIDA", subtitle: "Qual seu tipo de bebida preferida quando sai?", type: "single" as const, icon: "Wine", sortOrder: 4, options: [{label:"Cerveja artesanal",value:"cerveja-artesanal"},{label:"Cerveja comercial",value:"cerveja-comercial"},{label:"Coquetéis clássicos",value:"coqueteis"},{label:"Vinho",value:"vinho"},{label:"Destilados puros",value:"destilados"},{label:"Drinks autorais",value:"drinks-autorais"},{label:"Não-alcoólicos",value:"nao-alcoolicos"},{label:"Depende do lugar",value:"depende"}] },
          { phase: "explorer" as const, questionId: "worstExperience", title: "PIOR EXPERIÊNCIA", subtitle: "Qual foi a pior experiência que você já teve em um bar/restaurante? (1 a 10)", type: "score" as const, icon: "AlertTriangle", sortOrder: 5, lowScoreThreshold: 6, lowScoreReasons: [{label:"Intoxicação alimentar",value:"intoxicacao"},{label:"Briga / confusão no local",value:"briga"},{label:"Cobrança indevida",value:"cobranca"},{label:"Discriminação / preconceito",value:"discriminacao"},{label:"Roubo / furto",value:"roubo"}] },
          { phase: "explorer" as const, questionId: "overallSatisfaction", title: "SATISFAÇÃO GERAL", subtitle: "De modo geral, como você avalia suas experiências em bares e restaurantes de SP? (1 a 10)", type: "score" as const, icon: "Star", sortOrder: 6, lowScoreThreshold: 6, lowScoreReasons: [{label:"Preços muito altos",value:"precos-altos"},{label:"Qualidade caiu nos últimos anos",value:"qualidade-caiu"},{label:"Falta de opções no meu bairro",value:"falta-opcoes"},{label:"Atendimento piorou",value:"atendimento-piorou"},{label:"Muita lotação / filas",value:"lotacao"}] },
          { phase: "explorer" as const, questionId: "priceVsQuality", title: "PREÇO vs QUALIDADE", subtitle: "Você acha que os preços dos bares e restaurantes de SP são justos pela qualidade? (1 a 10)", type: "score" as const, icon: "DollarSign", sortOrder: 7, lowScoreThreshold: 6, lowScoreReasons: [{label:"Porções cada vez menores",value:"porcoes-menores"},{label:"Ingredientes de baixa qualidade pelo preço",value:"ingredientes-ruins"},{label:"Taxa de serviço abusiva",value:"taxa-servico"},{label:"Couvert artístico forçado",value:"couvert"},{label:"Preço de cardápio não bate com a conta",value:"preco-diferente"}] },
        ];
        // Seed connoisseur questions
        const connoisseurQuestions = [
          { phase: "connoisseur" as const, questionId: "hardestCriterion", title: "CRITÉRIO MAIS DIFÍCIL", subtitle: "Dos critérios de avaliação do AvaLyarin, qual você acha mais difícil de pontuar com precisão?", type: "single" as const, icon: "BarChart3", sortOrder: 0, options: [{label:"Sabor / Qualidade da comida",value:"sabor"},{label:"Apresentação dos pratos",value:"apresentacao"},{label:"Custo-benefício",value:"custo-beneficio"},{label:"Atendimento",value:"atendimento"},{label:"Ambiente / Decoração",value:"ambiente"},{label:"Limpeza / Higiene",value:"limpeza"},{label:"Tempo de espera",value:"tempo-espera"},{label:"Qualidade das bebidas",value:"bebidas"}] },
          { phase: "connoisseur" as const, questionId: "trustOthers", title: "CONFIANÇA NAS AVALIAÇÕES", subtitle: "Quanto você confia nas avaliações de outros usuários do AvaLyarin? (1 a 10)", type: "score" as const, icon: "Shield", sortOrder: 1, lowScoreThreshold: 6, lowScoreReasons: [{label:"Acho que muitas avaliações são falsas",value:"avaliacoes-falsas"},{label:"As notas não refletem minha experiência",value:"discordancia"},{label:"Poucas avaliações por estabelecimento",value:"poucas-avaliacoes"},{label:"Falta contexto nas avaliações",value:"falta-contexto"},{label:"Não sei se o avaliador realmente foi ao local",value:"credibilidade"}] },
          { phase: "connoisseur" as const, questionId: "desiredFeature", title: "FUNCIONALIDADE DESEJADA", subtitle: "Qual funcionalidade você mais gostaria de ver no AvaLyarin? (Até 3)", type: "multi" as const, icon: "Lightbulb", maxSelect: 3, sortOrder: 2, options: [{label:"Reserva de mesa diretamente pelo app",value:"reserva"},{label:"Programa de fidelidade com descontos",value:"fidelidade"},{label:"Mapa interativo com filtros avançados",value:"mapa"},{label:"Ranking dos melhores por bairro",value:"ranking-bairro"},{label:"Lista de favoritos compartilhável",value:"lista-favoritos"},{label:"Notificações de promoções e happy hours",value:"notificacoes"},{label:"Avaliações com fotos e vídeos",value:"midia-avaliacoes"},{label:"Recomendações personalizadas por IA",value:"ia-recomendacoes"}] },
          { phase: "connoisseur" as const, questionId: "establishmentQuality", title: "QUALIDADE DOS ESTABELECIMENTOS", subtitle: "De modo geral, como você avalia a qualidade dos estabelecimentos cadastrados no AvaLyarin? (1 a 10)", type: "score" as const, icon: "Star", sortOrder: 3, lowScoreThreshold: 6, lowScoreReasons: [{label:"Muitos lugares de baixa qualidade",value:"baixa-qualidade"},{label:"Faltam opções premium / sofisticadas",value:"falta-premium"},{label:"Faltam opções acessíveis / populares",value:"falta-acessivel"},{label:"Cardápios desatualizados ou incompletos",value:"cardapio-desatualizado"},{label:"Fotos não representam a realidade",value:"fotos-irreais"}] },
          { phase: "connoisseur" as const, questionId: "compareApps", title: "COMPARAÇÃO COM OUTROS APPS", subtitle: "Comparado a outros apps de avaliação (Google, TripAdvisor, iFood), como você classifica o AvaLyarin? (1 a 10)", type: "score" as const, icon: "GitCompare", sortOrder: 4, lowScoreThreshold: 6, lowScoreReasons: [{label:"Menos estabelecimentos cadastrados",value:"menos-estabs"},{label:"Interface menos intuitiva",value:"interface"},{label:"Menos avaliações disponíveis",value:"menos-avaliacoes"},{label:"Falta integração com reservas/delivery",value:"falta-integracao"},{label:"Comunidade ainda pequena",value:"comunidade-pequena"}] },
          { phase: "connoisseur" as const, questionId: "wouldRecommend", title: "RECOMENDARIA?", subtitle: "Você recomendaria o AvaLyarin para amigos? (1 a 10)", type: "score" as const, icon: "Trophy", sortOrder: 5, lowScoreThreshold: 6, lowScoreReasons: [{label:"Ainda faltam funcionalidades essenciais",value:"falta-funcionalidades"},{label:"Poucos lugares na minha região",value:"poucos-lugares"},{label:"Meus amigos não se interessariam",value:"sem-interesse"},{label:"Prefiro manter minhas descobertas privadas",value:"privacidade"},{label:"O app precisa melhorar antes",value:"precisa-melhorar"}] },
          { phase: "connoisseur" as const, questionId: "improvementSuggestion", title: "SUGESTÃO DE MELHORIA", subtitle: "Se pudesse mudar uma coisa no AvaLyarin, o que seria?", type: "text" as const, icon: "MessageSquare", sortOrder: 6 },
          { phase: "connoisseur" as const, questionId: "expertiseLevel", title: "SEU NÍVEL DE EXPERTISE", subtitle: "Como você se classifica em termos de conhecimento gastronômico?", type: "single" as const, icon: "Award", sortOrder: 7, options: [{label:"Curioso — gosto de experimentar coisas novas",value:"curioso"},{label:"Entusiasta — pesquiso antes de ir",value:"entusiasta"},{label:"Conhecedor — entendo de técnicas e ingredientes",value:"conhecedor"},{label:"Expert — trabalho ou já trabalhei na área",value:"expert"},{label:"Crítico — avalio profissionalmente",value:"critico"}] },
        ];
        for (const q of [...onboardingQuestions, ...explorerQuestions, ...connoisseurQuestions]) {
          await createSurveyQuestion(q);
        }
        return { seeded: true, count: onboardingQuestions.length + explorerQuestions.length + connoisseurQuestions.length };
      }),
  }),
});
export type AppRouter = typeof appRouter;
