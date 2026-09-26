import { fromLocalInput, toLocalInput } from '$lib/hmm/datetime';

describe('datetime-local conversions', () => {
  it('round-trips through the browser time zone', () => {
    const local = '2030-06-01T09:30';
    const iso = fromLocalInput(local);
    expect(iso).toMatch(/^2030-06-01T\d{2}:30:00\.000Z$/);
    expect(toLocalInput(iso)).toBe(local);
  });

  it('treats empty and invalid values as "not set"', () => {
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('not a date')).toBeNull();
    expect(toLocalInput(null)).toBe('');
    expect(toLocalInput('garbage')).toBe('');
  });
});
