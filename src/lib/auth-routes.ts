/** Главная (табы) после входа. */
export const HOME_ROUTE = '/(tabs)/(main)';

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/forgot-password',
  '/verify-reset-code',
  '/reset-password',
  '/first-steps',
] as const;

const AUTH_ONLY_PREFIXES = [
  '/login',
  '/forgot-password',
  '/verify-reset-code',
  '/reset-password',
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );
}

/** Экраны, с которых залогиненного уводим на главную. */
export function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return !isPublicRoute(pathname);
}
