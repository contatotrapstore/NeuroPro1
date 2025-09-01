import React from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  "rounded-2xl border shadow-neuro transition-all duration-300",
  {
    variants: {
      variant: {
        default: "glass-card",
        elevated: "glass-card shadow-neuro-xl border-neuro-border-light",
        interactive: "glass-card hover:shadow-neuro-xl hover:-translate-y-1 cursor-pointer",
        outline: "border-neuro-border bg-transparent backdrop-blur-sm",
        filled: "bg-neuro-surface border-neuro-border-dark",
        gradient: "bg-gradient-to-br from-neuro-surface to-neuro-surface-alt border-neuro-border",
        glow: "glass-card shadow-glow-lg border-neuro-primary/20",
        error: "glass-card border-neuro-error/30 bg-neuro-error/5",
        success: "glass-card border-neuro-success/30 bg-neuro-success/5",
        warning: "glass-card border-neuro-warning/30 bg-neuro-warning/5",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  animated?: boolean;
  hoverScale?: boolean;
  glowOnHover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    children, 
    animated = false,
    hoverScale = false,
    glowOnHover = false,
    ...props 
  }, ref) => {
    const CardComponent = animated ? motion.div : 'div';
    
    const animationProps = animated ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: "easeOut" },
      ...(hoverScale && {
        whileHover: { scale: 1.02, y: -4 },
        whileTap: { scale: 0.98 }
      })
    } : {};
    
    const cardClasses = cn(
      cardVariants({ variant, size }),
      glowOnHover && "hover:shadow-glow-lg",
      className
    );
    
    return (
      <CardComponent
        ref={ref}
        className={cardClasses}
        {...animationProps}
        {...(props as any)}
      >
        {children}
      </CardComponent>
    );
  }
);

Card.displayName = "Card";

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 pb-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// Card Title Component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, as: Comp = 'h3', ...props }, ref) => {
    return (
      <Comp
        ref={ref}
        className={cn("text-xl font-bold leading-tight tracking-tight text-neuro-gray-900 font-display", className)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

CardTitle.displayName = "CardTitle";

// Card Description Component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-neuro-gray-600 leading-relaxed", className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = "CardDescription";

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("pt-0", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

// Card Footer Component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center pt-4", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";