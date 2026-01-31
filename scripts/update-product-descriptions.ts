// Script to update all apparel product descriptions
// Run with: npx tsx scripts/update-product-descriptions.ts

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '..', '.env') })

// Product descriptions based on product name patterns
const DESCRIPTIONS: Record<string, string> = {
  // Bikini Sets
  '47 | Bikini Set': 'Make a statement poolside with the 47 Bikini Set. Features a supportive top with adjustable straps and matching high-waisted bottoms. Made from quick-dry, chlorine-resistant fabric with UPF 50+ sun protection. The subtle 47 Industries branding shows you build different, even at the beach.',

  '47 Industries Bikini Set': 'The 47 Industries Bikini Set combines style with performance. Premium recycled polyester blend with four-way stretch for all-day comfort. Features removable padding, adjustable ties, and our signature logo placement. Designed for those who demand more from their swimwear.',

  // Swim Trunks
  '47 Industries | "Blues" Swim Trunks': 'Dive into the Blues collection. These premium swim trunks feature an all-over wave-inspired print with quick-dry mesh lining. Elastic waistband with drawstring, side pockets, and back pocket with drainage. Built for beach days, pool sessions, and everything in between.',

  '47 Industries Swim Trunks': 'Classic 47 Industries swim trunks built for performance. Quick-dry polyester with mesh liner, elastic waistband, and secure pockets. Features our embroidered logo on the left leg. From the pool to the party, these trunks move with you.',

  // Phone Cases
  '47 Industries | "LUCID" Case for iPhone': 'The LUCID case features a dreamlike abstract design that catches the light. Dual-layer protection with shock-absorbing TPU liner and scratch-resistant polycarbonate shell. Precise cutouts for all ports and wireless charging compatible. Protection meets art.',

  '47 Industries | "SOSA" Case for iPhone': 'The SOSA case brings bold street-inspired graphics to your device. Impact-resistant dual-layer construction protects against drops up to 6 feet. Raised bezels guard your screen and camera. Slim profile slides easily into pockets.',

  '47 Industries Clear Case for iPhone': 'Show off your phone while keeping it protected. Crystal-clear polycarbonate with our signature 47 logo subtly displayed. Anti-yellowing coating stays pristine. Shock-absorbing corners and raised edges protect what matters.',

  '47 Industries | HRAW Case': 'The HRAW edition case features exclusive artwork from our creative collection. Premium hard-shell protection with soft microfiber lining. Supports wireless charging and fits perfectly in hand. Limited edition design for those who stand out.',

  // Hoodies
  '47 Industries | "Making Waves" Hoodie': 'The Making Waves hoodie features our signature wave graphic across the back. Premium 80% cotton, 20% polyester blend for ultimate comfort. Double-lined hood, front kangaroo pocket, and ribbed cuffs. For those making moves and making waves.',

  '47 Industries Embroidered Hoodie': 'Our flagship embroidered hoodie. Premium heavyweight fleece with a relaxed fit. Features precision embroidered 47 logo on the chest. Double-stitched seams, metal-tipped drawstrings, and a spacious kangaroo pocket. The hoodie that started it all.',

  '47 Industries x MINDSET | "Cutout" Hoodie': 'Part of our MINDSET collaboration. The Cutout hoodie features a striking geometric design with precision-cut detailing. Premium cotton-poly blend, oversized fit, and dropped shoulders. For those who think different and dress different.',

  '47 Industries x MINDSET | "Scattered" Hoodie': 'MINDSET collection exclusive. The Scattered hoodie features an abstract all-over print representing controlled chaos. Soft-washed fleece, relaxed fit, and reinforced stitching. Embrace the beautiful mess of building something great.',

  '47 Industries x MINDSET | Classic Embroidered Hoodie': 'The MINDSET Classic combines clean embroidery with premium construction. Features dual-branded embroidery on chest and subtle back detail. Heavyweight 400gsm cotton fleece, pre-shrunk and garment-dyed for a vintage feel.',

  'MotoRev Hoodie': 'Rep the ride with the official MotoRev hoodie. Premium cotton-poly blend with the MotoRev logo embroidered on the chest. Comfortable enough for long rides, stylish enough for the meetup after. Part of the official MotoRev apparel collection.',

  // T-Shirts & Tees
  '47 Industries | "Unity" Tee': 'The Unity tee represents our community coming together. Premium 100% ring-spun cotton with a modern fit. Features the Unity graphic on front and 47 branding on the sleeve. Soft, breathable, and built to last wash after wash.',

  '47 Industries | Black-Dye T-shirt': 'Our signature black-dye treatment gives each shirt a unique, weathered look. 100% cotton with a vintage wash that gets better with age. No two shirts are exactly alike. For those who appreciate imperfection.',

  '47 Industries Classic Long Sleeve Tee': 'The essential long sleeve for any season. Premium cotton jersey with a relaxed fit. Features our classic 47 logo on the chest and branded sleeve detail. Layer it up or wear it solo.',

  '47 Industries Classic Tee': 'The foundation of any wardrobe. Premium 100% combed cotton with a modern fit that flatters without clinging. Our signature 47 logo sits perfectly on the chest. Simple, clean, essential.',

  '47 Industries Muscle Shirt': 'Built for the gym, styled for the street. Lightweight, breathable fabric with dropped armholes for maximum range of motion. Features our motivational 47 graphic. Train hard, look good.',

  '47 Industries Gym Tank': 'Maximize your workout in our performance tank. Moisture-wicking fabric keeps you cool and dry. Relaxed fit with elongated armholes for unrestricted movement. The 47 logo reminds you why you grind.',

  // Polo & Collared
  '47 Industries | Exclusive Collared Shirt': 'Elevate your look with our exclusive collared shirt. Premium pique cotton with a tailored fit. Features embroidered 47 logo on the chest. Perfect for the office, the course, or anywhere that calls for refined style.',

  "47 Industries Men's Premium Polo": 'The Premium Polo sets the standard. 100% performance pique with moisture-wicking technology. Classic fit with a self-fabric collar and three-button placket. Our embroidered logo adds subtle brand recognition.',

  '47 | Polo T-shirt': 'Where casual meets professional. Our polo tee features a soft cotton-poly blend with a relaxed collar. The 47 logo is tastefully embroidered on the chest. Dress it up or down.',

  // Sweatshirts
  '47 Industries | The 47 Club Sweatshirt': 'Welcome to the club. This premium crewneck sweatshirt features exclusive 47 Club branding. Heavyweight fleece with a vintage wash for lived-in comfort from day one. Ribbed collar, cuffs, and hem. Members only.',

  // Jackets
  '47 Industries | Embroidered Champion Jacket': 'A collaboration with Champion that delivers on quality. Water-resistant shell with mesh lining. Features embroidered 47 Industries logo on chest and Champion C logo on sleeve. Full zip, side pockets, and elastic cuffs. Built to perform.',

  // Shorts
  '47 Industries Athletic Shorts': 'Performance shorts for serious athletes. Lightweight, quick-dry fabric with built-in compression liner. Secure zip pocket for your essentials. The 47 logo on the left leg shows your allegiance.',

  "47 Industries | Women's Athletic Shorts": 'Designed specifically for women who move. Soft, stretchy fabric with a flattering mid-rise waist. Built-in brief for support and coverage. Side pockets big enough for your phone. Train in style.',

  // Bags
  '47 Industries | Duffel Bag': 'The go-everywhere duffel. Durable polyester construction with reinforced handles and detachable shoulder strap. Large main compartment with interior pockets. Shoe compartment keeps your kicks separate. The 47 logo means you travel in style.',

  '47 Industries Fanny Pack': 'Hands-free convenience meets street style. Adjustable strap fits waist or crossbody. Multiple compartments keep you organized on the move. Water-resistant fabric and quality zippers. The modern essential.',

  // Hats
  '47 Industries Embroidered Beanie': 'Keep warm with our signature beanie. Soft acrylic knit with a cuffed design. Features our embroidered 47 logo front and center. One size fits most. Essential cold-weather gear.',

  '47 Industries Trucker Hat': 'The classic trucker silhouette with 47 Industries flair. Structured front with mesh back for breathability. Adjustable snapback closure fits all heads. Embroidered logo pops against the clean front panel.',

  // Accessories
  '47 Industries Flag': 'Fly your colors. Our premium flag measures 3x5 feet with reinforced grommets. Fade-resistant printing stands up to the elements. Whether its your garage, dorm, or office, let everyone know you build different.',

  '47 Industries Gaming Mouse Pad': 'Precision meets style. Our extended gaming mouse pad covers your entire desk setup. Smooth fabric surface for accurate tracking, rubber base prevents slipping. The subtle 47 branding shows you mean business.',

  '47 Industries Socks': 'Comfort from the ground up. Cushioned crew socks with arch support and reinforced heel and toe. Moisture-wicking fabric keeps feet dry all day. Features our 47 logo on the cuff.',

  '47 Industries Sticker Sheet': 'Deck out your gear with our premium sticker sheet. Includes multiple 47 Industries designs on durable vinyl. Weather-resistant and UV-protected. Perfect for laptops, water bottles, toolboxes, and anywhere you want to rep the brand.',

  '47 Industries | Mens Slides': 'Slip into comfort. Lightweight EVA construction with a contoured footbed. Perfect for post-workout, poolside, or just lounging. The embossed 47 logo adds understated style.',

  '47 Industries | Womens Slides': 'Effortless style meets all-day comfort. Sleek design with cushioned footbed. Perfect for the beach, the pool, or running errands. The 47 logo keeps it fresh.',

  // Drinkware
  '47 Industries Mug': 'Start your mornings right. Our ceramic mug holds 11oz of your favorite beverage. Dishwasher and microwave safe. The 47 logo reminds you to build different, one sip at a time.',

  '47 Industries | Travel Mug': 'Coffee on the go. Double-walled stainless steel keeps drinks hot for 12 hours or cold for 24. Leak-proof lid, fits standard cup holders. The 47 Industries logo goes wherever you go.',
}

async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  console.log('Updating product descriptions...\n')

  try {
    const products = await prisma.product.findMany({
      where: { fulfillmentType: 'PRINTFUL' },
      select: { id: true, name: true, description: true },
    })

    let updated = 0
    let skipped = 0

    for (const product of products) {
      // Try to find a matching description
      let newDescription: string | null = null

      // Check for exact match first
      if (DESCRIPTIONS[product.name]) {
        newDescription = DESCRIPTIONS[product.name]
      } else {
        // Try partial matches
        for (const [key, desc] of Object.entries(DESCRIPTIONS)) {
          if (product.name.includes(key) || key.includes(product.name.replace(/\s+/g, ' ').trim())) {
            newDescription = desc
            break
          }
        }
      }

      // Generate a generic description if no match found
      if (!newDescription) {
        const category = product.name.toLowerCase()
        if (category.includes('hoodie') || category.includes('sweatshirt')) {
          newDescription = `Premium 47 Industries hoodie crafted from soft cotton-poly blend. Features our signature logo and quality construction. A wardrobe essential for those who build different.`
        } else if (category.includes('tee') || category.includes('t-shirt') || category.includes('shirt')) {
          newDescription = `Quality 47 Industries tee made from premium cotton. Modern fit with signature branding. Soft, durable, and ready for whatever you build.`
        } else if (category.includes('case') || category.includes('iphone')) {
          newDescription = `Protect your device in style with this 47 Industries phone case. Dual-layer protection with precise cutouts. Wireless charging compatible.`
        } else if (category.includes('short') || category.includes('trunk')) {
          newDescription = `47 Industries performance shorts built for movement. Quick-dry fabric, secure pockets, and signature branding. Train hard, look good.`
        } else if (category.includes('bikini') || category.includes('swim')) {
          newDescription = `Make waves with 47 Industries swimwear. Premium fabric with quick-dry technology and UPF protection. Built for performance, designed for style.`
        } else {
          newDescription = `Official 47 Industries merchandise. Premium quality materials and craftsmanship. For those who build different.`
        }
      }

      if (newDescription && newDescription !== product.description) {
        await prisma.product.update({
          where: { id: product.id },
          data: { description: newDescription },
        })
        console.log(`Updated: ${product.name}`)
        updated++
      } else {
        skipped++
      }
    }

    console.log(`\nDone! Updated ${updated} products, skipped ${skipped}.`)
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
