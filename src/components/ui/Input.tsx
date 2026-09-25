import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      id: customId,
      disabled,
      required,
      className = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-label text-foreground">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-body text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? "border-error focus-visible:ring-error"
              : "border-border focus-visible:ring-primary focus-visible:ring-offset-background"
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-caption text-error">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-caption text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
