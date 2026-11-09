export function tabDestination(values, current, key) {
  const index = Math.max(0, values.indexOf(current));
  if (key === 'Home') return values[0];
  if (key === 'End') return values.at(-1);
  if (key === 'ArrowRight') return values[(index + 1) % values.length];
  if (key === 'ArrowLeft') return values[(index - 1 + values.length) % values.length];
  return null;
}
