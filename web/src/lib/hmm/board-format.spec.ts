import { formatBoardDate, initials, initialsColor } from '$lib/hmm/board-format';

describe('formatBoardDate', () => {
  const now = new Date('2026-09-26T15:00:00');

  it('shows the year only for older posts', () => {
    expect(formatBoardDate(new Date('2012-07-04T17:01:00').toISOString(), now)).toContain('2012');
    expect(formatBoardDate(new Date('2026-03-01T09:00:00').toISOString(), now)).not.toContain('2026');
  });

  it('shows just the time for today', () => {
    expect(formatBoardDate(new Date('2026-09-26T09:05:00').toISOString(), now)).toMatch(/9:05/);
  });
});

describe('initials', () => {
  it.each`
    name                                            | expected
    ${'Jim Sramek'}                                 | ${'JS'}
    ${'Terry Calo (WOP)'}                           | ${'TC'}
    ${'Ron Burke (Subic & Cubi Pt. 07/76 - 11/77)'} | ${'RB'}
    ${'H20Surfer'}                                  | ${'H'}
    ${'Bridget Swabb Ashley'}                       | ${'BA'}
    ${'  '}                                         | ${'?'}
  `('$name -> $expected', ({ name, expected }) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('initialsColor', () => {
  it('is stable per name', () => {
    expect(initialsColor('George Otto')).toBe(initialsColor('George Otto'));
    expect(initialsColor('George Otto')).toMatch(/^bg-/);
  });
});
