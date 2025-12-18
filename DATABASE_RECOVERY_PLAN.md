# DATABASE RECOVERY PLAN - URGENT

## What Happened

When linking to LeadChopper, the 47 Industries database schema was overwritten.

**What's SAFE:**
- ✅ All 7 users still exist (Kyle, Dean, Dylan, Wesley + customers)
- ✅ All code is safe in Git repository
- ✅ User table is intact with all accounts

**What's GONE:**
- ❌ Product table
- ❌ Order table
- ❌ Bill/BillInstance tables
- ❌ All other 47 Industries tables

**What's NEW (LeadChopper):**
- AutopilotState
- Campaign
- EmailTemplate
- Lead
- LeadActivity
- Project
- SentEmail
- SuppressionList

## RECOVERY OPTIONS

### Option 1: Restore from Railway Backup (BEST IF AVAILABLE)

**Steps:**

1. **Check for Backups:**
   - Go to Railway: https://railway.app
   - Select your 47-industries project
   - Click on the MySQL service
   - Look for "Backups", "Snapshots", or "Recovery" tab
   - Check if there are automatic backups from before today

2. **If Backups Exist:**
   - Find the most recent backup from BEFORE you linked LeadChopper
   - Railway should have a "Restore" button
   - This will restore ALL your data (Products, Orders, Bills, etc.)
   - **WARNING:** This will delete the LeadChopper tables

3. **After Restore:**
   - The 47 Industries site will work normally
   - You'll need to set up LeadChopper in a SEPARATE database

### Option 2: Create New Database for LeadChopper (RECOMMENDED)

**If you want to keep BOTH applications:**

1. **In Railway:**
   - Create a NEW MySQL service for LeadChopper
   - Get the new DATABASE_URL
   - Update LeadChopper's environment variables to use the new database
   - Leave 47 Industries database alone

2. **Then restore 47 Industries schema:**
   - Run the migration script (see Option 3 below)
   - This will add back all missing tables
   - Your users will remain intact

### Option 3: Rebuild 47 Industries Schema (IF NO BACKUPS)

**If Railway has NO backups, we can rebuild:**

**What Will Be Lost PERMANENTLY:**
- All products you created
- All orders
- All bills and financial data
- All custom requests
- All service inquiries

**What Will Be Kept:**
- All user accounts (already confirmed safe)
- All code and functionality

**Recovery Steps:**

```bash
# 1. Make absolutely sure you want to do this
# This will DROP the LeadChopper tables and create 47 Industries tables

# 2. Set DATABASE_URL
export DATABASE_URL="mysql://root:IoOlsZtgeKEPyMcMVPcyAlASLinJYgTq@shuttle.proxy.rlwy.net:11561/railway"

# 3. Run migration to create all 47 Industries tables
# This will DROP existing tables that conflict
npx prisma migrate deploy --force-reset

# 4. The User table will be recreated but data might be lost
# You'll need to re-add admin users or restore from the backup we found
```

## IMMEDIATE ACTIONS

**RIGHT NOW:**

1. **Check Railway for backups** - This is the fastest recovery
2. **DO NOT run any migration commands yet** - Wait until we know if backups exist
3. **Screenshot your Railway backup settings** so I can help

**If you have backups:**
- Restore from the most recent backup before LeadChopper
- This is instant and will recover everything

**If you DON'T have backups:**
- Decision time: Do you need the LeadChopper data?
  - **YES**: Create separate database for LeadChopper, then restore 47 schema
  - **NO**: Drop LeadChopper tables and restore 47 schema (loses products/orders)

## Data We Can Recover

Since we have your User table data, I can create a SQL dump of just the users to restore after migration if needed:

```sql
-- User data is safe, we can re-insert after schema migration
INSERT INTO User (id, email, name, username, role, ...) VALUES (...);
```

## Prevention for Future

**To prevent this:**
1. Always use SEPARATE databases for different applications
2. Railway allows multiple MySQL services per project
3. Never point two apps at the same DATABASE_URL

## Questions?

**Check Railway backups FIRST**, then let me know what you find and I'll guide you through the next steps.
