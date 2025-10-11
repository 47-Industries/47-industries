# How to Add Your Logo

## Quick Setup

1. **Prepare your logo:**
   - Format: PNG or SVG (SVG recommended for best quality)
   - Recommended size: 600x200px (3:1 ratio)
   - Background: Transparent
   - Color: White/light color (for dark theme)

2. **Add logo to project:**
   - Save your logo as `logo.png` (or `logo.svg`)
   - Place it in the `/public` folder:
     ```
     47-industries/
     └── public/
         └── logo.png  ← Your logo here
     ```

3. **Enable logo in code:**
   - Open `src/components/layout/Logo.tsx`
   - Uncomment lines 20-25 (the Image component)
   - Comment out line 28 (the text fallback)
   - If using SVG, change `logo.png` to `logo.svg` on line 21

## Example

**Before (text logo):**
```tsx
{/* Logo Image - Uncomment and add your logo to /public/logo.png */}
{/* <Image
  src="/logo.png"
  alt="47 Industries"
  width={heights[size] * 3}
  height={heights[size]}
  className="h-auto"
/> */}

{/* Text Fallback */}
<span className="text-xl font-bold">47 Industries</span>
```

**After (image logo):**
```tsx
{/* Logo Image */}
<Image
  src="/logo.png"
  alt="47 Industries"
  width={heights[size] * 3}
  height={heights[size]}
  className="h-auto"
/>

{/* Text Fallback */}
{/* <span className="text-xl font-bold">47 Industries</span> */}
```

## That's it!

Your logo will now appear in:
- Navbar (top of every page)
- Footer (bottom of every page)

Push to GitHub and Railway will auto-deploy the changes.
