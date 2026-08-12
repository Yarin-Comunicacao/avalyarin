# Bug Fix Session — 2026-07-24

## Bug 1: "Limite de 10 grupos atingido" for yarinagencia

**Root cause:** `countUserGroups()` in `server/db-groups.ts` counted ALL groups where `creatorId = userId`, including broadcast groups. yarinagencia (userId=1) is `creatorId` of 268 broadcast groups (created by batch script on 2026-07-17).

**Fix:** Added `sql\`${groups.type} != 'broadcast'\`` filter to `countUserGroups()` so broadcast groups never count toward the creation limit.

## Bug 2: yarinagencia sees broadcast groups they never followed

**Root cause:** 
1. Batch script on 2026-07-17 created broadcast groups for all establishments with `creatorId=1` (yarinagencia) and added userId=1 as `role='creator'` member.
2. `getUserBroadcastGroups()` returned ALL broadcast memberships including `role='creator'`, making yarinagencia see 268 broadcast groups in "Seguindo > Transmissões".
3. alan_1927 (userId=30) has 0 broadcast memberships because the batch script didn't add them.

**Fix:**
1. Added `sql\`${groupMembers.role} != 'creator'\`` filter to `getUserBroadcastGroups()` and `getUserHiddenGroups()` — creator memberships are ownership records, not follow records.
2. Added auto-leave logic when unfollowing/unsaving:
   - `posts.toggleSave` (unsave) → now calls `leaveBroadcastGroup`
   - `specialistFollow.unfollow` → now calls `leaveBroadcastGroup`
   - `social.unfollow` (critic) → now calls `leaveBroadcastGroup`

## Files Changed
- `server/db-groups.ts` — countUserGroups excludes broadcast
- `server/db-broadcast.ts` — getUserBroadcastGroups/getUserHiddenGroups exclude creator role; added `sql` import
- `server/routers.ts` — auto-leave broadcast on unsave/unfollow specialist/unfollow critic

## Test Results
- 479 passed, 4 failed (pre-existing progression weight test failures from earlier session where weight was changed from 0.2 to 0.5 but tests weren't updated)
- No new TypeScript errors (only pre-existing 312 in smart-search.ts)
