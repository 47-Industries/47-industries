import { redirect } from 'next/navigation'

// Redirect to consolidated inquiry form
export default function StartProjectPage() {
  redirect('/services/inquiry')
}

export const metadata = {
  title: 'Start Your Project - 47 Industries',
  description: 'Tell us about your web development, app development, or AI project and get a custom proposal.',
}
