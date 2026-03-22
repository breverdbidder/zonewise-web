import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-[#1E3A5F] hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold mt-6 mb-8 text-slate-900">Terms of Service</h1>
        <div className="prose prose-slate prose-gray">
          <p className="text-gray-700">Last updated: January 27, 2026</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">1. Acceptance of Terms</h2>
          <p>By accessing ZoneWise.AI, you agree to be bound by these Terms of Service.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">2. Description of Service</h2>
          <p>ZoneWise.AI provides AI-powered real estate intelligence across all 67 Florida counties. The service is intended for informational purposes only.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">3. Disclaimer of Warranties</h2>
          <p><strong>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.</strong> We do not guarantee the accuracy, completeness, or timeliness of any information provided. Zoning regulations change frequently, and our data may not reflect the most current regulations.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">4. Limitation of Liability</h2>
          <p>ZoneWise.AI shall not be liable for any damages arising from the use of this service, including but not limited to direct, indirect, incidental, or consequential damages.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">5. Not Legal Advice</h2>
          <p>Information provided by ZoneWise.AI does not constitute legal, professional, or development advice. Always consult with qualified professionals and verify information with the appropriate municipal Planning Department before making any development decisions.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">6. User Responsibilities</h2>
          <p>Users are responsible for independently verifying all zoning information with official sources before relying on it for any purpose.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">7. Subscription and Billing</h2>
          <p>Paid subscriptions are billed monthly or annually. Refunds are not provided for partial months. You may cancel at any time.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">8. Contact</h2>
          <p>Questions about these Terms should be sent to: legal@zonewise.ai</p>
        </div>
        <p className="mt-12 text-sm text-gray-500">© 2026 ZoneWise.AI. All rights reserved.</p>
      </div>
    </div>
  )
}
