# TestFlight (iOS) — специалисты

Проект: `@hurbatushka/blagodeti-specialist` · bundle `by.blagodeti.specialist` · ASC app id `6757393518`.

Репозиторий: https://github.com/hurbatushka/specialist-expo-app-2026

## Перед сборкой

1. **Хуки React:** `npm run lint:hooks` — уже в `npm run build:ios*`.
2. **Lockfile:** после правок `package.json`:
   ```bash
   bun install
   git add bun.lock && git commit -m "chore: sync bun.lock"
   ```
3. Версия: `app.json` → `expo.version` (сейчас **1.0.0**), buildNumber — `autoIncrement` в `eas.json`.
4. API: `EXPO_PUBLIC_API_URL` в `eas.json` → `production.env`.
5. `eas login` (аккаунт **hurbatushka**).
6. На [expo.dev](https://expo.dev/accounts/hurbatushka/projects/blagodeti-specialist) → **GitHub** должен быть подключён репозиторий `specialist-expo-app-2026` (не monorepo CRM).

## Сборка

```bash
bun install
npm run build:ios          # production → App Store
# или internal TestFlight:
bunx eas-cli build --profile testflight --platform ios
```

С submit:

```bash
npm run build:ios:submit
```

## EAS из корня репо

Все команды запускать из **корня этого репозитория** (не из `blagodeti-crm-app`).
