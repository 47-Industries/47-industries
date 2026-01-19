import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

if (!accountSid || !authToken || !verifyServiceSid) {
  console.warn('Twilio credentials not configured')
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null

/**
 * Send a verification code via SMS
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
  if (!client || !verifyServiceSid) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    // Format phone number (add +1 if not present for US numbers)
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: 'sms',
      })

    return { success: true }
  } catch (error: any) {
    console.error('Twilio verification error:', error)
    return { success: false, error: error.message || 'Failed to send verification code' }
  }
}

/**
 * Verify a code entered by the user
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
  if (!client || !verifyServiceSid) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    // Format phone number
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code,
      })

    if (verification.status === 'approved') {
      return { success: true }
    } else {
      return { success: false, error: 'Invalid verification code' }
    }
  } catch (error: any) {
    console.error('Twilio verification check error:', error)
    return { success: false, error: error.message || 'Failed to verify code' }
  }
}
