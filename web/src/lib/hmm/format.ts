/**
 * Light formatting for text written by admins (banners, later event descriptions):
 * **bold**, *italic*, [link text](https://…), bare https:// links and line breaks.
 *
 * It produces tokens rather than HTML, and components render them as plain text nodes and
 * <a> elements, so nothing typed into a banner can inject markup or script.
 */

export type FormatToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'link'; text: string; href: string }
  | { type: 'break' };

const PATTERN = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])|(\n)/g;

/** Only web and mail links; anything else (javascript:, data:, …) stays as text. */
export const safeHref = (href: string): string | undefined => {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }
  try {
    const url = new URL(href);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
};

export const formatText = (input: string): FormatToken[] => {
  const tokens: FormatToken[] = [];
  const pushText = (text: string) => {
    if (!text) {
      return;
    }
    const last = tokens.at(-1);
    if (last?.type === 'text') {
      last.text += text;
    } else {
      tokens.push({ type: 'text', text });
    }
  };

  let index = 0;
  for (const match of input.matchAll(PATTERN)) {
    pushText(input.slice(index, match.index));
    index = match.index + match[0].length;

    const [whole, bold, italic, linkText, linkHref, bareUrl, newline] = match;
    if (bold !== undefined) {
      tokens.push({ type: 'bold', text: bold });
    } else if (italic !== undefined) {
      tokens.push({ type: 'italic', text: italic });
    } else if (linkText !== undefined) {
      const href = safeHref(linkHref);
      if (href) {
        tokens.push({ type: 'link', text: linkText, href });
      } else {
        pushText(whole);
      }
    } else if (bareUrl !== undefined) {
      const href = safeHref(bareUrl);
      if (href) {
        tokens.push({ type: 'link', text: bareUrl, href });
      } else {
        pushText(whole);
      }
    } else if (newline !== undefined) {
      tokens.push({ type: 'break' });
    }
  }
  pushText(input.slice(index));
  return tokens;
};
