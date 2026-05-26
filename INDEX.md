# Индекс проекта: client-expo-app

Стартовый **Expo SDK 55** с **Liquid Glass** на iOS (нативные табы через `expo-router/unstable-native-tabs` + `expo-glass-effect`).

---

## Стек

| Пакет | Версия | Назначение |
|-------|--------|------------|
| expo | ~55.0.2 | Ядро |
| expo-router | ~55.0.2 | File-based routing, нативные табы (Liquid Glass на iOS) |
| expo-glass-effect | ~55.0.7 | Эффект стекла для табов на iOS |
| expo-symbols | ~55.0.4 | SF Symbols на iOS |
| react-native-reanimated | 4.2.1 | Анимации (сплэш, коллапсибл) |
| react-native-worklets | 0.7.2 | Worklets для анимаций |
| react-native-gesture-handler | ~2.30.0 | Жесты |
| react-native-safe-area-context | ~5.6.2 | Safe area |
| react-native-screens | ~4.23.0 | Нативные экраны |
| expo-image | ~55.0.5 | Оптимизированные изображения |

**Пакетный менеджер:** bun (есть `bun.lock`).

---

## Структура

```
client-expo-app/
├── app.json                 # Конфиг Expo (scheme: clientexpoapp, experiments: typedRoutes, reactCompiler)
├── package.json
├── tsconfig.json            # paths: @/* → ./src/*, @/assets/* → ./assets/*
├── src/
│   ├── app/                 # Expo Router (file-based)
│   │   ├── _layout.tsx      # Корень: ThemeProvider + AnimatedSplashOverlay + AppTabs
│   │   ├── index.tsx        # Таб "Home"
│   │   └── explore.tsx      # Таб "Explore"
│   ├── components/
│   │   ├── app-tabs.tsx     # Нативные табы (NativeTabs) — iOS/Android
│   │   ├── app-tabs.web.tsx # Веб-табы (expo-router/ui Tabs)
│   │   ├── animated-icon.tsx    # AnimatedSplashOverlay + AnimatedIcon (Reanimated Keyframe)
│   │   ├── themed-view.tsx
│   │   ├── themed-text.tsx
│   │   ├── hint-row.tsx
│   │   ├── external-link.tsx
│   │   ├── web-badge.tsx
│   │   └── ui/
│   │       └── collapsible.tsx  # Анимированный коллапс (Reanimated)
│   ├── constants/
│   │   └── theme.ts         # Colors, Fonts, Spacing, BottomTabInset, MaxContentWidth
│   ├── hooks/
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme.ts     # useColorScheme → Colors[theme]
│   └── global.css
├── assets/
│   └── expo.icon/           # Кастомная иконка (icon.json + SVG)
├── scripts/
│   └── reset-project.js
└── .vscode/
    └── settings.json, extensions.json
```

**Примечание:** В `app.json` указаны `./assets/images/` (icon, splash, favicon, tabIcons, tutorial-web.png, react-logo.png, logo-glow.png, expo-logo.png). В репозитории видны только `assets/expo.icon/` — остальные картинки могут быть в .gitignore или добавляться отдельно.

---

## Роутинг и табы

- **Layout:** `_layout.tsx` — провайдер темы (dark/light), сплэш-оверлей, затем `<AppTabs />`.
- **Табы:**  
  - **Нативно (iOS/Android):** `app-tabs.tsx` → `expo-router/unstable-native-tabs` (NativeTabs). На iOS даёт Liquid Glass; цвета из `theme.ts` (background, backgroundElement, text).  
  - **Веб:** `app-tabs.web.tsx` → `expo-router/ui` (Tabs, TabList, TabTrigger), кастомный список табов.
- **Экраны:** `index` (Home), `explore` (Explore). Иконки табов: `@/assets/images/tabIcons/home.png`, `explore.png`.

---

## Тема и UI

- **Тема:** `src/constants/theme.ts` — `Colors` (light/dark), `Fonts` (Platform: ios/default/web), `Spacing`, `BottomTabInset` (iOS: 50, Android: 80), `MaxContentWidth: 800`.
- **Компоненты:** `ThemedView`, `ThemedText` завязаны на `useTheme()` / `useColorScheme()`.
- **Шрифты (web):** в theme указаны CSS-переменные `--font-display`, `--font-serif`, `--font-rounded`, `--font-mono`; подключаются через `global.css`.

---

## Ключевые точки входа

| Что | Где |
|-----|-----|
| Точка входа приложения | `expo-router/entry` (package.json main) |
| Корневой layout | `src/app/_layout.tsx` |
| Домашний экран | `src/app/index.tsx` |
| Второй таб | `src/app/explore.tsx` |
| Выбор табов (native vs web) | Импорт `@/components/app-tabs` — на вебе подставляется `.web.tsx` |

---

## Скрипты

- `bun start` / `expo start` — запуск.
- `expo start --ios` / `--android` / `--web`.
- `expo lint` — линт.
- `npm run reset-project` — сброс до стартового шаблона.

---

## Liquid Glass (iOS)

- В коде **нет** прямого импорта `expo-glass-effect`.
- Эффект включается через **expo-router**: нативный таб-бар на iOS использует стекло (Liquid Glass).
- Зависимость `expo-glass-effect` указана в `package.json` и тянется как зависимость `expo-router` — для работы нативных табов на iPhone достаточно текущей конфигурации.

---

*Индекс собран для быстрой навигации по проекту.*
