import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import Logo from '../../assets/Logo.png';

const spinnerVariants = cva(
  "animate-spin flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-20 w-20",
      },
      variant: {
        primary: "",
        secondary: "",
        white: "",
        current: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
}

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, ...props }, ref) => {
    if (text) {
      return (
        <div
          ref={ref}
          className={cn("flex flex-col items-center justify-center space-y-3", className)}
          {...props}
        >
          <div className={spinnerVariants({ size, variant })}>
            <img src={Logo} alt="Carregando..." className="w-full h-full object-contain" />
          </div>
          <span className="text-gray-600 text-sm font-medium">{text}</span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        {...props}
      >
        <img src={Logo} alt="Carregando..." className="w-full h-full object-contain" />
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

// Loading States for different components
export const PageLoader = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center z-50">
    <div className="text-center px-8 py-12">
      {/* Logo com animação suave */}
      <div className="w-16 h-16 mx-auto mb-8 animate-pulse">
        <div className="w-full h-full bg-white rounded-2xl shadow-lg flex items-center justify-center p-3 animate-spin" style={{ animationDuration: '3s' }}>
          <img src={Logo} alt="NeuroIA Lab" className="w-full h-full object-contain" />
        </div>
      </div>
      
      {/* Título elegante */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in">
        NeuroIA Lab
      </h2>
      
      {/* Mensagem de carregamento */}
      <p className="text-gray-600 text-base mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {message}
      </p>
      
      {/* Barra de progresso animada */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div className="h-full bg-gradient-to-r from-neuro-primary to-green-500 rounded-full animate-loading-bar"></div>
      </div>
    </div>
  </div>
);

export const CardLoader = ({ className }: { className?: string }) => (
  <div className={cn("bg-neuro-surface rounded-xl border border-neuro-border p-6 animate-pulse", className)}>
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-neuro-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-5 bg-neuro-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-neuro-gray-200 rounded w-20"></div>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-neuro-gray-200 rounded"></div>
      <div className="h-3 bg-neuro-gray-200 rounded w-5/6"></div>
      <div className="h-3 bg-neuro-gray-200 rounded w-4/6"></div>
    </div>
    <div className="space-y-2">
      <div className="h-10 bg-neuro-gray-200 rounded"></div>
      <div className="h-8 bg-neuro-gray-200 rounded"></div>
    </div>
  </div>
);

export const TableLoader = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="animate-pulse flex space-x-4 p-4">
        <div className="rounded-full bg-neuro-gray-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-neuro-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-neuro-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-neuro-gray-200 rounded w-20"></div>
      </div>
    ))}
  </div>
);