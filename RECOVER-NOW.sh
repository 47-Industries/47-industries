#!/bin/bash

set -e  # Exit on error

echo "============================================="
echo "47 INDUSTRIES - DATABASE RECOVERY"
echo "============================================="
echo ""
echo "This will:"
echo "1. Create all missing tables (Product, Order, Bill, etc.)"
echo "2. Restore all service packages"
echo "3. Restore all portfolio projects"
echo "4. Keep your existing users"
echo ""
read -p "Ready to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Creating database schema..."
npx prisma migrate deploy || {
    echo "No migrations found. Creating initial migration..."
    npx prisma migrate dev --name init --create-only
    npx prisma migrate deploy
}

echo ""
echo "Step 2: Restoring service packages..."
mysql -h shuttle.proxy.rlwy.net -P 11561 -u root -pIoOlsZtgeKEPyMcMVPcyAlASLinJYgTq railway < prisma/seed-services.sql

echo ""
echo "Step 3: Restoring portfolio projects..."
mysql -h shuttle.proxy.rlwy.net -P 11561 -u root -pIoOlsZtgeKEPyMcMVPcyAlASLinJYgTq railway < prisma/seed-portfolio.sql

echo ""
echo "Step 4: Running TypeScript seed (categories, etc.)..."
npm run seed

echo ""
echo "============================================="
echo "RECOVERY COMPLETE!"
echo "============================================="
echo ""
echo "✅ All tables created"
echo "✅ Service packages restored"
echo "✅ Portfolio projects restored"
echo "✅ Users preserved"
echo ""
echo "Your website should now be fully functional at:"
echo "https://47industries.com"
echo ""
echo "Admin login:"
echo "  https://47industries.com/admin/login"
echo "  Username: kylerivers"
echo "  Email: kyle@47industries.com"
echo ""
