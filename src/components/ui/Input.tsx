import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const fieldStyles =
  "w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-150 focus:border-accent";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`${fieldStyles} ${className}`} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={`${fieldStyles} resize-none leading-relaxed ${className}`}
    {...props}
  />
));
Textarea.displayName = "Textarea";
