const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

/** Formats a rupee amount with Indian digit grouping, e.g. ₹12,34,567.5 */
export function formatCurrency(value: number) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatNumber(value: number) {
  return numberFormatter.format(Number(value) || 0);
}

/** Up to two initials from a name, for avatars. */
export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
