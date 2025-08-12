// Shipping and payment (COD) configuration
// Change SHIPPING_SCOPE to 'local' or 'nationwide' to switch modes.

export const SHIPPING_SCOPE = 'local'; // 'local' | 'nationwide'

// Define where COD is allowed. Use normalized (accent-free, lowercase) comparisons.
const normalize = s =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Common variants for the San Andrés department naming across datasets
const COD_ALLOWED_DEPARTMENTS = new Set([
  'san andres y providencia',
  'san andres, providencia y santa catalina',
  'archipielago de san andres, providencia y santa catalina',
]);

const COD_ALLOWED_CITIES = new Set(['san andres']);

export const COD_DISABLED_MESSAGE =
  'Contra Entrega está disponible solo en San Andrés.';

export function isCodAllowedLocation({ department, city }) {
  const d = normalize(department);
  const c = normalize(city);
  if (!d && !c) return false;
  if (COD_ALLOWED_DEPARTMENTS.has(d)) return true;
  if (COD_ALLOWED_CITIES.has(c)) return true;
  return false;
}
