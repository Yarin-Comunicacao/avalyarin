-- Normalize establishment categories after the removal of Restaurante.
-- This migration intentionally preserves category names/slugs except for
-- vegetariano -> vegetarian and adds Sorveteria.
--
-- The temporary ID range prevents primary-key collisions while moving the
-- legacy high IDs into the sequential range 18-24.

START TRANSACTION;

-- Stage the legacy high IDs in a collision-free temporary range.
UPDATE `categories`
SET `id` = `id` + 100000
WHERE `id` IN (30001, 30002, 60001, 60003, 60004, 70003, 70004);

-- Move every dependent category reference to its final ID.
UPDATE `establishments`
SET `categoryId` = CASE `categoryId`
  WHEN 130001 THEN 18
  WHEN 130002 THEN 19
  WHEN 160001 THEN 20
  WHEN 160003 THEN 21
  WHEN 160004 THEN 22
  WHEN 170003 THEN 23
  WHEN 170004 THEN 24
  ELSE `categoryId`
END
WHERE `categoryId` IN (130001, 130002, 160001, 160003, 160004, 170003, 170004);

UPDATE `user_rankings`
SET `categoryId` = CASE `categoryId`
  WHEN 130001 THEN 18
  WHEN 130002 THEN 19
  WHEN 160001 THEN 20
  WHEN 160003 THEN 21
  WHEN 160004 THEN 22
  WHEN 170003 THEN 23
  WHEN 170004 THEN 24
  ELSE `categoryId`
END
WHERE `categoryId` IN (130001, 130002, 160001, 160003, 160004, 170003, 170004);

UPDATE `establishment_categories`
SET `categoryId` = CASE `categoryId`
  WHEN 130001 THEN 18
  WHEN 130002 THEN 19
  WHEN 160001 THEN 20
  WHEN 160003 THEN 21
  WHEN 160004 THEN 22
  WHEN 170003 THEN 23
  WHEN 170004 THEN 24
  ELSE `categoryId`
END
WHERE `categoryId` IN (130001, 130002, 160001, 160003, 160004, 170003, 170004);

-- Assign the requested final IDs, codes and slugs.
UPDATE `categories` SET `id` = 18, `code` = 'ca018', `slug` = 'vegan' WHERE `id` = 130001;
UPDATE `categories` SET `id` = 19, `code` = 'ca019', `slug` = 'acai' WHERE `id` = 130002;
UPDATE `categories` SET `id` = 20, `code` = 'ca020', `slug` = 'vegetarian' WHERE `id` = 160001;
UPDATE `categories` SET `id` = 21, `code` = 'ca021', `slug` = 'gastrobar' WHERE `id` = 160003;
UPDATE `categories` SET `id` = 22, `code` = 'ca022', `slug` = 'lanches' WHERE `id` = 160004;
UPDATE `categories` SET `id` = 23, `code` = 'ca023', `slug` = 'casa-de-carnes' WHERE `id` = 170003;
UPDATE `categories` SET `id` = 24, `code` = 'ca024', `slug` = 'casual-dining' WHERE `id` = 170004;

-- Add the new category only when it is not already present.
INSERT INTO `categories` (`id`, `code`, `slug`, `name`, `description`, `active`, `createdAt`)
SELECT 25, 'ca025', 'ice-cream-parlor', 'Sorveteria', 'Sorvetes, gelatos e sobremesas geladas', 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `categories`
  WHERE `id` = 25 OR `slug` = 'ice-cream-parlor' OR `code` = 'ca025'
);

COMMIT;
