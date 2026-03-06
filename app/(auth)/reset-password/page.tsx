import { redirect } from 'next/navigation'

/**
 * Clerk handles password reset via its built-in UI.
 */
export default function ResetPasswordPage() {
  redirect('/sign-in')
}
