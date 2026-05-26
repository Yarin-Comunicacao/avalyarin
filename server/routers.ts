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
  getBusinessNotifications,
  businessUpdateEstablishment,
  businessAddMenuItem,
  businessDeleteMenuItem,
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
  getSavedEstablishmentPosts,
  incrementPostView,
  incrementPostTap,
  toggleSaveEstablishment,
  isEstablishmentSaved,
  getUserSavedEstablishmentIds,
  createEstablishmentPost,
  expireOldPosts,
} from "./db-posts";
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
        const result = await saveRating(userId, input);
        // Check level-up after saving rating (non-blocking)
        let levelUp = null;
        try {
          levelUp = await checkAndProcessLevelUp(userId);
        } catch (e) {
          console.error("[Progression] Level-up check failed:", e);
        }
        return { ...result, levelUp };
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
        address: z.string().min(5, "Endereço é obrigatório (mín. 5 caracteres)"),
        neighborhood: z.string().min(2, "Bairro é obrigatório"),
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        phone: z.string().min(8, "Telefone é obrigatório (mín. 8 caracteres)"),
        instagram: z.string().min(2, "Instagram é obrigatório"),
        hours: z.string().min(3, "Horário de funcionamento é obrigatório"),
        image: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
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

    notifications: businessProcedure.query(async ({ ctx }) => {
      return await getBusinessNotifications(ctx.user!.id);
    }),
   }),

  // User profile & username
  // Survey data persistence
  survey: router({
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
      return { plan, groupCount, maxGroups: plan === "free" ? 3 : null };
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

    // Create a post (business accounts only)
    create: protectedProcedure
      .input(z.object({
        establishmentId: z.number(),
        type: z.enum(["event", "promotion", "brand", "menu_daily"]),
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

    // Expire old posts (admin utility)
    expireOld: protectedProcedure.mutation(async ({ ctx }) => {
      if (!['admin', 'owner'].includes(ctx.user!.role)) {
        throw new Error("Apenas admins podem executar esta ação.");
      }
      const count = await expireOldPosts();
      return { expired: count };
    }),
  }),
});
export type AppRouter = typeof appRouter;
