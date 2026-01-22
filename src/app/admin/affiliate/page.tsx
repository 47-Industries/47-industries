'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page has been moved to /admin/partners/referrals
// Redirect for backwards compatibility
export default function AdminAffiliatePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/partners/referrals')
  }, [router])

  return (
    <div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>
      <p style={{ color: '#a1a1aa' }}>Redirecting to Partner Referrals...</p>
    </div>
  )
}
