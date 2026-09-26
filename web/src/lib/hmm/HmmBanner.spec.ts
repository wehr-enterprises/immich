import { fireEvent, render, screen } from '@testing-library/svelte';
import HmmBanner from '$lib/hmm/HmmBanner.svelte';

describe('HmmBanner', () => {
  it('renders formatted text safely', () => {
    render(HmmBanner, {
      announcement: {
        title: 'Reunion',
        body: 'Register at [the site](https://www.165whiteknights.com) <script>alert(1)</script>',
        level: 'info',
        dismissible: true,
      },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Reunion');
    expect(screen.getByRole('link', { name: 'the site' })).toHaveAttribute('href', 'https://www.165whiteknights.com/');
    expect(document.querySelector('[data-testid="hmm-banner"] script')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('<script>alert(1)</script>');
  });

  it('only offers a close button when dismissible', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(HmmBanner, {
      announcement: { title: 'Closable', body: '', level: 'warning', dismissible: true },
      onDismiss,
    });
    await fireEvent.click(screen.getByRole('button', { name: /dismiss announcement/i }));
    expect(onDismiss).toHaveBeenCalledOnce();

    await rerender({ announcement: { title: 'Sticky', body: '', level: 'urgent', dismissible: false }, onDismiss });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('Sticky');
  });
});
