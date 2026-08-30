-- Recovery migration after a partial execution of 0055.
-- IMPORTANT: run the preflight queries first and confirm IDs 18-24 are unused.
-- Do not run 0053 or 0055 again.

-- PREFLIGHT (run separately):
-- SELECT id, code, slug, name FROM categories ORDER BY id;
-- SELECT id, code, slug, name FROM categories WHERE id BETWEEN 18 AND 24 ORDER BY id;

START TRANSACTION;

CREATE TEMPORARY TABLE `category_id_fix` (
  `slug` VARCHAR(128) NOT NULL PRIMARY KEY,
  `new_id` INT NOT NULL,
  `new_code` VARCHAR(8) NOT NULL,
  `new_slug` VARCHAR(128) NOT NULL
);

INSERT INTO `category_id_fix` (`slug`, `new_id`, `new_code`, `new_slug`) VALUES
  ('vegan', 18, 'ca018', 'vegan'),
  ('acai', 19, 'ca019', 'acai'),
  ('vegetariano', 20, 'ca020', 'vegetarian'),
  ('vegetarian', 20, 'ca020', 'vegetarian'),
  ('gastrobar', 21, 'ca021', 'gastrobar'),
  ('lanches', 22, 'ca022', 'lanches'),
  ('casa-de-carnes', 23, 'ca023', 'casa-de-carnes'),
  ('casual-dining', 24, 'ca024', 'casual-dining');

-- Move the affected category rows to a separate collision-free range.
UPDATE `categories` AS c
JOIN `category_id_fix` AS f ON f.`slug` = c.`slug`
SET c.`id` = c.`id` + 10000000;

-- Update all known references while the categories retain their slugs.
UPDATE `establishments` AS e
JOIN `categories` AS c ON c.`id` = e.`categoryId`
JOIN `category_id_fix` AS f ON f.`slug` = c.`slug`
SET e.`categoryId` = f.`new_id`
WHERE c.`id` >= 10000000;

UPDATE `user_rankings` AS r
JOIN `categories` AS c ON c.`id` = r.`categoryId`
JOIN `category_id_fix` AS f ON f.`slug` = c.`slug`
SET r.`categoryId` = f.`new_id`
WHERE c.`id` >= 10000000;

UPDATE `establishment_categories` AS ec
JOIN `categories` AS c ON c.`id` = ec.`categoryId`
JOIN `category_id_fix` AS f ON f.`slug` = c.`slug`
SET ec.`categoryId` = f.`new_id`
WHERE c.`id` >= 10000000;

-- Set the final IDs, codes and canonical slugs.
UPDATE `categories` AS c
JOIN `category_id_fix` AS f ON f.`slug` = c.`slug`
SET c.`id` = f.`new_id`,
    c.`code` = f.`new_code`,
    c.`slug` = f.`new_slug`
WHERE c.`id` >= 10000000;

-- Keep the existing category 16 name canonical.
UPDATE `categories`
SET `name` = 'Hamburgueria', `code` = 'ca016', `slug` = 'hamburgueria'
WHERE `id` = 16;

-- Add Sorveteria only if it is not already present.
INSERT INTO `categories` (`id`, `code`, `slug`, `name`, `description`, `active`, `createdAt`)
SELECT 25, 'ca025', 'ice-cream-parlor', 'Sorveteria', 'Sorvetes, gelatos e sobremesas geladas', 1, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `categories`
  WHERE `id` = 25 OR `slug` = 'ice-cream-parlor' OR `code` = 'ca025'
);

DROP TEMPORARY TABLE `category_id_fix`;
COMMIT;
