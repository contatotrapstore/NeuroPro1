import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

const buttonVariants = cva(
  // Base styles - Common to all buttons
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Main CTA buttons
        primary: "bg-neuro-primary text-white shadow-sm hover:bg-neuro-primary-hover hover:shadow-md active:shadow-sm",
        
        // Secondary - Alternative actions
        secondary: "border border-neuro-border bg-neuro-surface text-neuro-gray-700 shadow-sm hover:bg-neuro-surface-hover hover:shadow-md",
        
        // Outline - Subtle actions
        outline: "border border-neuro-primary text-neuro-primary bg-transparent hover:bg-neuro-primary-50 hover:shadow-sm",
        
        // Ghost - Minimal actions
        ghost: "text-neuro-gray-700 hover:bg-neuro-surface-hover hover:text-neuro-gray-900",
        
        // Destructive - Dangerous actions
        destructive: "bg-neuro-error text-white shadow-sm hover:bg-red-600 hover:shadow-md active:shadow-sm",
        
        // Success - Positive actions
        success: "bg-neuro-success text-white shadow-sm hover:bg-green-600 hover:shadow-md active:shadow-sm",
        
        // Link - Text-only buttons
        link: "text-neuro-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
      loading: {
        true: "cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      loading: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  asChild?: boolean;
}


export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    asChild,
    ...props 
  }, ref) => {
    const spinnerSize = size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "md";
    
    if (asChild) {
      return React.Children.only(children) as React.ReactElement;
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading state */}
        {loading && (
          <LoadingSpinner size={spinnerSize} variant="current" />
        )}
        
        {/* Left icon - only show if not loading */}
        {!loading && leftIcon && (
          <span className="mr-2 -ml-1">
            {leftIcon}
          </span>
        )}
        
        {/* Button text */}
        <span className={cn(loading && "ml-2")}>
          {children}
        </span>
        
        {/* Right icon - only show if not loading */}
        {!loading && rightIcon && (
          <span className="ml-2 -mr-1">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";