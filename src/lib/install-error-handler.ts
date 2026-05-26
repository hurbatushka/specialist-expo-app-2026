/**
 * Side-effect модуль — устанавливает global JS error handler КАК МОЖНО РАНЬШЕ.
 * Импортируется первой строкой `_layout.tsx`, ДО expo-router и любых других модулей.
 *
 * Цель: не дать unhandled JS error дойти до RCTExceptionsManager.reportException →
 * RCTFatal → ObjC NSException → SIGABRT (известный краш на iOS 26 / Mac Catalyst).
 */

type ErrorHandler = (error: unknown, isFatal?: boolean) => void;

type ErrorUtilsLike = {
  getGlobalHandler?: () => ErrorHandler;
  setGlobalHandler?: (handler: ErrorHandler) => void;
};

declare const __DEV__: boolean;

(function install() {
  try {
    const ErrorUtils = (globalThis as unknown as { ErrorUtils?: ErrorUtilsLike })
      .ErrorUtils;
    if (!ErrorUtils?.getGlobalHandler || !ErrorUtils?.setGlobalHandler) return;

    const previous = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      try {
        const message =
          error instanceof Error
            ? `${error.name}: ${error.message}\n${error.stack ?? ""}`
            : String(error);
        if (__DEV__) {
          console.error(`[global-js-error fatal=${!!isFatal}]`, message);
        } else {
          console.warn(`[global-js-error fatal=${!!isFatal}]`, message);
        }
      } catch {
        /* ignore secondary error */
      }

      if (__DEV__) {
        try {
          previous(error, isFatal);
        } catch {
          /* ignore */
        }
      }
      // В production НЕ пробрасываем дальше — иначе RN зовёт reportException → RCTFatal → SIGABRT.
    });
  } catch {
    /* runtime без ErrorUtils — игнор */
  }

  try {
    const g = globalThis as unknown as {
      addEventListener?: (
        type: string,
        listener: (event: { reason?: unknown }) => void,
      ) => void;
    };
    g.addEventListener?.("unhandledrejection", (event) => {
      try {
        if (__DEV__) {
          console.error("[unhandledRejection]", event?.reason);
        } else {
          console.warn("[unhandledRejection]", event?.reason);
        }
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* not supported */
  }
})();

export {};
