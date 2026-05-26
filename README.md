# БлагоДети — приложение специалиста

Expo (SDK 55), отдельный репозиторий. Backend: [blagodeti-crm-app](https://github.com/hurbatushka/blagodeti-crm-app).

- **EAS:** `@hurbatushka/blagodeti-specialist` (`e655c07a-66cc-4a69-8f77-d3555dacfe64`)
- **iOS bundle:** `by.blagodeti.specialist`

## Локально

```bash
cp .env.example .env
bun install   # или npm install
bun run start
```

## Сборка iOS (TestFlight / Store)

```bash
bun run build:ios
# или с отправкой в ASC:
bun run build:ios:submit
```

Профили в `eas.json`: `testflight`, `production`.

## Связь с CRM

В `.env`: `EXPO_PUBLIC_API_URL=https://app.blagodeti.by/api`
