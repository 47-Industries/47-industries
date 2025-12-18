# Fix R2 Image Access - RESOLVED

## Problem (RESOLVED)
Portfolio images from R2 were returning "401 Unauthorized" even though R2 Public Access was enabled.

Old URL format: `https://pub-c892cc953a584679a819af5d326f6dca.r2.dev/...`

## Resolution
Fixed by:
1. Setting up custom domain: `files.47industries.com` in Cloudflare R2
2. Updated all database image URLs to use custom domain
3. Added proper directory prefixes (/logos/, /projects/) to match R2 bucket structure
4. All images now load correctly with 200 OK status

New URL format: `https://files.47industries.com/projects/...` or `https://files.47industries.com/logos/...`

## Solution Options

### Option 1: Custom Domain (RECOMMENDED)

Set up a custom domain for R2 to serve images publicly:

1. **In Cloudflare R2:**
   - Go to R2 → 47industries-files → Settings
   - Click "Connect Domain"
   - Add: `files.47industries.com` (or `cdn.47industries.com`)

2. **In Cloudflare DNS:**
   - Add CNAME record:
     - Name: `files` (or `cdn`)
     - Target: `pub-c892cc953a584679a819af5d326f6dca.r2.dev`
     - Proxy: ON (orange cloud)

3. **Update Database URLs:**
   Replace all `https://pub-c892cc953a584679a819af5d326f6dca.r2.dev/`
   With: `https://files.47industries.com/`

### Option 2: Public Bucket Access

Make the bucket completely public (less secure):

1. **In Cloudflare R2:**
   - Go to R2 → 47industries-files → Settings
   - Under "Public Access" → Enable "Allow Access"
   - This allows anyone to read files

2. **Get the public R2.dev URL:**
   - Should be: `https://pub-c892cc953a584679a819af5d326f6dca.r2.dev`
   - Test: Visit the URL + filename in browser

### Option 3: Use Cloudflare Workers (Most Secure)

Create a Worker to serve R2 files with proper access control:

1. Create Worker: `r2-public-assets`
2. Bind to R2 bucket: `47industries-files`
3. Route: `files.47industries.com/*`

## Quick Test

After fixing, test with:
```bash
curl -I https://files.47industries.com/logos/1764731183668-qb4n3uhdgo-BookFade.png
```

Should return: `HTTP/1.1 200 OK` (not 401)

## Database Update Script

After fixing R2 access, update all URLs:

```sql
UPDATE ServiceProject
SET thumbnailUrl = REPLACE(thumbnailUrl,
  'https://pub-c892cc953a584679a819af5d326f6dca.r2.dev/',
  'https://files.47industries.com/'
)
WHERE thumbnailUrl LIKE '%pub-c892cc953a584679a819af5d326f6dca%';
```
