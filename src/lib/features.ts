import { prisma } from '@/lib/prisma'

export interface FeatureSettings {
  shopEnabled: boolean
  custom3DPrintingEnabled: boolean
  webDevServicesEnabled: boolean
  appDevServicesEnabled: boolean
  motorevEnabled: boolean
}

// Default feature settings
const DEFAULT_FEATURES: FeatureSettings = {
  shopEnabled: true,
  custom3DPrintingEnabled: true,
  webDevServicesEnabled: true,
  appDevServicesEnabled: true,
  motorevEnabled: true,
}

/**
 * Get feature toggle settings from database (server-side only)
 * Use this in Server Components and API routes
 */
export async function getFeatureSettings(): Promise<FeatureSettings> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'shopEnabled',
            'custom3DPrintingEnabled',
            'webDevServicesEnabled',
            'appDevServicesEnabled',
            'motorevEnabled',
          ],
        },
      },
    })

    // Start with defaults, override with database values
    const features = { ...DEFAULT_FEATURES }

    settings.forEach((s) => {
      // Convert string 'true'/'false' to boolean
      features[s.key as keyof FeatureSettings] = s.value === 'true'
    })

    return features
  } catch (error) {
    console.error('Error fetching feature settings:', error)
    // Return defaults on error
    return DEFAULT_FEATURES
  }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureSettings): Promise<boolean> {
  const settings = await getFeatureSettings()
  return settings[feature]
}
