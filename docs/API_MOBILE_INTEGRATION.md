# API и подключение мобильного приложения (БлагоДети CRM)

## Базовый URL

- **Production:** `https://<ваш-домен>/api`
- **Development:** `http://localhost:3000/api`

Все пути ниже указаны относительно этого базового URL.

---

## Поведение сессии в мобильном приложении

- **Вход выполняется один раз и запоминается** — приложение хранит токены (access + refresh) в защищённом хранилище и при каждом запуске считает пользователя авторизованным, пока токены валидны.
- **Явного «Выйти» в приложении нет** — сессия сохраняется между запусками.
- **При блокировке аккаунта или отсутствии аккаунта** сервер возвращает **403** (заблокирован) или **401** (нет сессии / аккаунт удалён). В этих случаях приложение должно **сбрасывать сохранённые токены и выкидывать пользователя на экран входа** (логин).

Итого: один вход → постоянная сессия; 401/403 → очистить токены и показать экран входа.

---

## Сохранение устройства и IP при входе

При каждом входе (в т.ч. из мобильного приложения) сервер **всегда сохраняет**:

- **IP-адрес** — из заголовков запроса (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`).
- **User-Agent** — строка клиента из заголовка `User-Agent`.
- **Устройство** — запись в таблице `Device`: привязка к пользователю по отпечатку устройства (fingerprint), название, ОС, платформа, браузер. По одному устройству на пару (userId, deviceFingerprint); при повторном входе с того же устройства обновляются `lastUsedAt`, IP и User-Agent.

Это нужно для раздела «Мои устройства» в веб-кабинете и для безопасности (блокировка устройства, просмотр активных сессий).

**Что делать мобильному приложению:**

1. **Обязательно:** отправлять при логине (и при любых запросах) осмысленный заголовок **User-Agent**, например:  
   `BlagodetiApp/1.0 (iOS 17.0)` или `BlagodetiApp/1.0 (Android 14)`.  
   Иначе в «Мои устройства» будет отображаться общий клиент (okhttp, CFNetwork и т.п.).

2. **Опционально:** в теле **POST /auth/login** передавать объект **device** — тогда в карточке устройства сохранятся удобные для отображения данные:
   - `device.deviceFingerprint` — стабильный ID устройства (один и тот же при каждом входе с этого телефона), например из `expo-device` / нативного API. Если не передать, fingerprint будет посчитан на сервере из User-Agent и заголовков.
   - `device.deviceName` — название, например «iPhone 15» или «Samsung Galaxy A54».
   - `device.os` — «iOS», «Android».
   - `device.platform` — «Mobile», «Tablet».
   - `device.browser` — «BlagodetiApp».

Пример тела запроса при логине с передачей устройства:

```json
{
  "emailOrPhone": "+375291234567",
  "password": "***",
  "device": {
    "deviceFingerprint": "uuid-или-другой-стабильный-id",
    "deviceName": "iPhone 15",
    "os": "iOS",
    "platform": "Mobile",
    "browser": "BlagodetiApp"
  }
}
```

На бэкенде при создании сессии вызывается `createSession(userId, deviceInfo)` — IP и User-Agent всегда берутся из запроса, поля из `device` подставляются в запись устройства при наличии.

---

## Текущая авторизация (веб)

Сейчас авторизация в CRM работает **только через cookies**:

- При логине (Server Action на веб-сайте) выставляются `accessToken` и `refreshToken` в httpOnly-cookies.
- Все API-маршруты, требующие авторизации, читают сессию из этих cookies (`getServerSession()`).

**Для мобильного приложения** cookies неудобны: нужна **token-based авторизация**. Её нужно добавить (см. раздел «Что добавить для мобильного приложения»).

---

## Список API-маршрутов

### Публичные (без авторизации)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/web/services` | Список услуг. Query: `?category=subscriptions\|single\|additional`. |
| GET | `/web/services/categories` | Категории услуг (subscriptions, single, additional) и списки услуг. |
| GET | `/web/services/[slug]` | Услуга по slug (id). |
| GET | `/web/specialists` | Список специалистов (slug, name, position, image). |
| GET | `/web/specialists/[slug]` | Специалист по slug. |
| GET | `/web/prices` | Цены: `{ subscriptions, single, additional }` — массивы услуг с полями id, name, durationMinutes, price, description, iconKey, popular. |

### Авторизация (cookies; для мобильного потребуются доп. маршруты)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/auth/check` | Проверка сессии. **200** — авторизован и не заблокирован. **401** — нет сессии. **403** — аккаунт заблокирован (`error: "Blocked"`, `message: "Аккаунт заблокирован"`). |
| POST | `/auth/refresh` | Обновление токенов. Читает `refreshToken` из cookie, отдаёт новые cookies. Тело ответа: `{ success: true, expiresAt }`. |
| POST | `/auth/logout` | Выход: отзыв сессии по cookie, удаление cookies. Ответ: `{ success: true }`. В мобильном при «выкидывании» можно не вызывать, достаточно очистить локальные токены. |

**Важно:** сейчас `/auth/check` и `/auth/refresh` работают **только с cookies**. Мобильному приложению нужны отдельные эндпоинты или доработка этих (см. ниже).

### С авторизацией (сессия из cookies)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/auth/devices` | Список устройств пользователя (deviceName, browser, os, platform, ipAddress, isTrusted, isBlocked, lastUsedAt, isCurrentDevice). |
| DELETE | `/auth/devices?deviceId=...` | Удалить устройство. |
| PATCH | `/auth/devices` | Body: `{ deviceId, action: "block" \| "unblock" }`. |
| GET | `/realtime/stream` | SSE-стрим для реалтайм обновлений расписания. Только роли ADMIN, MANAGER, SPECIALIST. Для клиентского приложения не используется. |

### Служебные / внутренние

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/cron/send-daily-confirmation-requests` | Крон: рассылка напоминаний о подтверждении занятий. Заголовок: `Authorization: Bearer <CRON_SECRET>` или `x-cron-secret: <CRON_SECRET>`. |
| POST | `/mail/send` | Отправка письма (внутренний). |
| GET | `/mail/test` | Тест почты. |
| GET/POST | `/admin/service-images` | Работа с изображениями услуг (админ). |

---

## Данные клиента (личный кабинет)

Сейчас **все данные личного кабинета клиента** отдаются не через REST API, а через **Next.js Server Actions** в `lib/actions/client-cabinet.ts` (и смежные модули). Примеры действий:

- `getAlfaCustomerForCurrentUser` — баланс (уроки, деньги, бонусы)
- `getUpcomingLessonsForCurrentClient` — предстоящие занятия
- `getSchedulePageDataForClient` — данные для страницы расписания
- `getPastLessonsForClient` — прошедшие занятия
- `getLessonForClientCabinet` — карточка занятия
- `confirmLessonByClient` — подтверждение занятия
- `submitLessonFeedback` — оценка/отзыв после занятия
- Заявки на отмену — `lib/actions/cancellation-requests.ts`
- Дети: `createChildForCurrentUser`, `updateChildForCurrentUser`, кабинет ребёнка, достижения, игры
- Анкеты: `lib/actions/surveys.ts`
- Профиль: `getProfileDisplayForCurrentClient`, `updateCurrentUserProfile`, `changePasswordForCurrentUser`, `deleteClientAccountAction`

**Для мобильного приложения** нужно либо:

1. **Добавить REST API**, дублирующий логику этих действий и отдающий JSON (все вызовы с заголовком `Authorization: Bearer <accessToken>`), либо  
2. Реализовать **BFF-слой** на том же домене, который принимает Bearer, подставляет сессию и вызывает те же Server Actions (сложнее и нестандартно).

Рекомендуется вариант 1: отдельные маршруты вида `/api/client/dashboard`, `/api/client/schedule`, `/api/client/lessons/:id/confirm` и т.д., внутри — та же логика, что в `client-cabinet` и смежных actions.

---

## Что добавить для мобильного приложения

### 1. Вход по логину/паролю с выдачей токенов в теле ответа

- **POST** `/auth/login`  
  - Body: `{ "emailOrPhone": "email@example.com" или "+375291234567", "password": "...", "device"?: { "deviceFingerprint"?, "deviceName"?, "os"?, "platform"?, "browser"? } }`.  
  - Поле `device` опционально; нужно для сохранения в «Мои устройства» понятного названия и ОС (см. раздел «Сохранение устройства и IP при входе»).  
  - Ответ при успехе: **200**, тело например `{ "accessToken", "refreshToken", "expiresAt" }`.  
  - Ошибки: **401** (неверные данные, пользователь не найден, нет пароля), **403** (аккаунт заблокирован). Не возвращать токены в cookie — только в JSON.

Логику брать из `lib/auth/actions.ts` (`loginAction`): проверка email/телефона, пароля, `user.isBlocked`, создание сессии через `createSession(user.id, body.device)` и выдача пары токенов из `tokens`. IP и User-Agent всегда берутся из заголовков запроса.

### 2. Поддержка Bearer в проверке сессии

- В `lib/auth/server.ts` (или в middleware) до чтения cookies проверять заголовок `Authorization: Bearer <accessToken>`.  
  - Если Bearer передан — валидировать access-токен и по нему загружать сессию и пользователя.  
  - Тогда одни и те же маршруты смогут работать и с cookies (веб), и с Bearer (мобильное).

### 3. Обновление токенов по refresh-токену в теле запроса

- **POST** `/auth/refresh` (или отдельный путь для мобильного, например `/auth/mobile/refresh`)  
  - Body: `{ "refreshToken": "..." }`  
  - Ответ: **200** `{ "accessToken", "refreshToken", "expiresAt" }` или **401** при невалидном/истёкшем refresh.

Логику брать из `refreshSession(refreshToken)` в `lib/auth/session.ts`; не полагаться на cookies.

### 4. Проверка сессии для мобильного

- Либо расширить **GET** `/auth/check`: при запросе с `Authorization: Bearer <accessToken>` проверять этот токен и возвращать **200** / **403** (заблокирован) / **401** (нет/невалидная сессия).  
  - Либо отдельный маршрут, например **GET** `/auth/me` с Bearer, возвращающий минимальный профиль и флаг блокировки.

Тогда мобильное приложение при старте может вызывать `/auth/check` (или `/auth/me`) с сохранённым access-токеном; при **401** — пробовать refresh; при снова **401** или **403** — очистить токены и показать экран входа.

### 5. REST для личного кабинета клиента

Реализовать набор GET/POST/PATCH/DELETE маршрутов под роль CLIENT, например:

- `GET /client/dashboard` — баланс, ближайшие занятия, абонементы, занятия к оценке, заявки на отмену.
- `GET /client/schedule?weekStart=...` — занятия на неделю.
- `GET /client/lessons/past?weekStart=...&status=...` — прошедшие занятия.
- `GET /client/lessons/:id` — карточка занятия.
- `POST /client/lessons/:id/confirm` — подтвердить занятие.
- `POST /client/lessons/:id/feedback` — отправить оценку/отзыв.
- Заявки на отмену: `POST /client/cancellation-requests` (body: lessonId, reason и т.д.).
- Дети: `GET /client/children`, `POST /client/children`, `PATCH /client/children/:id`, кабинет ребёнка (игры, достижения).
- Анкеты: `GET /client/surveys`, `GET /client/surveys/:id`, отправка ответов.
- Профиль: `GET /client/profile`, `PATCH /client/profile`, смена пароля, удаление аккаунта.
- Абонементы: `GET /client/subscriptions`.

Все эти маршруты должны требовать авторизацию (через Bearer после доработки `getServerSession`) и роль CLIENT.

---

## Краткая схема для мобильного приложения

1. **Первый запуск / нет токенов:** показать экран входа.
2. **Логин:** POST `/auth/login` (после реализации) с `emailOrPhone` и `password`. При **200** — сохранить `accessToken` и `refreshToken` в защищённом хранилище; при **401/403** — показать ошибку, на 403 можно текст «Аккаунт заблокирован».
3. **Каждый запрос к API:** заголовок `Authorization: Bearer <accessToken>`.
4. **При **401** на любом запросе:** один раз вызвать POST `/auth/refresh` с телом `{ refreshToken }`. При **200** — сохранить новые токены и повторить исходный запрос. При снова **401** — очистить токены и выкинуть на экран входа.
5. **При **403** (Blocked):** очистить токены и выкинуть на экран входа с сообщением о блокировке.
6. **Периодически (например при старте приложения):** GET `/auth/check` с Bearer — при **403** или **401** очистить токены и показать экран входа. Вход один раз запоминается; выход только при блокировке или невалидной/отсутствующей сессии.

---

## Резюме

- **Текущие API:** перечислены выше; авторизация только по cookies; данные клиента — только через Server Actions.
- **Для мобильного нужно:**  
  - POST `/auth/login` (JSON, токены в ответе),  
  - поддержка `Authorization: Bearer` в проверке сессии,  
  - POST refresh с телом `{ refreshToken }` и ответом с токенами,  
  - GET `/auth/check` (или `/auth/me`), работающий с Bearer,  
  - REST-эндпоинты для личного кабинета клиента.
- **Поведение сессии в приложении:** вход один раз, сессия сохраняется; при 401 (нет/невалидная сессия) или 403 (блокировка) — очистить токены и выкинуть пользователя на экран входа.
