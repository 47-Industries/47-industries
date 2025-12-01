-- Update database URLs after moving files from products/ to projects/

-- Update all project-related URLs from products/ to projects/
UPDATE ServiceProject
SET thumbnailUrl = REPLACE(thumbnailUrl, '/products/', '/projects/')
WHERE thumbnailUrl LIKE '%/products/%'
AND (
  thumbnailUrl LIKE '%moto%'
  OR thumbnailUrl LIKE '%motorev%'
  OR thumbnailUrl LIKE '%refluxlabs%'
  OR thumbnailUrl LIKE '%Screenshot%'
);

UPDATE ServiceProject
SET images = REPLACE(images, '/products/', '/projects/')
WHERE images LIKE '%/products/%'
AND (
  images LIKE '%moto%'
  OR images LIKE '%motorev%'
  OR images LIKE '%refluxlabs%'
  OR images LIKE '%Screenshot%'
);
