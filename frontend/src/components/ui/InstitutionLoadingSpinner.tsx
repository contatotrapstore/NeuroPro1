import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import Logo from '../../assets/Logo.png';
import { getInstitutionStaticData } from '../../config/institutions';
import { useParams } from 'react-router-dom';

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
  slug?: string;
}

export const InstitutionLoadingSpinner = React.forwardRef<
  HTMLDivElement,
  InstitutionLoadingSpinnerProps
>(({ className, size, text, institution, color, slug, ...props }, ref) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const currentSlug = slug || routeSlug;
  const [imageError, setImageError] = useState(false);

  // Tentar obter dados estáticos se a instituição não foi carregada
  const staticData = currentSlug ? getInstitutionStaticData(currentSlug) : null;
  const fallbackInstitution = institution || staticData;

  // Determinar qual logo usar
  const logoUrl = fallbackInstitution?.logo_url || Logo;
  const spinnerColor = color || fallbackInstitution?.primary_color || '#c39c49';
  const institutionName = fallbackInstitution?.name || 'NeuroIA Lab';

  // Função para tratar erro de carregamento da imagem
  const handleImageError = () => {
    console.warn(`Failed to load institution logo: ${logoUrl}`);
    setImageError(true);
  };

  // Se há erro na imagem ou não há URL válida, usar fallback baseado em texto
  const shouldUseTextFallback = imageError || !fallbackInstitution?.logo_url || fallbackInstitution?.logo_url === '';

  // Log para debug
  console.log('🖼️ InstitutionLoadingSpinner:', {
    currentSlug,
    hasStaticData: !!staticData,
    hasFallbackInstitution: !!fallbackInstitution,
    logoUrl: fallbackInstitution?.logo_url,
    shouldUseTextFallback,
    imageError
  });

  if (text) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center space-y-3 mx-auto", className)}
        {...props}
      >
        <div className={spinnerVariants({ size })}>
          {!shouldUseTextFallback ? (
            <img
              src={logoUrl}
              alt={`${institutionName} - Carregando...`}
              className="w-full h-full object-contain"
              onError={handleImageError}
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
      className={cn(spinnerVariants({ size }), "mx-auto", className)}
      {...props}
    >
      {!shouldUseTextFallback ? (
        <img
          src={logoUrl}
          alt={`${institutionName} - Carregando...`}
          className="w-full h-full object-contain"
          onError={handleImageError}
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
  institution,
  slug
}: {
  message?: string;
  institution?: {
    name: string;
    logo_url?: string;
    primary_color: string;
  };
  slug?: string;
}) => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const currentSlug = slug || routeSlug;
  const staticData = currentSlug ? getInstitutionStaticData(currentSlug) : null;
  const fallbackInstitution = institution || staticData;
  const [imageError, setImageError] = useState(false);

  // Função para tratar erro de carregamento da imagem
  const handleImageError = () => {
    console.warn(`Failed to load institution logo in page loader`);
    setImageError(true);
  };

  // Se há erro na imagem ou não há URL válida, usar fallback baseado em texto
  const shouldUseTextFallback = imageError || !fallbackInstitution?.logo_url || fallbackInstitution?.logo_url === '';

  return (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center z-50">
    <div className="text-center px-8 py-12">
      {/* Logo com animação suave */}
      <div className="w-16 h-16 mx-auto mb-8">
        <div
          className="w-full h-full rounded-2xl shadow-lg flex items-center justify-center p-3 animate-spin"
          style={{
            animationDuration: '3s',
            backgroundColor: fallbackInstitution?.primary_color ? fallbackInstitution.primary_color + '15' : '#f3f4f6'
          }}
        >
          {!shouldUseTextFallback ? (
            <img
              src={fallbackInstitution.logo_url}
              alt={`${fallbackInstitution.name} - Carregando...`}
              className="w-full h-full object-contain"
              onError={handleImageError}
            />
          ) : fallbackInstitution ? (
            <div
              className="w-full h-full rounded-xl flex items-center justify-center"
              style={{ backgroundColor: fallbackInstitution.primary_color }}
            >
              <span className="text-white font-bold text-xl">
                {fallbackInstitution.name.charAt(0)}
              </span>
            </div>
          ) : (
            <img src={Logo} alt="NeuroIA Lab" className="w-full h-full object-contain" />
          )}
        </div>
      </div>

      {/* Título elegante */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        {fallbackInstitution?.name || 'NeuroIA Lab'}
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
            background: fallbackInstitution?.primary_color
              ? `linear-gradient(to right, ${fallbackInstitution.primary_color}, ${fallbackInstitution.primary_color}CC)`
              : 'linear-gradient(to right, #c39c49, #c39c49CC)'
          }}
        ></div>
      </div>
    </div>
  </div>
  );
};

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