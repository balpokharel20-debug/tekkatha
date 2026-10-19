export function formatNpr(value) {
  return `Rs. ${Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}
