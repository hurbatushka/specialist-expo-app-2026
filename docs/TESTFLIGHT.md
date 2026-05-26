# TestFlight (iOS) — специалисты

- **EAS:** `@hurbatushka/blagodeti-specialist`
- **Bundle ID (IPA):** `by.blagodeti.specialist` — в `app.json`, менять нельзя под существующий ASC
- **Репо:** https://github.com/hurbatushka/specialist-expo-app-2026

## App Store Connect

В ASC должно быть **отдельное** iOS-приложение с bundle **`by.blagodeti.specialist`**.

Запись **6757393518** («БлагоДети: Специалисты!») привязана к **`com.blagodeti.app`** — это **не** наш IPA, submit туда не пройдёт (ошибка 90055).

После создания приложения в [App Store Connect](https://appstoreconnect.apple.com) → Apps → + → bundle `by.blagodeti.specialist` — возьмите **Apple ID** (число в URL приложения) и добавьте в `eas.json`:

```json
"submit": {
  "production": {
    "ios": { "ascAppId": "НОВЫЙ_ID" }
  }
}
```

Без `ascAppId` EAS ищет приложение по bundle id автоматически (если оно уже есть в ASC).

| Приложение в ASC | Bundle | ascAppId |
|------------------|--------|----------|
| БлагоДети: Всегда рядом! (клиенты) | `by.blagodeti.app` | `6752854525` |
| Специалисты (нужно создать) | `by.blagodeti.specialist` | *новый* |
| Старое «Специалисты» | `com.blagodeti.app` | `6757393518` — **не использовать** |

## Сборка и submit

Только из корня **specialist-expo-app-2026**:

```bash
npm run build:ios
npm run submit:ios
# или одной командой:
npm run build:ios:submit
```

Сборка из `blagodeti-crm-app/MOBILE APP/...` ломается — см. `npm run verify:eas-root`.
