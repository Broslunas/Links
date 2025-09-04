import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/auth-simple';
import SignInForm from '../../../components/auth/SignInForm';
import SignInPageClient from './SignInPageClient';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return <SignInPageClient />
}
