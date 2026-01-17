'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Prevent hydration mismatch by only checking mobile after mount
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('Login attempt with:', usernameOrEmail)

    try {
      const result = await signIn('credentials', {
        usernameOrEmail,
        password,
        redirect: false,
      })

      console.log('Sign in result:', result)

      if (result?.error) {
        console.error('Login error:', result.error)
        setError(result.error)
      } else if (result?.ok) {
        console.log('Login successful, redirecting...')
        router.push('/admin')
        router.refresh()
      } else {
        console.error('Unexpected result:', result)
        setError('Login failed. Please check your credentials.')
      }
    } catch (err) {
      console.error('Exception during login:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Use consistent values for SSR/client to prevent hydration mismatch
  const mobileStyles = mounted && isMobile

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo/Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: mobileStyles ? '32px' : '48px'
        }}>
          <h1 style={{
            fontSize: mobileStyles ? '28px' : '36px',
            fontWeight: 700,
            marginBottom: '8px',
            margin: 0
          }}>47 Admin</h1>
          <p style={{
            color: '#71717a',
            fontSize: '14px',
            margin: 0
          }}>Sign in to access the admin panel</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: mobileStyles ? '24px' : '32px'
          }}>
            {error && (
              <div style={{
                background: '#7f1d1d',
                border: '1px solid #991b1b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '8px',
                color: '#a1a1aa'
              }}>
                Username or Email
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="47industries or admin@47industries.com"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#a1a1aa'
                }}>
                  Password
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: '13px',
                    color: '#3b82f6',
                    textDecoration: 'none'
                  }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#52525b' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Back to Site Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px'
        }}>
          <a
            href="/"
            style={{
              color: '#71717a',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            ← Back to site
          </a>
        </div>
      </div>
    </div>
  )
}
