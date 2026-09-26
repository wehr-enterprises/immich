import { formatText, safeHref } from '$lib/hmm/format';

describe('formatText', () => {
  it('handles bold, italic, links and line breaks', () => {
    expect(formatText('Register by **March 1**, *please*.\nSee [the page](https://example.org/reunion).')).toEqual([
      { type: 'text', text: 'Register by ' },
      { type: 'bold', text: 'March 1' },
      { type: 'text', text: ', ' },
      { type: 'italic', text: 'please' },
      { type: 'text', text: '.' },
      { type: 'break' },
      { type: 'text', text: 'See ' },
      { type: 'link', text: 'the page', href: 'https://example.org/reunion' },
      { type: 'text', text: '.' },
    ]);
  });

  it('links bare web addresses without swallowing trailing punctuation', () => {
    expect(formatText('Details at https://www.165whiteknights.com/reunion.')).toEqual([
      { type: 'text', text: 'Details at ' },
      {
        type: 'link',
        text: 'https://www.165whiteknights.com/reunion',
        href: 'https://www.165whiteknights.com/reunion',
      },
      { type: 'text', text: '.' },
    ]);
  });

  it('keeps markup as plain text (rendered as text nodes, never HTML)', () => {
    expect(formatText('<img src=x onerror=alert(1)>')).toEqual([
      { type: 'text', text: '<img src=x onerror=alert(1)>' },
    ]);
  });

  it('refuses script and data links', () => {
    expect(formatText('[click](javascript:alert(1))')).toEqual([
      { type: 'text', text: '[click](javascript:alert(1))' },
    ]);
    expect(formatText('[x](data:text/html,hi)').every((t) => t.type === 'text')).toBe(true);
  });

  it('allows site-relative and mail links', () => {
    expect(safeHref('/hub/home')).toBe('/hub/home');
    expect(safeHref('//evil.example/x')).toBeUndefined();
    expect(safeHref('mailto:someone@example.org')).toBe('mailto:someone@example.org');
  });

  it('returns nothing for empty text', () => {
    expect(formatText('')).toEqual([]);
  });
});
