/** Conversions between the hub's UTC ISO timestamps and <input type="datetime-local"> (browser time zone). */

const pad = (n: number) => String(n).padStart(2, '0');

export const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) {
    return '';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fromLocalInput = (value: string): string | null => {
  if (!value) {
    return null;
  }
  const d = new Date(value); // no zone in the string: parsed as local time
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export const formatWhen = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';
