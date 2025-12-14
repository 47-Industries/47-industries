import { prisma } from '@/lib/prisma'

interface ExpoPushMessage {
  to: string
  sound?: 'default' | null
  title?: string
  body?: string
  data?: Record<string, any>
  priority?: 'default' | 'normal' | 'high'
}

interface ExpoPushTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error: string }
}

export class PushNotificationService {
  private expoUrl = 'https://exp.host/--/api/v2/push/send'

  async getActiveTokens(): Promise<string[]> {
    const tokens = await prisma.pushToken.findMany({
      where: { active: true },
      select: { token: true }
    })
    return tokens.map(t => t.token)
  }

  async registerToken(token: string, platform: string, deviceName?: string): Promise<any> {
    return prisma.pushToken.upsert({
      where: { token },
      update: {
        platform,
        deviceName,
        active: true,
        updatedAt: new Date()
      },
      create: {
        token,
        platform,
        deviceName,
        active: true
      }
    })
  }

  async deactivateToken(token: string): Promise<void> {
    await prisma.pushToken.update({
      where: { token },
      data: { active: false }
    }).catch(() => {
      // Token might not exist
    })
  }

  async sendPushNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ sent: number; failed: number }> {
    const tokens = await this.getActiveTokens()

    if (tokens.length === 0) {
      console.log('[PUSH] No active push tokens')
      return { sent: 0, failed: 0 }
    }

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high'
    }))

    try {
      const response = await fetch(this.expoUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messages)
      })

      const result = await response.json()
      const tickets: ExpoPushTicket[] = result.data || []

      let sent = 0
      let failed = 0

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i]
        if (ticket.status === 'ok') {
          sent++
        } else {
          failed++
          // Deactivate invalid tokens
          if (ticket.details?.error === 'DeviceNotRegistered') {
            await this.deactivateToken(tokens[i])
            console.log(`[PUSH] Deactivated invalid token: ${tokens[i].substring(0, 20)}...`)
          }
        }
      }

      console.log(`[PUSH] Sent: ${sent}, Failed: ${failed}`)
      return { sent, failed }
    } catch (error: any) {
      console.error('[PUSH] Error sending notifications:', error.message)
      return { sent: 0, failed: tokens.length }
    }
  }

  async sendBillNotification(
    vendor: string,
    amount: number | null,
    dueDate: string | null
  ): Promise<void> {
    const amountStr = amount ? `$${amount.toFixed(2)}` : 'See details'
    const dueStr = dueDate || 'Check app'

    await this.sendPushNotification(
      `Bill: ${vendor}`,
      `Amount: ${amountStr} | Due: ${dueStr}`,
      { type: 'bill', vendor, amount, dueDate }
    )
  }

  async sendPaymentConfirmation(
    vendor: string,
    amount: number | null
  ): Promise<void> {
    const amountStr = amount ? `$${amount.toFixed(2)}` : 'See details'

    await this.sendPushNotification(
      `Payment: ${vendor}`,
      `${amountStr} - Confirmed`,
      { type: 'payment', vendor, amount }
    )
  }

  async getTokenCount(): Promise<number> {
    return prisma.pushToken.count({ where: { active: true } })
  }
}

export const pushService = new PushNotificationService()
