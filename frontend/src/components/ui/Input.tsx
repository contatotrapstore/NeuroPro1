import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  // Base styles - Common to all inputs
  "w-full rounded-lg border bg-neuro-surface px-3 py-2 text-sm placeholder:text-neuro-gray-400 focus:outline-none focus:ring-2 focus:ring-neuro-primary focus:ring-offset-2 focus:border-neuro-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-neuro-border hover:border-neuro-gray-400",
        error: "border-neuro-error focus:ring-neuro-error focus:border-neuro-error",
        success: "border-neuro-success focus:ring-neuro-success focus:border-neuro-success",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 py-2",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    variant,
    size,
    label,
    error,
    success,
    helper,
    leftIcon,
    rightIcon,
    leftElement,
    rightElement,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine variant based on state
    const computedVariant = error ? "error" : success ? "success" : variant;
    
    const hasLeftContent = leftIcon || leftElement;
    const hasRightContent = rightIcon || rightElement;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-neuro-gray-700 mb-2"
          >
            {label}
            {props.required && <span className="text-neuro-error ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon/Element */}
          {hasLeftContent && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              {leftIcon && (
                <span className="text-neuro-gray-400 text-sm">
                  {leftIcon}
                </span>
              )}
              {leftElement}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              inputVariants({ variant: computedVariant, size }),
              hasLeftContent && "pl-10",
              hasRightContent && "pr-10",
              className
            )}
            {...props}
          />

          {/* Right Icon/Element */}
          {hasRightContent && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightIcon && (
                <span className="text-neuro-gray-400 text-sm pointer-events-none">
                  {rightIcon}
                </span>
              )}
              {rightElement}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {(error || success || helper) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-neuro-error flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {success && !error && (
              <p className="text-sm text-neuro-success flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </p>
            )}
            {helper && !error && !success && (
              <p className="text-sm text-neuro-gray-500">
                {helper}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";