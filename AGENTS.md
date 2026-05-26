# MOBILE APP (specialist-expo-app) — правила для агента

Приложение специалиста: bundle `by.blagodeti.specialist`, API-префикс `/api/specialist/*`, логин `POST /api/auth/specialist/login` (не client).

## React Hooks (обязательно)

**Все хуки (`useState`, `useEffect`, `useMemo`, …) — только до любого `return` в компоненте.**

Запрещено (краш в production, fatal в RN):

```tsx
// BAD
if (isSignedIn) return <Redirect href="/" />;
const [x, setX] = useState('');
```

Правильно:

```tsx
// GOOD
const [x, setX] = useState('');
if (isSignedIn) return <Redirect href="/" />;
```

Редирект по сессии для auth-экранов дублирует `AuthRedirect` в `_layout` — в `login.tsx` достаточно хуков + `Redirect` в конце.

Перед iOS-сборкой: `npm run lint:hooks` (входит в `build:ios` / `build:ios:submit`).

## Навигация «назад» (обязательно)

Любой экран, на который пользователь **уходит с другого экрана** (не корень таба, не первый шаг онбординга), должен поддерживать:

1. **Свайп с края экрана** (iOS) / жест «назад» (Android) — через `Stack` из `expo-router` с `gestureEnabled: true` (на iOS ещё `fullScreenGestureEnabled: true` где уместно).
2. **Кнопку «назад»** в хедере — `StackHeader` из `@/components/glass-header`, не рисовать свою стрелку на каждом экране вручную.

## Liquid Glass (iOS 26+)

Официальный пакет: **`expo-glass-effect`** (уже в проекте). Документация: [expo.dev/sdk/glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect).

Перед `GlassView` / `GlassContainer` на iOS:

```ts
import {
  GlassView,
  GlassContainer,
  isLiquidGlassAvailable,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';

const ok =
  Platform.OS === 'ios' &&
  isLiquidGlassAvailable() &&
  isGlassEffectAPIAvailable();
```

- **`GlassView`** — таблетки кнопок, `glassEffectStyle="regular" | "clear"`, `isInteractive`, `colorScheme` (`light` | `dark` | `auto`) из темы приложения.
- **`GlassContainer`** + `spacing` — соседние glass-элементы «сливаются» (как в iOS 26).
- Хедер стека: один **`StackHeader`** — liquid glass на поддерживаемых устройствах, матовые таблетки на Android / старом iOS.
- Не проверять версию OS вручную (`Platform.Version >= 26`) — только `isLiquidGlassAvailable()` + `isGlassEffectAPIAvailable()`.

### Как устроено в проекте

| Зона | Layout | Хедер |
|------|--------|--------|
| Корень приложения | `src/app/_layout.tsx` → **`Slot`** (не `Stack` — иначе prevent remove context) | — |
| Табы | `src/app/(tabs)/_layout.tsx` → **`Slot`** | — |
| Комната WebRTC | `src/app/room/_layout.tsx` → `Stack` | скрыт |
| Разделы `/menu/*` | `src/app/(tabs)/(main)/menu/_layout.tsx` → **`Slot`** + `NavigationChrome` | liquid glass; свайп — `EdgeBackSwipe` |
| Вход / регистрация | `src/app/(auth)/_layout.tsx` → `Stack` | свой UI на экранах + жест назад |
| Комната WebRTC | `room/[slug]` в корневом Stack | свой UI |

### Новый экран в `/menu`

1. Файл в `src/app/(tabs)/(main)/menu/<name>.tsx` (стек **внутри** таба `menu`, не соседом `(main)`).
2. Добавить заголовок в `src/constants/navigation.ts` → `MENU_STACK_TITLES`.
3. Добавить заголовок в `MENU_STACK_TITLES` (`navigation.ts`) — подхватится в `getMenuScreenTitle`.
4. **Не** дублировать `paddingTop: insets.top` — верхний safe area даёт хедер стека.
5. Переход: `router.push('/menu/<name>')`, не `replace`, если нужна история «назад».

### Исключения (без кнопки «назад»)

- Корневые табы: `/`, `/schedule`, `/clients`, `/menu` (вкладка).
- Онбординг `first-steps` (завершение — только вперёд).
- `login` как точка входа (ссылки «назад» на register/forgot — отдельно).

### Антипаттерны

- **`Stack` в `menu/_layout` под Expo Go / SDK 55** — `prevent remove context` (даже внутри Tabs). Используй **`Slot` + `NavigationChrome` + `EdgeBackSwipe`**.
- `router.replace` вместо `push` на вложенные menu-экраны — не будет `canGoBack()`.
- Только `router.back()` в контенте без Stack — свайп не появится.
- `headerShown: false` на вложенном стеке без своего хедера с «назад».

## UI

- Модалки: `@/components/ui/Modal`.
- Тема: `@/constants/theme`, `useTheme`.
- Иконки: `@expo/vector-icons` / lucide по месту.

## API

- Запросы с сессией: `fetchWithAuth` из `@/lib/api`.
- Не хранить секреты в `EXPO_PUBLIC_*`.
