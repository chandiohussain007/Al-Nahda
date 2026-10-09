import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Button from './Button';

describe('Button', () => {
  it('renders its label and applies the requested variant and size', () => {
    render(
      <Button variant="secondary" size="lg">
        Enroll now
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Enroll now' });
    expect(button.getAttribute('type')).toBe('button');
    expect(button.classList.contains('bg-teal')).toBe(true);
    expect(button.classList.contains('px-6')).toBe(true);
  });

  it('invokes its click handler when activated', () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Submit</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button', { name: 'Disabled' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.classList.contains('disabled:cursor-not-allowed')).toBe(true);
  });
});
