const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** '2026-07' → 'julio 2026' */
export function formatMonth(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** '2026-07' → 'Julio 2026' */
export function formatMonthTitle(period: string): string {
  const text = formatMonth(period);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** '2026-07' → 'jul' */
export function formatMonthShort(period: string): string {
  const [, m] = period.split('-').map(Number);
  return MONTHS[m - 1].slice(0, 3);
}

/** Month names joined in Spanish: ['2026-07', '2026-08'] → 'julio y agosto' */
export function joinMonths(periods: string[]): string {
  const names = periods.map((p) => MONTHS[Number(p.split('-')[1]) - 1]);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

export function formatDate(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

export function formatDateShort(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return `${pad(d)}/${pad(m)}/${y}`;
}

export function formatTime(value: string): string {
  const time = value.slice(11, 16);
  if (!time) return '';
  const [h, min] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(min)} ${suffix}`;
}

export function formatDateTime(value: string): string {
  return `${formatDateShort(value)}, ${formatTime(value)}`;
}

/** Local ISO date-time without time zone, e.g. 2026-10-31T10:15:00 */
export function nowIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function todayIso(): string {
  return nowIso().slice(0, 10);
}

export function periodOf(value: string): string {
  return value.slice(0, 7);
}

/** List of YYYY-MM between two periods, inclusive. */
export function monthRange(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${pad(m)}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export function lastDayOfMonth(period: string): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m, 0).getDate();
  return `${period}-${pad(d)}`;
}
