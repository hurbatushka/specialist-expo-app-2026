/**
 * Базовый URL API (см. docs/MOBILE_API.md).
 * По умолчанию — прод: https://app.blagodeti.by/api
 * Для локальной разработки задайте EXPO_PUBLIC_API_URL=http://localhost:3000/api в .env
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'https://app.blagodeti.by/api';
