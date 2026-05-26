import { Redirect, Slot } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';

export default function TabsLayout() {
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
