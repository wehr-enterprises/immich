import { render, screen } from '@testing-library/svelte';
import HmmLanding from '$lib/hmm/HmmLanding.svelte';
import { SOURCE_URL } from '$lib/hmm/branding';

describe('HmmLanding', () => {
  it('invites members to sign in and new shipmates to report in', () => {
    render(HmmLanding);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('White Knights');
    expect(screen.getByRole('link', { name: /member sign in/i })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: /report in/i })).toHaveAttribute(
      'href',
      'https://www.165whiteknights.com/?page_id=494',
    );
  });

  it('links to the source of this modified web UI (AGPL)', () => {
    render(HmmLanding);

    expect(screen.getByRole('link', { name: /source code/i })).toHaveAttribute('href', SOURCE_URL);
  });
});
