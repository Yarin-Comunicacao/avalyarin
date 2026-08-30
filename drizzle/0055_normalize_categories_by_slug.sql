-- Corrected category normalization based on slugs, not legacy IDs.
-- Run only after reviewing the preflight query below.
-- This migration does not delete establishments or menu data.

-- PREFLIGHT (run separately first):
-- SELECT id, code, slug, name FROM categories ORDER BY id;
-- SELECT categoryId, COUNT(*) AS total FROM establishments GROUP BY categoryId ORDER BY categoryId;

START TRANSACTION;

-- Stage only the seven categories that must become IDs 18-24.
-- The temporary range avoids collisions with IDs that may already be occupied.
UPDATE `categories`
SET `id` = `id` + 1000000
WHERE `slug` IN (
  'vegan',
  'acai',
  'vegetariano',
  'vegetarian',
  'gastrobar',
  'lanches',
  'casa-de-carnes',
  'casual-dining'
)
AND `id` <> 16;

-- Update all known category references using the staged category slug.
UPDATE `establishments` AS e
JOIN `categories` AS c ON c.`id` = e.`categoryId`
SET e.`categoryId` = CASE c.`slug`
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE e.`categoryId`
END
WHERE c.`id` >= 1000000;

UPDATE `user_rankings` AS r
JOIN `categories` AS c ON c.`id` = r.`categoryId`
SET r.`categoryId` = CASE c.`slug`
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE r.`categoryId`
END
WHERE c.`id` >= 1000000;

UPDATE `establishment_categories` AS ec
JOIN `categories` AS c ON c.`id` = ec.`categoryId`
SET ec.`categoryId` = CASE c.`slug`
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE ec.`categoryId`
END
WHERE c.`id` >= 1000000;

-- Assign the final IDs, codes and canonical slug values.
UPDATE `categories` SET `id` = 18, `code` = 'ca018', `slug` = 'vegan' WHERE `slug` = 'vegan' AND `id` >= 1000000;
UPDATE `categories` SET `id` = 19, `code` = 'ca019', `slug` = 'acai' WHERE `slug` = 'acai' AND `id` >= 1000000;
UPDATE `categories` SET `id` = 20, `code` = 'ca020', `slug` = 'vegetarian' WHERE `slug` IN ('vegetariano', 'vegetarian') AND `id` >= 1000000;
UPDATE `categories` SET `id` = 21, `code` = 'ca021', `slug` = 'gastrobar' WHERE `slug` = 'gastrobar' AND `id` >= 1000000;
UPDATE `categories` SET `id` = 22, `code` = 'ca022', `slug` = 'lanches' WHERE `slug` = 'lanches' AND `id` >= 1000000;
UPDATE `categories` SET `id` = 23, `code` = 'ca023', `slug` = 'casa-de-carnes' WHERE `slug` = 'casa-de-carnes' AND `id` >= 1000000;
UPDATE `categories` SET `id` = 24, `code` = 'ca024', `slug` = 'casual-dining' WHERE `slug` = 'casual-dining' AND `id` >= 1000000;

-- Rename the existing Hamburgueria category only.
UPDATE `categories`
SET `name` = 'Hamburgueria', `code` = 'ca016', `slug` = 'hamburgueria'
WHERE `id` = 16;

-- Add Sorveteria when it does not already exist.
INSERT INTO `categories` (`id`, `code`, `slug`, `name`, `description`, `active`, `createdAt`)
SELECT 25, 'ca025', 'ice-cream-parlor', 'Sorveteria', 'Sorvetes, gelatos e sobremesas geladas', 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `categories`
  WHERE `id` = 25 OR `slug` = 'ice-cream-parlor' OR `code` = 'ca025'
);

COMMIT;

-- POSTCHECK (run after commit):
-- SELECT id, code, slug, name FROM categories ORDER BY id;
-- SELECT categoryId, COUNT(*) AS total FROM establishments GROUP BY categoryId ORDER BY categoryId;
-- SELECT COUNT(*) AS orphaned_establishments
-- FROM establishments e LEFT JOIN categories c ON c.id = e.categoryId
-- WHERE c.id IS NULL;
