-- Migrate DESKTOP_APP packages to WEB_APP
UPDATE ServicePackage SET category = 'WEB_APP' WHERE category = 'DESKTOP_APP';

-- Migrate DESKTOP_APP projects to WEB_APP
UPDATE ServiceProject SET category = 'WEB_APP' WHERE category = 'DESKTOP_APP';

-- Update the slug names for the migrated packages
UPDATE ServicePackage SET
  slug = REPLACE(slug, 'desktop-', 'webapp-'),
  name = CASE
    WHEN name = 'Basic' THEN 'Starter'
    ELSE name
  END,
  shortDesc = CASE
    WHEN slug LIKE '%basic%' OR slug LIKE '%starter%' THEN 'Simple web application'
    WHEN slug LIKE '%professional%' THEN 'Full-featured web application'
    WHEN slug LIKE '%enterprise%' THEN 'Enterprise web platform'
    ELSE shortDesc
  END
WHERE slug LIKE 'desktop-%' OR slug LIKE 'webapp-%';
