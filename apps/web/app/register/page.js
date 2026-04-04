import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Register',
  description: 'Create an account for web playlists',
};

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

function RegisterFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/70">
      Loading register...
    </div>
  );
}

export default function RegisterPage() {
  const session = cookies().get(SESSION_COOKIE);
  if (session?.value) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
