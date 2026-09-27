/** "3:05 PM" today, "Sep 3" this year, "Jul 4, 2012" before that. */
export const formatBoardDate = (iso: string, now = new Date()): string => {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Up to two initials, for authors without an Immich account. */
export const initials = (name: string): string => {
  const words = name
    .replaceAll(/\(.*?\)/g, ' ')
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word));
  const letters = words.length > 1 ? [words[0], words.at(-1)!] : words.slice(0, 1);
  return letters.map((word) => [...word][0].toUpperCase()).join('') || '?';
};

const COLORS = ['bg-sky-700', 'bg-emerald-700', 'bg-amber-700', 'bg-rose-700', 'bg-violet-700', 'bg-teal-700'];

/** The same name always gets the same color. */
export const initialsColor = (name: string): string => {
  let hash = 0;
  for (const ch of name) {
    hash = Math.trunc(hash * 31 + (ch.codePointAt(0) ?? 0));
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};
