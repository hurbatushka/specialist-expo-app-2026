import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';

/** Стартовая точка: login если гость; для сессии — AuthRedirect → HOME_ROUTE. */
export default function AppIndex() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  return null;
}
