# Multi-Profile Owner System — Implementation Notes

## Concept
- Owner has separate usernames per role: user, specialist, critic
- Each username is unique across the system
- Owner appears in search with the username of the matching role
- When switching roles in BottomNav, the active username changes

## Schema
- Field `ownerUsernames` (JSON) added to `users` table
- Format: `{ "user": "alan_1927", "specialist": "specalan", "critic": "criticalan" }`

## Backend Changes Needed

### 1. searchPeople (db-groups.ts line 562)
Current: filters `role IN ('user', 'critic', 'specialist')` — excludes owners
Fix: Also search owners by their ownerUsernames JSON values, returning them with the matched role

### 2. searchUsersByUsername (db-groups.ts)
Used for group invites — needs same treatment

### 3. New procedure: owner.setRoleUsername
- Input: { role: "user"|"specialist"|"critic", username: string }
- Validates uniqueness against all usernames + all ownerUsernames
- Updates the ownerUsernames JSON

### 4. Profile display
- When viewing an owner's profile via search (matched by role-specific username), show that role's profile

## Frontend Changes Needed

### 1. BottomNav role switch
- When owner switches role, update the displayed username

### 2. Owner profile settings
- UI to set username for each role (user, specialist, critic)
- Show current usernames with edit capability

## Seed Data
- yarin (owner): user="yarin", specialist=TBD, critic=TBD
- alan_1927 (owner): user="alan_1927", specialist=TBD, critic=TBD
