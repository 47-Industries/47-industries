-- Update MotoRev with images from R2
UPDATE ServiceProject
SET
  thumbnailUrl = 'https://files.47industries.com/1764598429854-cvlxeqapuqb-moto_17.png',
  images = '["https://files.47industries.com/1764598631106-4f6xn6laykr-motorev-garage.png", "https://files.47industries.com/1764598631535-i7jsprhrhd-motorev-profile.png", "https://files.47industries.com/1764598632332-vkv2a7mr2f-motorev-social.png", "https://files.47industries.com/1764598632738-8enyvvrsl28-motorev-navigate.png", "https://files.47industries.com/1764598595234-yvpp1o3omtf-Screenshot_2025-12-01_at_9.15.45_AM.png"]'
WHERE slug = 'motorev';

-- Update Reflux Labs with its image
UPDATE ServiceProject
SET
  thumbnailUrl = 'https://files.47industries.com/1764606459630-pedpoblbrro-refluxlabs.png'
WHERE slug = 'reflux-labs';
