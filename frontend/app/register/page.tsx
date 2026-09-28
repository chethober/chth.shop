import { redirect } from 'next/navigation'

/** Accounts are created on first sign-in, so registration is the sign-in page. */
export default function RegisterPage() {
  redirect('/auth')
}
