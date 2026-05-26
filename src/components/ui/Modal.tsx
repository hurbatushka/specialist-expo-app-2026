import type { ReactNode } from "react";

import { BottomSheetModal } from "@/components/ui/BottomSheetModal";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Доли высоты экрана: нижняя / верхняя позиция sheet. */
  snapFractions?: [number, number];
}

/**
 * Обёртка над BottomSheetModal — единый паттерн вместо центрированных RN Modal.
 */
export function Modal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  snapFractions = [0.4, 0.72],
}: ModalProps) {
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      snapFractions={snapFractions}
      keyboardAvoiding
    >
      {children}
    </BottomSheetModal>
  );
}
