import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-teal-600 hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold mt-6 mb-8">Privacy Policy</h1>
        <div className="prose prose-slate">
          <p className="text-gray-600">Last updated: January 27, 2026</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>
          <p>We collect information you provide directly: email address, name (if provided), and payment information (processed securely by Stripe).</p>
          <p>We automatically collect: usage data, queries submitted, and standard web analytics.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and improve our service</li>
            <li>To process payments</li>
            <li>To communicate with you about your account</li>
            <li>To improve our AI responses</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Data Storage</h2>
          <p>Your data is stored securely using Supabase (PostgreSQL) with encryption at rest. Payment data is handled by Stripe and never stored on our servers.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Supabase (authentication, database)</li>
            <li>Stripe (payment processing)</li>
            <li>Anthropic (AI processing)</li>
            <li>Cloudflare (hosting, CDN)</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data by contacting privacy@zonewise.ai</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Contact</h2>
          <p>Privacy inquiries: privacy@zonewise.ai</p>
        </div>
        <p className="mt-12 text-sm text-gray-500">© 2026 ZoneWise.AI 2026. All rights reserved.</p>
      </div>
    </div>
  )
}
