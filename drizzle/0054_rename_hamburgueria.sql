-- Rename category 16 without changing its ID, code, slug, or references.
UPDATE `categories`
SET `name` = 'Hamburgueria'
WHERE `id` = 16
  AND (`slug` = 'hamburgueria' OR `code` = 'ca016');
