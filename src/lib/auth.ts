import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        usernameOrEmail: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.usernameOrEmail || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const identifier = credentials.usernameOrEmail.trim()
        const password = credentials.password

        // Try to find user by username first
        let user = await prisma.user.findUnique({
          where: {
            username: identifier
          }
        })

        // If not found by username, try personal email (User.email)
        // MySQL is case-insensitive by default for VARCHAR columns
        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              email: identifier.toLowerCase()
            }
          })
        }

        // Also try with original case if not found (in case email was stored with different case)
        if (!user) {
          user = await prisma.user.findFirst({
            where: {
              email: identifier
            }
          })
        }

        // If still not found, try work email (TeamMember.workEmail)
        // MySQL is case-insensitive by default
        if (!user) {
          const teamMember = await prisma.teamMember.findFirst({
            where: {
              workEmail: identifier.toLowerCase()
            },
            include: {
              user: true
            }
          })
          if (teamMember?.user) {
            user = teamMember.user
          }
        }

        // Also try work email with original case
        if (!user) {
          const teamMember = await prisma.teamMember.findFirst({
            where: {
              workEmail: identifier
            },
            include: {
              user: true
            }
          })
          if (teamMember?.user) {
            user = teamMember.user
          }
        }

        if (!user) {
          console.log('Auth failed: User not found for identifier:', identifier)
          throw new Error('Invalid credentials')
        }

        if (!user.password) {
          console.log('Auth failed: User has no password set:', user.email)
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          console.log('Auth failed: Invalid password for user:', user.email)
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.image = user.image
      }
      // Refresh user data on session update
      if (trigger === 'update' && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true, role: true },
        })
        if (freshUser) {
          token.image = freshUser.image
          token.role = freshUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.image = token.image as string | null
      }
      return session
    }
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
