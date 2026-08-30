-- SIMPLE RECOVERY FOR TIDB SQL EDITOR
-- Run the statements one at a time, in the order shown.
-- Do not run 0053, 0055 or 0056 again.

-- 1) PRECHECK: IDs 18-25 must be unused, except rows you intentionally want to replace.
SELECT id, code, slug, name FROM categories ORDER BY id;
SELECT id, code, slug, name FROM categories WHERE id BETWEEN 18 AND 25 ORDER BY id;

-- 2) Start a transaction.
START TRANSACTION;

-- 3) Update references before changing category IDs.
UPDATE establishments e
JOIN categories c ON c.id = e.categoryId
SET e.categoryId = CASE c.slug
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE e.categoryId
END
WHERE c.slug IN ('vegan','acai','vegetariano','vegetarian','gastrobar','lanches','casa-de-carnes','casual-dining');

UPDATE user_rankings r
JOIN categories c ON c.id = r.categoryId
SET r.categoryId = CASE c.slug
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE r.categoryId
END
WHERE c.slug IN ('vegan','acai','vegetariano','vegetarian','gastrobar','lanches','casa-de-carnes','casual-dining');

UPDATE establishment_categories ec
JOIN categories c ON c.id = ec.categoryId
SET ec.categoryId = CASE c.slug
  WHEN 'vegan' THEN 18
  WHEN 'acai' THEN 19
  WHEN 'vegetariano' THEN 20
  WHEN 'vegetarian' THEN 20
  WHEN 'gastrobar' THEN 21
  WHEN 'lanches' THEN 22
  WHEN 'casa-de-carnes' THEN 23
  WHEN 'casual-dining' THEN 24
  ELSE ec.categoryId
END
WHERE c.slug IN ('vegan','acai','vegetariano','vegetarian','gastrobar','lanches','casa-de-carnes','casual-dining');

-- 4) Set the final IDs and codes one category at a time.
UPDATE categories SET id = 18, code = 'ca018' WHERE slug = 'vegan';
UPDATE categories SET id = 19, code = 'ca019' WHERE slug = 'acai';
UPDATE categories SET id = 20, code = 'ca020', slug = 'vegetarian' WHERE slug IN ('vegetariano','vegetarian');
UPDATE categories SET id = 21, code = 'ca021' WHERE slug = 'gastrobar';
UPDATE categories SET id = 22, code = 'ca022' WHERE slug = 'lanches';
UPDATE categories SET id = 23, code = 'ca023' WHERE slug = 'casa-de-carnes';
UPDATE categories SET id = 24, code = 'ca024' WHERE slug = 'casual-dining';
UPDATE categories SET name = 'Hamburgueria', code = 'ca016', slug = 'hamburgueria' WHERE id = 16;

-- 5) Add Sorveteria if it does not exist.
INSERT INTO categories (id, code, slug, name, description, active, createdAt)
SELECT 25, 'ca025', 'ice-cream-parlor', 'Sorveteria', 'Sorvetes, gelatos e sobremesas geladas', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE id = 25 OR slug = 'ice-cream-parlor' OR code = 'ca025');

-- 6) Check the result before committing.
SELECT id, code, slug, name FROM categories ORDER BY id;
SELECT categoryId, COUNT(*) AS total FROM establishments GROUP BY categoryId ORDER BY categoryId;

-- 7) If the checks are correct, commit. Otherwise use ROLLBACK instead.
COMMIT;
