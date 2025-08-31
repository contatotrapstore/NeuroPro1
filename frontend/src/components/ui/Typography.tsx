import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// Heading Variants
const headingVariants = cva(
  "font-display tracking-tight text-neuro-gray-900",
  {
    variants: {
      level: {
        h1: "text-5xl lg:text-6xl font-black leading-tight",
        h2: "text-4xl lg:text-5xl font-bold leading-tight",
        h3: "text-3xl lg:text-4xl font-bold leading-snug",
        h4: "text-2xl lg:text-3xl font-bold leading-snug",
        h5: "text-xl lg:text-2xl font-semibold leading-normal",
        h6: "text-lg lg:text-xl font-semibold leading-normal"
      },
      color: {
        default: "text-neuro-gray-900",
        primary: "text-gradient",
        muted: "text-neuro-gray-600",
        success: "text-neuro-success",
        warning: "text-neuro-warning",
        error: "text-neuro-error"
      },
      spacing: {
        tight: "mb-2",
        normal: "mb-4",
        relaxed: "mb-6",
        loose: "mb-8"
      }
    },
    defaultVariants: {
      level: "h2",
      color: "default",
      spacing: "normal"
    }
  }
);

// Text Variants
const textVariants = cva(
  "font-sans text-neuro-gray-700",
  {
    variants: {
      size: {
        xs: "text-xs",
        sm: "text-sm",
        base: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        '2xl': "text-2xl"
      },
      weight: {
        light: "font-light",
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold"
      },
      color: {
        default: "text-neuro-gray-700",
        muted: "text-neuro-gray-600",
        subtle: "text-neuro-gray-500",
        primary: "text-neuro-primary",
        success: "text-neuro-success",
        warning: "text-neuro-warning",
        error: "text-neuro-error"
      },
      leading: {
        tight: "leading-tight",
        normal: "leading-normal",
        relaxed: "leading-relaxed",
        loose: "leading-loose"
      }
    },
    defaultVariants: {
      size: "base",
      weight: "normal",
      color: "default",
      leading: "normal"
    }
  }
);

// Heading Component
export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  animated?: boolean;
  glowOnHover?: boolean;
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ 
    className, 
    level = "h2", 
    color, 
    spacing, 
    as, 
    children, 
    animated = false,
    glowOnHover = false,
    ...props 
  }, ref) => {
    const Component = as || level;
    
    const headingClasses = cn(
      headingVariants({ level, color, spacing }),
      glowOnHover && "hover:text-gradient-glow transition-all duration-300",
      className
    );
    
    if (animated) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Component
            ref={ref}
            className={headingClasses}
            {...props}
          >
            {children}
          </Component>
        </motion.div>
      );
    }
    
    return (
      <Component
        ref={ref}
        className={headingClasses}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Heading.displayName = "Heading";

// Text Component
export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div' | 'label';
  animated?: boolean;
}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ 
    className, 
    size, 
    weight, 
    color, 
    leading, 
    as = 'p', 
    children, 
    animated = false,
    ...props 
  }, ref) => {
    const Component = as;
    
    const textClasses = cn(
      textVariants({ size, weight, color, leading }),
      className
    );
    
    if (animated) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Component
            ref={ref}
            className={textClasses}
            {...props}
          >
            {children}
          </Component>
        </motion.div>
      );
    }
    
    return (
      <Component
        ref={ref}
        className={textClasses}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

// Display Text Component (for hero sections)
export interface DisplayTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  gradient?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DisplayText = React.forwardRef<HTMLHeadingElement, DisplayTextProps>(
  ({ 
    className, 
    children, 
    gradient = false,
    animated = true,
    size = 'lg',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: "text-4xl lg:text-5xl",
      md: "text-5xl lg:text-6xl", 
      lg: "text-6xl lg:text-7xl",
      xl: "text-7xl lg:text-8xl"
    };
    
    const displayClasses = cn(
      "font-display font-black leading-none tracking-tighter",
      sizeClasses[size],
      gradient ? "text-gradient" : "text-neuro-gray-900",
      className
    );
    
    if (animated) {
      return (
        <motion.h1
          ref={ref}
          className={displayClasses}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          {...props}
        >
          {children}
        </motion.h1>
      );
    }
    
    return (
      <h1
        ref={ref}
        className={displayClasses}
        {...props}
      >
        {children}
      </h1>
    );
  }
);

DisplayText.displayName = "DisplayText";

// Caption Component (for small descriptive text)
export interface CaptionProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: 'default' | 'muted' | 'primary';
  uppercase?: boolean;
}

export const Caption = React.forwardRef<HTMLSpanElement, CaptionProps>(
  ({ 
    className, 
    children, 
    color = 'muted',
    uppercase = false,
    ...props 
  }, ref) => {
    const colorClasses = {
      default: "text-neuro-gray-600",
      muted: "text-neuro-gray-500",
      primary: "text-neuro-primary"
    };
    
    const captionClasses = cn(
      "text-xs font-semibold tracking-wide",
      colorClasses[color],
      uppercase && "uppercase",
      className
    );
    
    return (
      <span
        ref={ref}
        className={captionClasses}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Caption.displayName = "Caption";

// Quote Component
export interface QuoteProps extends React.HTMLAttributes<HTMLBlockquoteElement> {
  children: React.ReactNode;
  author?: string;
  role?: string;
  animated?: boolean;
}

export const Quote = React.forwardRef<HTMLBlockquoteElement, QuoteProps>(
  ({ 
    className, 
    children, 
    author,
    role,
    animated = false,
    ...props 
  }, ref) => {
    const quoteClasses = cn(
      "relative text-lg font-medium text-neuro-gray-800 leading-relaxed",
      className
    );
    
    const content = (
      <blockquote
        ref={ref}
        className={quoteClasses}
        {...props}
      >
        <div className="relative">
          {/* Quote marks */}
          <div className="absolute -top-4 -left-2 text-4xl text-neuro-primary/20 font-serif">"</div>
          <div className="pl-6">
            {children}
          </div>
          {(author || role) && (
            <footer className="mt-4 pl-6">
              {author && (
                <cite className="font-semibold text-neuro-gray-900 not-italic">
                  {author}
                </cite>
              )}
              {role && (
                <div className="text-sm text-neuro-gray-600 font-medium">
                  {role}
                </div>
              )}
            </footer>
          )}
        </div>
      </blockquote>
    );
    
    if (animated) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {content}
        </motion.div>
      );
    }
    
    return content;
  }
);

Quote.displayName = "Quote";

// Code Component
export interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  inline?: boolean;
}

export const Code = React.forwardRef<HTMLElement, CodeProps>(
  ({ 
    className, 
    children, 
    inline = true,
    ...props 
  }, ref) => {
    if (inline) {
      return (
        <code
          ref={ref as React.RefObject<HTMLElement>}
          className={cn(
            "px-2 py-1 text-sm font-mono bg-neuro-surface rounded-md border border-neuro-border text-neuro-gray-800",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }
    
    return (
      <pre
        ref={ref as React.RefObject<HTMLPreElement>}
        className={cn(
          "p-4 text-sm font-mono bg-neuro-surface rounded-xl border border-neuro-border text-neuro-gray-800 overflow-x-auto",
          className
        )}
        {...props}
      >
        <code>{children}</code>
      </pre>
    );
  }
);

Code.displayName = "Code";