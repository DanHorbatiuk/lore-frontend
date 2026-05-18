import { cn } from '@/utils/cn';
import type { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'bg-white rounded-xl shadow-card border border-slate-100 p-5 transition-shadow',
        props.onClick && 'hover:shadow-md cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
