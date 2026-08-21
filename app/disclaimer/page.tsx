import Link from 'next/link'

// Without this the page inherited the root layout's marketing title, which
// made the 2026-08-20 audit read /disclaimer as "serving the homepage".
export const metadata = {
  title: 'Zoning Information Disclaimer | ZoneWise.AI',
  description: 'Data sources, accuracy limits, and appropriate use of ZoneWise.AI zoning information.',
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-[#1E3A5F] hover:underline">← Back to home</Link>
        <h1 className="text-3xl font-bold mt-6 mb-8 text-slate-900">Zoning Information Disclaimer</h1>
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-bold text-amber-800 mb-4">⚠️ Important Notice</h2>
          <p className="text-amber-900 font-medium">
            The information provided by ZoneWise.AI is for <strong>GENERAL GUIDANCE ONLY</strong> and should NOT be relied upon as legal advice or as a substitute for official zoning determinations.
          </p>
        </div>
        
        <div className="prose prose-slate prose-gray">
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">No Guarantee of Accuracy</h2>
          <p>While we strive to provide accurate zoning information, we cannot guarantee that all data is current, complete, or error-free. Zoning codes and regulations change frequently, and there may be delays in updating our database.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">Not Legal or Professional Advice</h2>
          <p>ZoneWise.AI does not provide legal, architectural, engineering, or other professional advice. The information presented should not be used as the sole basis for any development, construction, or investment decision.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">Always Verify with Official Sources</h2>
          <p><strong>You MUST verify all zoning information with the appropriate local Planning Department before making any decisions.</strong> Contact your county or municipal planning office for official guidance.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">Limitation of Liability</h2>
          <p>Under no circumstances shall ZoneWise.AI, ZoneWise.AI 2026, or their affiliates be liable for any damages whatsoever arising from the use of information provided by this service.</p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-slate-800">User Acknowledgment</h2>
          <p>By using ZoneWise.AI, you acknowledge and agree that:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Information is for informational purposes only</li>
            <li>You will independently verify all information</li>
            <li>You will not hold us liable for any decisions made based on our information</li>
            <li>You understand zoning interpretations may vary</li>
          </ul>
        </div>
        <p className="mt-12 text-sm text-gray-500">© 2026 ZoneWise.AI 2026. All rights reserved.</p>
      </div>
    </div>
  )
}
