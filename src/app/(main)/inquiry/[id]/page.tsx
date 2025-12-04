import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Status display config
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  NEW: { label: 'Received', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  IN_PROGRESS: { label: 'In Review', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  QUOTED: { label: 'Quote Sent', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  COMPLETED: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/10' },
}

const serviceLabels: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  APP_DEVELOPMENT: 'App Development',
  AI_SOLUTIONS: 'AI Solutions',
  CONSULTATION: 'Consultation',
  OTHER: 'Other Services',
}

const serviceDetailLabels: Record<string, string> = {
  'WEBSITE': 'Website',
  'WEB_APP': 'Web Application',
  'IOS_APP': 'iOS App',
  'ANDROID_APP': 'Android App',
  'CROSS_PLATFORM': 'Cross-Platform App',
  'AI_AUTOMATION': 'AI Automation',
}

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const inquiry = await prisma.serviceInquiry.findFirst({
    where: { inquiryNumber: id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      package: true,
    },
  })

  if (!inquiry) {
    notFound()
  }

  const status = statusConfig[inquiry.status] || statusConfig.NEW
  const serviceLabel = serviceLabels[inquiry.serviceType] || inquiry.serviceType

  // Parse attachments for project details
  const attachments = inquiry.attachments as {
    formVersion?: number
    projectDetails?: {
      projectName?: string
      services?: string[]
      targetAudience?: string
      pages?: string
      screens?: string
      features?: string[]
      hasDesign?: string
      designNotes?: string
      referenceUrls?: string
      integrations?: string
      existingSystem?: string
      startDate?: string
    }
    selectedServices?: string[]
    selectedPackage?: string
  } | null

  const projectDetails = attachments?.projectDetails

  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          {/* Header */}
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <p className="text-text-secondary text-sm mb-1">Reference Number</p>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{inquiry.inquiryNumber}</h1>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${status.bgColor}`}>
                <div className={`w-2 h-2 rounded-full ${status.color} bg-current`}></div>
                <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-secondary mb-1">Submitted</p>
                <p className="text-text-primary font-medium">
                  {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Service Type</p>
                <p className="text-text-primary font-medium">{serviceLabel}</p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Last Updated</p>
                <p className="text-text-primary font-medium">
                  {new Date(inquiry.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Messages / Updates Section */}
          {inquiry.messages.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8 mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-6">Updates & Responses</h2>

              <div className="space-y-4">
                {inquiry.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border ${
                      message.isFromAdmin
                        ? 'bg-accent/5 border-accent/20'
                        : 'bg-surface-elevated border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        message.isFromAdmin ? 'bg-accent text-white' : 'bg-text-secondary/20 text-text-primary'
                      }`}>
                        {message.isFromAdmin ? '47' : inquiry.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {message.isFromAdmin ? (message.senderName || '47 Industries') : inquiry.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {new Date(message.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {message.isQuote && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-3">
                        <p className="text-sm text-green-400 font-medium mb-2">Quote Provided</p>
                        <div className="flex flex-wrap gap-4">
                          {message.quoteAmount && (
                            <div>
                              <p className="text-xs text-text-secondary">Project Total</p>
                              <p className="text-xl font-bold text-green-400">
                                ${Number(message.quoteAmount).toLocaleString()}
                              </p>
                            </div>
                          )}
                          {message.quoteMonthly && (
                            <div>
                              <p className="text-xs text-text-secondary">Monthly</p>
                              <p className="text-xl font-bold text-blue-400">
                                ${Number(message.quoteMonthly).toLocaleString()}/mo
                              </p>
                            </div>
                          )}
                        </div>
                        {message.quoteValidDays && (
                          <p className="text-xs text-text-secondary mt-2">
                            Valid for {message.quoteValidDays} days
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-text-primary text-sm whitespace-pre-wrap">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Messages Yet */}
          {inquiry.messages.length === 0 && (
            <div className="bg-surface border border-border rounded-xl p-6 md:p-8 mb-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">Your Inquiry is Being Reviewed</h3>
              <p className="text-text-secondary text-sm max-w-md mx-auto">
                Our team is reviewing your project requirements. You'll receive an email and see updates here once we respond.
              </p>
            </div>
          )}

          {/* Project Details */}
          <div className="bg-surface border border-border rounded-xl p-6 md:p-8 mb-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Project Details</h2>

            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Name</p>
                  <p className="text-text-primary font-medium">{inquiry.name}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Email</p>
                  <p className="text-text-primary font-medium">{inquiry.email}</p>
                </div>
                {inquiry.phone && (
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Phone</p>
                    <p className="text-text-primary font-medium">{inquiry.phone}</p>
                  </div>
                )}
                {inquiry.company && (
                  <div>
                    <p className="text-text-secondary text-sm mb-1">Company</p>
                    <p className="text-text-primary font-medium">{inquiry.company}</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6">
                {/* Project Name */}
                {projectDetails?.projectName && (
                  <div className="mb-4">
                    <p className="text-text-secondary text-sm mb-1">Project Name</p>
                    <p className="text-text-primary font-medium">{projectDetails.projectName}</p>
                  </div>
                )}

                {/* Services */}
                {projectDetails?.services && projectDetails.services.length > 0 && (
                  <div className="mb-4">
                    <p className="text-text-secondary text-sm mb-2">Services Requested</p>
                    <div className="flex flex-wrap gap-2">
                      {projectDetails.services.map((service) => (
                        <span
                          key={service}
                          className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                        >
                          {serviceDetailLabels[service] || service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget & Timeline */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {inquiry.budget && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Budget Range</p>
                      <p className="text-text-primary font-medium">{inquiry.budget}</p>
                    </div>
                  )}
                  {inquiry.timeline && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Timeline</p>
                      <p className="text-text-primary font-medium">{inquiry.timeline}</p>
                    </div>
                  )}
                </div>

                {/* Features */}
                {projectDetails?.features && projectDetails.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-text-secondary text-sm mb-2">Features Needed</p>
                    <div className="flex flex-wrap gap-2">
                      {projectDetails.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 bg-surface-elevated border border-border rounded-full text-sm text-text-primary"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Details Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {projectDetails?.targetAudience && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Target Audience</p>
                      <p className="text-text-primary text-sm">{projectDetails.targetAudience}</p>
                    </div>
                  )}
                  {projectDetails?.pages && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Estimated Pages</p>
                      <p className="text-text-primary text-sm">{projectDetails.pages}</p>
                    </div>
                  )}
                  {projectDetails?.screens && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Estimated Screens</p>
                      <p className="text-text-primary text-sm">{projectDetails.screens}</p>
                    </div>
                  )}
                  {projectDetails?.hasDesign && (
                    <div>
                      <p className="text-text-secondary text-sm mb-1">Design Status</p>
                      <p className="text-text-primary text-sm">{projectDetails.hasDesign}</p>
                    </div>
                  )}
                </div>

                {/* Text Fields */}
                {projectDetails?.designNotes && (
                  <div className="mt-4">
                    <p className="text-text-secondary text-sm mb-1">Design Notes</p>
                    <p className="text-text-primary text-sm">{projectDetails.designNotes}</p>
                  </div>
                )}
                {projectDetails?.referenceUrls && (
                  <div className="mt-4">
                    <p className="text-text-secondary text-sm mb-1">Reference URLs</p>
                    <p className="text-text-primary text-sm">{projectDetails.referenceUrls}</p>
                  </div>
                )}
                {projectDetails?.integrations && (
                  <div className="mt-4">
                    <p className="text-text-secondary text-sm mb-1">Integrations</p>
                    <p className="text-text-primary text-sm">{projectDetails.integrations}</p>
                  </div>
                )}
                {projectDetails?.existingSystem && (
                  <div className="mt-4">
                    <p className="text-text-secondary text-sm mb-1">Existing System</p>
                    <p className="text-text-primary text-sm">{projectDetails.existingSystem}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-border pt-6">
                <p className="text-text-secondary text-sm mb-2">Project Description</p>
                <p className="text-text-primary text-sm whitespace-pre-wrap">{inquiry.description}</p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-surface-elevated border border-border rounded-xl p-6 text-center">
            <p className="text-text-secondary text-sm mb-3">
              Have questions about your inquiry?
            </p>
            <a
              href="mailto:contact@47industries.com"
              className="inline-flex items-center gap-2 text-accent hover:underline text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contact@47industries.com
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return {
    title: `Inquiry ${id} - 47 Industries`,
    description: 'Track your project inquiry status and view responses from the 47 Industries team.',
  }
}
