'use client';

import { motion } from 'motion/react';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}: any) => {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const variants: any = {
    primary:
      'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost:
      'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
