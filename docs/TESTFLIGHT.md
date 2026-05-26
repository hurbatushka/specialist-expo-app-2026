# TestFlight (iOS) — специалисты

- **EAS:** `@hurbatushka/blagodeti-specialist`
- **Bundle ID:** `com.blagodeti.app` (= App Store Connect **6757393518**, «БлагоДети: Специалисты!»)
- **Клиентское приложение:** `by.blagodeti.app` → ASC **6752854525** (другое приложение)
- **Репо:** https://github.com/hurbatushka/specialist-expo-app-2026

## Сборка и submit

```bash
cd specialist-expo-app-2026
npm run build:ios:submit
```

`ascAppId` задан в `eas.json` → `6757393518`.

После смены bundle нужна **новая** сборка (старый IPA с `by.blagodeti.specialist` в ASC не залить).
