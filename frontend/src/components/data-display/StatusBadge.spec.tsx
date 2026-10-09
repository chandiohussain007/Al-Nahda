import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the human-readable label for a known status', () => {
    render(<StatusBadge status="PROPOSED" />);

    expect(screen.getByText('Fee proposed')).toBeTruthy();
  });

  it('falls back to a readable label for unknown statuses', () => {
    render(<StatusBadge status="ARCHIVED" />);

    expect(screen.getByText('Archived')).toBeTruthy();
  });

  it('supports custom styling classes', () => {
    render(<StatusBadge status="APPROVED" className="custom-badge" />);

    const badge = screen.getByText('Approved').closest('span');
    expect(badge?.classList.contains('custom-badge')).toBe(true);
  });
});
