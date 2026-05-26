# TestFlight (iOS)

Проект: `@hurbatushka/blagodeti` · bundle `by.blagodeti.app` · ASC app id `6752854525` («БлагоДети: Всегда рядом!»).

## Перед сборкой

1. **Хуки React:** `npm run lint:hooks` — ловит `useState` после `return` (краш после логина). Уже в `npm run build:ios*`.
2. **Lockfile:** EAS ставит зависимости через `bun install --frozen-lockfile`. После правок `package.json` обязательно:
   ```bash
   bun install
   git add bun.lock
   git commit -m "chore: sync bun.lock"
   ```
3. Версия в `app.json` → `expo.version` (сейчас **2.0.0**). Берётся из репо (`appVersionSource: local`). Номер билда EAS увеличит сам (`autoIncrement: buildNumber`).
4. API в билде: `EXPO_PUBLIC_API_URL` задан в `eas.json` → `production.env` (prod: `https://app.blagodeti.by/api`).
5. Аккаунт Expo: `eas login` (у вас: **hurbatushka**).
6. Сертификаты/профили: в `eas.json` → `credentialsSource: "remote"` (хранятся на Expo).

## Сборка + TestFlight (одной командой)

```bash
cd "MOBILE APP/client-expo-app"
npm install
npm run build:ios:submit
```

Или по шагам:

```bash
npm run build:ios          # ждём IPA на expo.dev (~10–15 мин)
npm run submit:ios         # заливка последнего билда в App Store Connect
```

Только сборка без автозаливки:

```bash
npm run build:ios
```

## После submit

1. [App Store Connect](https://appstoreconnect.apple.com) → приложение → **TestFlight**.
2. Билд в статусе «Processing» (5–30 мин), затем **Missing Compliance** — ответьте на вопрос про шифрование (у нас в `Info.plist` уже `ITSAppUsesNonExemptEncryption: false` → обычно «No»).
3. Добавьте тестировщиков (Internal / External group) → билд станет доступен в TestFlight.

## Полезные команды

```bash
npx eas build:list --platform ios --limit 5
npx eas submit --profile production --platform ios --id <BUILD_ID>
npx eas build:view
```

## Если сборка падает

- **`lockfile had changes, but lockfile is frozen`** — выполните `bun install`, закоммитьте `bun.lock`, перезапустите `npm run build:ios`.
- Логи: ссылка из `eas build:list` или expo.dev → Builds.
- После апгрейда Expo 54 → 55 первый билд может потребовать обновить credentials: `eas credentials -p ios`.
- WebRTC: нативный модуль уже в `plugins` — только **production** / **development** build, не Expo Go.

## Локальная проверка перед облачным билдом

```bash
npx expo run:ios --configuration Release
```
