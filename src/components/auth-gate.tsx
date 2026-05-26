import React from 'react';

import { AuthRedirect } from '@/components/auth-redirect';
import { useAuth } from '@/contexts/auth-context';

type Props = {
  children: React.ReactNode;
};

/**
 * До завершения bootstrap не рендерим маршруты — нет мигания login.
 * Splash скрывается в root _layout когда isReady.
 */
export function AuthGate({ children }: Props) {
  const { isReady, isSignedIn } = useAuth();

  if (!isReady) {
    return <AuthRedirect isReady={false} isSignedIn={false} />;
  }

  return (
    <>
      <AuthRedirect isReady={isReady} isSignedIn={isSignedIn} />
      {children}
    </>
  );
}
