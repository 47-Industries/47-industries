# MotoRev Affiliate Integration Guide

This document describes the changes needed in the MotoRev backend to integrate with the 47 Industries affiliate system.

## Overview

When a user signs up for MotoRev using an affiliate referral code and later converts to a Pro subscription, the MotoRev backend should report this conversion to 47 Industries so the affiliate partner can receive their commission.

## Required Database Changes

### Add Referral Fields to Users Table

```sql
ALTER TABLE users ADD COLUMN referred_by_code VARCHAR(20);
ALTER TABLE users ADD COLUMN pro_conversion_reported BOOLEAN DEFAULT FALSE;
```

Or if using an ORM like Sequelize/Prisma, add these fields to your User model.

## Required Code Changes

### 1. Accept Referral Code on Signup

**File:** `/MotoRevBackend/src/routes/auth.js` (or equivalent registration endpoint)

When a user registers, check for a `referralCode` in the request body and store it:

```javascript
// In your registration/signup endpoint
router.post('/register', async (req, res) => {
  const { email, password, name, referralCode } = req.body;

  // ... existing registration logic ...

  // Store referral code if provided
  const newUser = await User.create({
    email,
    password: hashedPassword,
    name,
    // Store the referral code
    referred_by_code: referralCode || null,
    pro_conversion_reported: false,
  });

  // ... rest of registration logic ...
});
```

**Important:** Do NOT call the 47 Industries API on signup. We only track and pay for Pro conversions, not signups.

### 2. Report Pro Conversions

**File:** `/MotoRevBackend/src/routes/users.js` (or your receipt verification endpoint)

After successfully verifying a Pro subscription purchase, report the conversion to 47 Industries:

```javascript
// In your receipt verification endpoint (e.g., /users/verify-receipt)
router.post('/verify-receipt', async (req, res) => {
  // ... existing receipt verification logic ...

  // After successful Pro verification
  if (isProSubscription && verificationSuccessful) {
    // Check if user was referred and not already reported
    const user = await User.findByPk(userId);

    if (user.referred_by_code && !user.pro_conversion_reported) {
      try {
        const response = await fetch(process.env.AFFILIATE_API_URL, {
          method: 'POST',
          headers: {
            'X-API-Key': process.env.AFFILIATE_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'PRO_CONVERSION',
            referralCode: user.referred_by_code,
            userId: user.id.toString(),
            email: user.email,
            productId: productId, // e.g., 'motorev.pro.monthly' or 'motorev.pro.yearly'
            signupAt: user.created_at.toISOString(),
            convertedAt: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          // Mark as reported to prevent duplicate commissions
          await user.update({ pro_conversion_reported: true });
          console.log('Affiliate conversion reported successfully');
        } else {
          const error = await response.json();
          console.error('Affiliate API error:', error);
        }
      } catch (err) {
        // Don't block Pro upgrade if affiliate API fails
        console.error('Failed to report affiliate conversion:', err);
      }
    }
  }

  // ... rest of verification response ...
});
```

## Environment Variables

Add these environment variables to your MotoRev backend:

```env
# 47 Industries Affiliate Integration
AFFILIATE_API_KEY=your-shared-secret-key
AFFILIATE_API_URL=https://47industries.com/api/affiliate/motorev
```

**Important:** The `AFFILIATE_API_KEY` must match the `MOTOREV_AFFILIATE_API_KEY` configured in the 47 Industries environment.

## API Request Format

### Endpoint
`POST https://47industries.com/api/affiliate/motorev`

### Headers
```
X-API-Key: your-shared-secret-key
Content-Type: application/json
```

### Request Body
```json
{
  "event": "PRO_CONVERSION",
  "referralCode": "KYLE50",
  "userId": "12345",
  "email": "user@example.com",
  "productId": "motorev.pro.monthly",
  "signupAt": "2024-01-15T10:30:00.000Z",
  "convertedAt": "2024-01-20T14:45:00.000Z"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Pro conversion recorded successfully",
  "referralId": "clxyz123",
  "commissionId": "clxyz456",
  "commissionAmount": 2.50,
  "partnerName": "Kyle Rivers"
}
```

### Response (Errors)
```json
// Partner not found
{ "error": "Partner not found or inactive" }

// Duplicate conversion
{ "error": "Pro conversion already credited for this user" }

// Outside conversion window
{ "success": false, "message": "Pro conversion is outside the 30-day window", "eligible": false }
```

## Conversion Window

The affiliate system has a configurable conversion window (default 30 days). If a user signs up with a referral code but doesn't convert to Pro within the window, no commission is paid.

This prevents paying commissions for users who may have organically converted long after the referral.

## Testing

### Test Scenarios

1. **User signs up with referral code and converts within 30 days**
   - Expected: Commission created for affiliate partner

2. **User signs up with referral code and converts after 30 days**
   - Expected: No commission (outside window)

3. **User converts to Pro multiple times (renewal)**
   - Expected: Only first conversion triggers commission (duplicate prevention)

4. **User signs up without referral code**
   - Expected: No API call made

### Test with curl

```bash
curl -X POST https://47industries.com/api/affiliate/motorev \
  -H "X-API-Key: your-test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PRO_CONVERSION",
    "referralCode": "TESTCODE",
    "userId": "test-123",
    "email": "test@example.com",
    "productId": "motorev.pro.monthly",
    "signupAt": "2024-01-15T10:30:00.000Z",
    "convertedAt": "2024-01-20T14:45:00.000Z"
  }'
```

## Commission Structure

- **Pro Conversion Bonus:** $2.50 (configurable per partner)
- **Conversion Window:** 30 days (configurable per partner)
- **Signup Bonus:** $0 (no commission for signups)

Partners earn a flat bonus when a referred user converts to Pro within the conversion window. This model prevents fraud from low-quality signups and ensures affiliates are incentivized to bring users who actually convert.

## Security Notes

1. Always validate the API key before processing requests
2. Use HTTPS in production
3. Keep the API key secret and rotate periodically
4. The duplicate prevention (pro_conversion_reported flag) prevents commission fraud
