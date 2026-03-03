"use client"

import { useState, FormEvent, Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const inp = { width: "100%", padding: "12px 16px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" as const, color: "#000000", backgroundColor: "#ffffff", WebkitTextFillColor: "#000000", opacity: 1 }

function ForgotForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClient()

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/callback?next=/reset-password",
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#1E3A5F", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "20px" }}>Z</span>
            </div>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#1e293b" }}>ZoneWise.AI</span>
          </Link>
        </div>
        <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
              <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e293b", marginBottom: "12px" }}>Check your email</h1>
              <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
                We sent a reset link to <strong>{email}</strong>. Click it to set a new password.
              </p>
              <Link href="/login" style={{ color: "#1E3A5F", fontSize: "14px", textDecoration: "none", fontWeight: "500" }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", textAlign: "center", marginBottom: "8px", color: "#1e293b" }}>Reset your password</h1>
              <p style={{ textAlign: "center", color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
                Enter your email and we will send a reset link.
              </p>
              {error && <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "12px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px" }}>{error}</div>}
              <form onSubmit={onSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="re" style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px", color: "#1e293b" }}>Email</label>
                  <input id="re" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} placeholder="you@example.com" autoComplete="email" required />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", backgroundColor: "#1E3A5F", color: "white", fontWeight: "500", borderRadius: "8px", border: "none", fontSize: "16px", cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p style={{ textAlign: "center", fontSize: "14px", color: "#64748b", marginTop: "24px" }}>
                Remember your password?{" "}
                <Link href="/login" style={{ color: "#1E3A5F", textDecoration: "none", fontWeight: "500" }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}>
      <ForgotForm />
    </Suspense>
  )
}
