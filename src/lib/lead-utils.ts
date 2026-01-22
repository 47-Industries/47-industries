// Lead Interest System Utilities
// Maps lead interests to labels, categories, and service types

export type LeadInterest =
  | 'AI_RECEPTIONIST'
  | 'AI_LEAD_GENERATOR'
  | 'AI_AUTOMATION_OTHER'
  | 'WEB_DEVELOPMENT'
  | 'WEB_APP'
  | 'MOBILE_APP_IOS'
  | 'MOBILE_APP_ANDROID'
  | 'MOBILE_APP_BOTH'
  | 'BULK_3D_PRINTING'
  | 'CUSTOM_3D_PRINTING'
  | 'E_COMMERCE'
  | 'CONSULTATION'
  | 'OTHER'

export type LeadSource = 'PARTNER' | 'AI_RECEPTIONIST' | 'WEBSITE' | 'MANUAL'

export type EstimatedBudget = 'UNDER_1K' | '1K_5K' | '5K_15K' | '15K_50K' | 'OVER_50K'

export type Timeline = 'ASAP' | '1_MONTH' | '3_MONTHS' | '6_MONTHS' | 'FLEXIBLE'

export type CompanySize = 'SOLO' | 'SMALL_2_10' | 'MEDIUM_11_50' | 'LARGE_50_PLUS'

// Interest labels for display
export const LEAD_INTEREST_LABELS: Record<LeadInterest, string> = {
  AI_RECEPTIONIST: 'AI Receptionist',
  AI_LEAD_GENERATOR: 'AI Lead Generator',
  AI_AUTOMATION_OTHER: 'AI Automation',
  WEB_DEVELOPMENT: 'Web Development',
  WEB_APP: 'Web Application',
  MOBILE_APP_IOS: 'iOS App',
  MOBILE_APP_ANDROID: 'Android App',
  MOBILE_APP_BOTH: 'Mobile App (iOS + Android)',
  BULK_3D_PRINTING: 'Bulk 3D Printing',
  CUSTOM_3D_PRINTING: 'Custom 3D Printing',
  E_COMMERCE: 'E-Commerce Store',
  CONSULTATION: 'Consultation',
  OTHER: 'Other',
}

// Interest categories for grouped display
export const INTEREST_CATEGORIES: Record<string, LeadInterest[]> = {
  'AI & Automation': ['AI_RECEPTIONIST', 'AI_LEAD_GENERATOR', 'AI_AUTOMATION_OTHER'],
  'Web & Apps': ['WEB_DEVELOPMENT', 'WEB_APP', 'E_COMMERCE'],
  'Mobile Apps': ['MOBILE_APP_IOS', 'MOBILE_APP_ANDROID', 'MOBILE_APP_BOTH'],
  '3D Printing': ['BULK_3D_PRINTING', 'CUSTOM_3D_PRINTING'],
  'Other': ['CONSULTATION', 'OTHER'],
}

// Map interests to ServiceType for project creation
export function getRecommendedServiceType(
  interests: LeadInterest[]
): 'WEB_DEVELOPMENT' | 'APP_DEVELOPMENT' | 'AI_SOLUTIONS' | 'CONSULTATION' | 'OTHER' {
  // Priority order: AI > Mobile > Web > Consultation > Other
  const hasAI = interests.some((i) =>
    ['AI_RECEPTIONIST', 'AI_LEAD_GENERATOR', 'AI_AUTOMATION_OTHER'].includes(i)
  )
  if (hasAI) return 'AI_SOLUTIONS'

  const hasMobile = interests.some((i) =>
    ['MOBILE_APP_IOS', 'MOBILE_APP_ANDROID', 'MOBILE_APP_BOTH'].includes(i)
  )
  if (hasMobile) return 'APP_DEVELOPMENT'

  const hasWeb = interests.some((i) =>
    ['WEB_DEVELOPMENT', 'WEB_APP', 'E_COMMERCE'].includes(i)
  )
  if (hasWeb) return 'WEB_DEVELOPMENT'

  const hasConsultation = interests.includes('CONSULTATION')
  if (hasConsultation) return 'CONSULTATION'

  // 3D Printing and Other fall into OTHER
  return 'OTHER'
}

// Get category for a single interest
export function getInterestCategory(interest: LeadInterest): string {
  for (const [category, interests] of Object.entries(INTEREST_CATEGORIES)) {
    if (interests.includes(interest)) {
      return category
    }
  }
  return 'Other'
}

// Budget labels for display
export const BUDGET_LABELS: Record<EstimatedBudget, string> = {
  UNDER_1K: 'Under $1,000',
  '1K_5K': '$1,000 - $5,000',
  '5K_15K': '$5,000 - $15,000',
  '15K_50K': '$15,000 - $50,000',
  OVER_50K: '$50,000+',
}

// Timeline labels for display
export const TIMELINE_LABELS: Record<Timeline, string> = {
  ASAP: 'ASAP',
  '1_MONTH': 'Within 1 month',
  '3_MONTHS': 'Within 3 months',
  '6_MONTHS': 'Within 6 months',
  FLEXIBLE: 'Flexible',
}

// Company size labels for display
export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  SOLO: 'Solo / Individual',
  SMALL_2_10: 'Small (2-10 employees)',
  MEDIUM_11_50: 'Medium (11-50 employees)',
  LARGE_50_PLUS: 'Large (50+ employees)',
}

// Lead source labels for display
export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  PARTNER: 'Partner Referral',
  AI_RECEPTIONIST: 'AI Receptionist',
  WEBSITE: 'Website Form',
  MANUAL: 'Manual Entry',
}

// Get all interests as options for forms
export function getInterestOptions(): { value: LeadInterest; label: string; category: string }[] {
  const options: { value: LeadInterest; label: string; category: string }[] = []

  for (const [category, interests] of Object.entries(INTEREST_CATEGORIES)) {
    for (const interest of interests) {
      options.push({
        value: interest,
        label: LEAD_INTEREST_LABELS[interest],
        category,
      })
    }
  }

  return options
}

// Get budget options for forms
export function getBudgetOptions(): { value: EstimatedBudget; label: string }[] {
  return Object.entries(BUDGET_LABELS).map(([value, label]) => ({
    value: value as EstimatedBudget,
    label,
  }))
}

// Get timeline options for forms
export function getTimelineOptions(): { value: Timeline; label: string }[] {
  return Object.entries(TIMELINE_LABELS).map(([value, label]) => ({
    value: value as Timeline,
    label,
  }))
}

// Get company size options for forms
export function getCompanySizeOptions(): { value: CompanySize; label: string }[] {
  return Object.entries(COMPANY_SIZE_LABELS).map(([value, label]) => ({
    value: value as CompanySize,
    label,
  }))
}

// Validate that an array contains valid LeadInterest values
export function validateInterests(interests: unknown): interests is LeadInterest[] {
  if (!Array.isArray(interests)) return false
  const validInterests = Object.keys(LEAD_INTEREST_LABELS)
  return interests.every((i) => typeof i === 'string' && validInterests.includes(i))
}

// ServiceCategory enum values from Prisma schema (for portfolio filtering)
export type ServiceCategory =
  | 'WEB_DEVELOPMENT'
  | 'WEB_APP'
  | 'IOS_APP'
  | 'ANDROID_APP'
  | 'CROSS_PLATFORM_APP'
  | 'AI_AUTOMATION'
  | 'THREE_D_PRINTING'

// Map interest to portfolio ServiceCategory for filtering related portfolio items
export function getPortfolioCategoriesForInterest(
  interest: LeadInterest
): ServiceCategory[] {
  switch (interest) {
    case 'AI_RECEPTIONIST':
    case 'AI_LEAD_GENERATOR':
    case 'AI_AUTOMATION_OTHER':
      return ['AI_AUTOMATION']
    case 'MOBILE_APP_IOS':
      return ['IOS_APP']
    case 'MOBILE_APP_ANDROID':
      return ['ANDROID_APP']
    case 'MOBILE_APP_BOTH':
      return ['CROSS_PLATFORM_APP', 'IOS_APP', 'ANDROID_APP']
    case 'WEB_DEVELOPMENT':
      return ['WEB_DEVELOPMENT']
    case 'WEB_APP':
    case 'E_COMMERCE':
      return ['WEB_APP', 'WEB_DEVELOPMENT']
    case 'BULK_3D_PRINTING':
    case 'CUSTOM_3D_PRINTING':
      return ['THREE_D_PRINTING']
    case 'CONSULTATION':
    case 'OTHER':
      return []
  }
}

// Get unique portfolio categories for an array of interests
export function getPortfolioCategoriesForInterests(
  interests: LeadInterest[]
): ServiceCategory[] {
  const categories = new Set<ServiceCategory>()

  for (const interest of interests) {
    const cats = getPortfolioCategoriesForInterest(interest)
    for (const cat of cats) {
      categories.add(cat)
    }
  }

  return Array.from(categories)
}

// Legacy aliases for backwards compatibility
export const getPortfolioServiceTypeForInterest = getPortfolioCategoriesForInterest
export const getPortfolioServiceTypesForInterests = getPortfolioCategoriesForInterests
