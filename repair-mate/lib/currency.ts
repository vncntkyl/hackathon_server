const phpCurrency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatPHP(amount: number): string {
  return phpCurrency.format(amount);
}
