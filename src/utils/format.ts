export const money = (value: string | number) =>
  new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" }) : "—";
