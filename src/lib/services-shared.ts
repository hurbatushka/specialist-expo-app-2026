export type ClientServiceSection = {
  title: string;
  content: string | string[];
};

export type ClientServiceItem = {
  id: string;
  type: string;
  name: string;
  durationMinutes: number;
  price: number;
  subscriptionPrice: number | null;
  description: string;
  sections: ClientServiceSection[];
  popular: boolean;
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  subscriptions: "Абонементы",
  single: "Разовые",
  additional: "Консультации",
};

export const SERVICE_TYPE_ORDER = ["subscriptions", "single", "additional"] as const;

export function formatServicePrice(value: number): string {
  return (
    value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " BYN"
  );
}

export function groupServicesByType(
  services: ClientServiceItem[],
): { type: string; label: string; items: ClientServiceItem[] }[] {
  const byType = new Map<string, ClientServiceItem[]>();
  for (const s of services) {
    const list = byType.get(s.type) ?? [];
    list.push(s);
    byType.set(s.type, list);
  }
  return SERVICE_TYPE_ORDER.map((type) => ({
    type,
    label: SERVICE_TYPE_LABELS[type] ?? type,
    items: byType.get(type) ?? [],
  })).filter((g) => g.items.length > 0);
}
