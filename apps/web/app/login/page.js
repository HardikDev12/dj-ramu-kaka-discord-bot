import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Login',
  description: 'Sign in to manage playlists',
};

/** Same cookie name as apps/api cookieSession (`mbs_session`). */
const SESSION_COOKIE = 'mbs_session';

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/70">
      Loading login...
    </div>
  );
}

export default function LoginPage() {
  const session = cookies().get(SESSION_COOKIE);
  if (session?.value) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
