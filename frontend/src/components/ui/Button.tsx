import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Primary = gold — the signature accent of the AI Studio design system.
  primary:
    'bg-gold text-primary hover:bg-gold-light focus-visible:ring-gold',
  // Secondary = teal — used for sign-up / enroll actions on the landing page.
  secondary:
    'bg-teal text-white hover:bg-[#125553] focus-visible:ring-teal',
  ghost:
    'bg-transparent border border-sandstone text-charcoal hover:bg-sandstone/40 focus-visible:ring-gold dark:border-gold/40 dark:text-ivory dark:hover:bg-white/10',
  danger:
    'bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus-visible:ring-red-500',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs min-h-[44px] md:min-h-[32px]',
  md: 'px-4 py-2 text-sm min-h-[44px] md:min-h-[36px]',
  lg: 'px-6 py-3 text-base min-h-[44px] md:min-h-[48px]',
};

/** Shared button: primary (gold), secondary (teal), ghost, and danger variants. */
export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
}
