/** Format an integer amount (whole currency units) with a currency label. */
export function formatMoney(amount: number, currency = 'rwf'): string {
  const n = new Intl.NumberFormat('en-US').format(Math.round(amount));
  return `${currency.toUpperCase()} ${n}`;
}
