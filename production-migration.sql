-- ============================================================
-- MIGRAÇÃO DE PRODUÇÃO - Avalyarin
-- Execute este SQL no banco de produção (TiDB) para sincronizar
-- com o schema atual do código.
-- 
-- INSTRUÇÕES: Execute cada bloco separadamente. Se uma tabela/coluna
-- já existir, o comando vai dar erro (ignore e passe para o próximo).
-- ============================================================

-- ============================================================
-- 1. COLUNA FALTANTE NA TABELA USERS (stripeCustomerId)
-- ============================================================
ALTER TABLE `users` ADD COLUMN `stripeCustomerId` varchar(128) DEFAULT NULL;

-- ============================================================
-- 2. TABELA role_requests (para solicitações de role critic/specialist)
-- ============================================================
CREATE TABLE IF NOT EXISTS `role_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `requestedRole` enum('critic','specialist') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `message` text,
  `experience` text,
  `portfolio` text,
  `specialties` text,
  `reviewedBy` int,
  `reviewNote` text,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `role_requests_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 3. TABELA plans (planos de assinatura)
-- ============================================================
CREATE TABLE IF NOT EXISTS `plans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT 0,
  `interval` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
  `features` json,
  `roles` json,
  `wizardSteps` json,
  `stripePriceId` varchar(128),
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 4. COLUNAS FALTANTES NA TABELA subscriptions
-- ============================================================
ALTER TABLE `subscriptions` ADD COLUMN `planId` int DEFAULT NULL;
ALTER TABLE `subscriptions` ADD COLUMN `stripeSubscriptionId` varchar(128) DEFAULT NULL;
ALTER TABLE `subscriptions` ADD COLUMN `stripeSessionId` varchar(128) DEFAULT NULL;

-- Atualizar enum paymentMethod para incluir 'stripe'
ALTER TABLE `subscriptions` MODIFY COLUMN `paymentMethod` enum('pix','credit_card','stripe','admin_grant') NOT NULL DEFAULT 'admin_grant';

-- ============================================================
-- 5. COLUNAS FALTANTES NA TABELA plans (roles, wizardSteps, stripePriceId)
-- Se a tabela já existia mas sem essas colunas:
-- ============================================================
ALTER TABLE `plans` ADD COLUMN `roles` json DEFAULT NULL;
ALTER TABLE `plans` ADD COLUMN `wizardSteps` json DEFAULT NULL;
ALTER TABLE `plans` ADD COLUMN `stripePriceId` varchar(128) DEFAULT NULL;

-- ============================================================
-- 6. TABELA promo_code_establishments
-- ============================================================
CREATE TABLE IF NOT EXISTS `promo_code_establishments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `promoCodeId` int NOT NULL,
  `establishmentId` int NOT NULL,
  `status` enum('pending','accepted','on_hold') NOT NULL DEFAULT 'pending',
  `respondedAt` bigint DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `promo_code_establishments_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 7. TABELA survey_skip_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS `survey_skip_rules` (
  `id` int AUTO_INCREMENT NOT NULL,
  `phase` enum('onboarding','explorer','connoisseur') NOT NULL,
  `trigger_question_id` varchar(64) NOT NULL,
  `trigger_value` varchar(255) NOT NULL,
  `skip_question_ids` json NOT NULL,
  `description` varchar(500),
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `survey_skip_rules_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 8. TABELA user_rankings
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_rankings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `categoryId` int,
  `points` int NOT NULL DEFAULT 0,
  `level` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_rankings_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 9. TABELA specialist_applications
-- ============================================================
CREATE TABLE IF NOT EXISTS `specialist_applications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `specialtyArea` varchar(255),
  `experience` text,
  `portfolio` text,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` int,
  `reviewNote` text,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `specialist_applications_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 10. TABELA age_verification_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS `age_verification_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `method` enum('document','selfie','credit_card') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `documentUrl` text,
  `reviewedBy` int,
  `reviewNote` text,
  `reviewedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `age_verification_requests_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 11. TABELA menu_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS `menu_categories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `establishmentId` int NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `active` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `menu_categories_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 12. TABELA group_invites
-- ============================================================
CREATE TABLE IF NOT EXISTS `group_invites` (
  `id` int AUTO_INCREMENT NOT NULL,
  `groupId` int NOT NULL,
  `invitedBy` int NOT NULL,
  `invitedUserId` int,
  `inviteCode` varchar(64),
  `status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
  `expiresAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `group_invites_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 13. TABELA event_location_options
-- ============================================================
CREATE TABLE IF NOT EXISTS `event_location_options` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text,
  `lat` decimal(10,8),
  `lng` decimal(11,8),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `event_location_options_id` PRIMARY KEY(`id`)
);

-- ============================================================
-- 14. COLUNAS phone/phoneVerified na tabela users (se não existirem)
-- ============================================================
ALTER TABLE `users` ADD COLUMN `phone` varchar(32) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN `phoneVerified` boolean NOT NULL DEFAULT false;

-- ============================================================
-- PRONTO! Após executar, faça um novo deploy no Render.
-- ============================================================
