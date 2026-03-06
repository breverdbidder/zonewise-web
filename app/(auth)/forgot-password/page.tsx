import { redirect } from 'next/navigation'

/**
 * Clerk handles password reset via its built-in UI.
 * Redirect to sign-in where users can use "Forgot password?" link.
 */
export default function ForgotPasswordPage() {
  redirect('/sign-in')
}
