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
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export interface InstitutionLoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
  institution?: {
    name: string;
    logo_url?: string;
    primary_color: string;
  };
  color?: string;
}

export const InstitutionLoadingSpinner = React.forwardRef<
  HTMLDivElement,
  InstitutionLoadingSpinnerProps
>(({ className, size, text, institution, color, ...props }, ref) => {
  // Determinar qual logo usar
  const logoUrl = institution?.logo_url || Logo;
  const spinnerColor = color || institution?.primary_color || '#c39c49';
  const institutionName = institution?.name || 'NeuroIA Lab';

  if (text) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center space-y-3", className)}
        {...props}
      >
        <div className={spinnerVariants({ size })}>
          {institution?.logo_url ? (
            <img
              src={logoUrl}
              alt={`${institutionName} - Carregando...`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div
              className="w-full h-full rounded-xl flex items-center justify-center"
              style={{ backgroundColor: spinnerColor }}
            >
              <span className="text-white font-bold text-lg">
                {institutionName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <span className="text-gray-600 text-sm font-medium">{text}</span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(spinnerVariants({ size }), className)}
      {...props}
    >
      {institution?.logo_url ? (
        <img
          src={logoUrl}
          alt={`${institutionName} - Carregando...`}
          className="w-full h-full object-contain"
        />
      ) : (
        <div
          className="w-full h-full rounded-xl flex items-center justify-center"
          style={{ backgroundColor: spinnerColor }}
        >
          <span className="text-white font-bold text-lg">
            {institutionName.charAt(0)}
          </span>
        </div>
      )}
    </div>
  );
});

InstitutionLoadingSpinner.displayName = "InstitutionLoadingSpinner";

// Loading States for institutional components
export const InstitutionPageLoader = ({
  message = "Carregando...",
  institution
}: {
  message?: string;
  institution?: {
    name: string;
    logo_url?: string;
    primary_color: string;
  };
}) => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center z-50">
    <div className="text-center px-8 py-12">
      {/* Logo com animação suave */}
      <div className="w-16 h-16 mx-auto mb-8">
        <div
          className="w-full h-full rounded-2xl shadow-lg flex items-center justify-center p-3 animate-spin"
          style={{
            animationDuration: '3s',
            backgroundColor: institution?.primary_color ? institution.primary_color + '15' : '#f3f4f6'
          }}
        >
          {institution?.logo_url ? (
            <img
              src={institution.logo_url}
              alt={`${institution.name} - Carregando...`}
              className="w-full h-full object-contain"
            />
          ) : institution ? (
            <div
              className="w-full h-full rounded-xl flex items-center justify-center"
              style={{ backgroundColor: institution.primary_color }}
            >
              <span className="text-white font-bold text-xl">
                {institution.name.charAt(0)}
              </span>
            </div>
          ) : (
            <img src={Logo} alt="NeuroIA Lab" className="w-full h-full object-contain" />
          )}
        </div>
      </div>

      {/* Título elegante */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        {institution?.name || 'NeuroIA Lab'}
      </h2>

      {/* Mensagem de carregamento */}
      <p className="text-gray-600 text-base mb-6">
        {message}
      </p>

      {/* Barra de progresso animada */}
      <div className="w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
        <div
          className="h-full rounded-full animate-loading-bar"
          style={{
            background: institution?.primary_color
              ? `linear-gradient(to right, ${institution.primary_color}, ${institution.primary_color}CC)`
              : 'linear-gradient(to right, #c39c49, #c39c49CC)'
          }}
        ></div>
      </div>
    </div>
  </div>
);

export const InstitutionCardLoader = ({
  className,
  institution
}: {
  className?: string;
  institution?: {
    name: string;
    logo_url?: string;
    primary_color: string;
  };
}) => {
  const primaryColor = institution?.primary_color || '#c39c49';

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 p-6 animate-pulse", className)}>
      <div className="flex items-center space-x-4 mb-4">
        <div
          className="w-12 h-12 rounded-lg"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
        <div className="flex-1">
          <div
            className="h-5 rounded mb-2"
            style={{ backgroundColor: primaryColor + '30' }}
          ></div>
          <div
            className="h-3 rounded w-20"
            style={{ backgroundColor: primaryColor + '20' }}
          ></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div
          className="h-3 rounded"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
        <div
          className="h-3 rounded w-5/6"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
        <div
          className="h-3 rounded w-4/6"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
      </div>
      <div className="space-y-2">
        <div
          className="h-10 rounded"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
        <div
          className="h-8 rounded"
          style={{ backgroundColor: primaryColor + '20' }}
        ></div>
      </div>
    </div>
  );
};