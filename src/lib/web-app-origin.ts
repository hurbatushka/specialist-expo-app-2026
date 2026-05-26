import { API_BASE_URL } from '@/constants/api';

/** Базовый URL веб-приложения (без /api) — те же страницы, что и в браузере. */
export function getWebAppOrigin(): string {
  return API_BASE_URL.replace(/\/api\/?$/, '');
}
