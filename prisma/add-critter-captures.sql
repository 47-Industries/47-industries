-- Add Critter Captures - Real Client Project
INSERT INTO ServiceProject (id, title, slug, category, categories, clientName, description, challenge, solution, results, technologies, isFeatured, isActive, sortOrder, createdAt, updatedAt)
VALUES (
  UUID(),
  'Critter Captures',
  'critter-captures',
  'WEB_DEVELOPMENT',
  '["WEB_DEVELOPMENT"]',
  'Critter Captures Wildlife Control',
  'A professional website for a local wildlife control and extermination company. The site showcases their services, service areas, and provides easy contact options for customers dealing with unwanted critters.',
  'The client needed a professional online presence to compete with larger pest control companies. They wanted to highlight their humane capture methods and local expertise while making it easy for customers to request service.',
  'We designed and developed a clean, professional website that emphasizes trust and expertise. The site features service area maps, detailed service descriptions, an emergency contact system, and lead capture forms optimized for conversion.',
  'The new website significantly improved the client''s online visibility and lead generation, helping them compete effectively in their local market.',
  '["Next.js", "React", "Tailwind CSS", "Vercel"]',
  0, 1, 4,
  NOW(), NOW()
);
