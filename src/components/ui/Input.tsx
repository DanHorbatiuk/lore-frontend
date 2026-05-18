import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label?: string;
  labelClassName?: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, labelClassName, error, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className={cn('block text-sm font-medium text-slate-700', labelClassName)}>
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, error, className, ...props }, ref) => (
    <FieldWrapper label={label} labelClassName={labelClassName} error={error}>
      <input
        ref={ref}
        {...props}
        className={cn(
          'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
      />
    </FieldWrapper>
  ),
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, labelClassName, error, className, ...props }, ref) => (
    <FieldWrapper label={label} labelClassName={labelClassName} error={error}>
      <textarea
        ref={ref}
        {...props}
        className={cn(
          'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
      />
    </FieldWrapper>
  ),
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, labelClassName, error, options, className, ...props }, ref) => (
    <FieldWrapper label={label} labelClassName={labelClassName} error={error}>
      <select
        ref={ref}
        {...props}
        className={cn(
          'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white',
          error && 'border-red-400 focus:ring-red-400',
          className,
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrapper>
  ),
);
Select.displayName = 'Select';
