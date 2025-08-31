import React from 'react';

interface NeuroLabLogoProps {
  className?: string;
  color?: string;
  size?: number;
  variant?: 'full' | 'icon-only' | 'text-only';
}

// Ícone principal do NeuroIA Lab - Cérebro + IA + Neurônios
export const NeuroLabIcon: React.FC<NeuroLabLogoProps> = ({ 
  className = '', 
  color = '#2D5A1F', 
  size = 24 
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    {/* Cérebro principal */}
    <path 
      d="M16 4C20.5 4 24 7.5 24 12C24 13.5 23.7 14.9 23.2 16.2C25.8 17.1 27.5 19.5 27.5 22.5C27.5 26.1 24.6 29 21 29C20.2 29 19.4 28.8 18.7 28.5C17.9 28.8 17 29 16 29C15 29 14.1 28.8 13.3 28.5C12.6 28.8 11.8 29 11 29C7.4 29 4.5 26.1 4.5 22.5C4.5 19.5 6.2 17.1 8.8 16.2C8.3 14.9 8 13.5 8 12C8 7.5 11.5 4 16 4Z" 
      stroke={color} 
      strokeWidth="1.5" 
      fill={`${color}15`}
    />
    
    {/* Estrutura cerebral interna */}
    <path 
      d="M12 10C12 10 14 8 16 8C18 8 20 10 20 10" 
      stroke={color} 
      strokeWidth="1.2" 
      strokeLinecap="round"
    />
    <path 
      d="M10 14C10 14 12 12 16 12C20 12 22 14 22 14" 
      stroke={color} 
      strokeWidth="1.2" 
      strokeLinecap="round"
    />
    
    {/* Neurônios/conexões */}
    <circle cx="13" cy="11" r="1.5" fill={color} opacity="0.7"/>
    <circle cx="19" cy="11" r="1.5" fill={color} opacity="0.7"/>
    <circle cx="16" cy="15" r="1.5" fill={color} opacity="0.7"/>
    
    {/* Conexões neurais */}
    <path 
      d="M13 11L16 15M19 11L16 15M13 11L19 11" 
      stroke={color} 
      strokeWidth="1" 
      opacity="0.5"
    />
    
    {/* Elemento IA - Chip/circuito */}
    <rect 
      x="14" 
      y="18" 
      width="4" 
      height="3" 
      rx="1" 
      stroke={color} 
      strokeWidth="1" 
      fill="none"
    />
    <path 
      d="M15 19.5H17M14.5 20.5H17.5" 
      stroke={color} 
      strokeWidth="0.8" 
      strokeLinecap="round"
    />
    
    {/* Pulsos/sinais */}
    <circle cx="10" cy="18" r="0.8" fill={color} opacity="0.4">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="18" r="0.8" fill={color} opacity="0.4">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="0.7s" repeatCount="indefinite"/>
    </circle>
    <circle cx="16" cy="6" r="0.8" fill={color} opacity="0.4">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="1.3s" repeatCount="indefinite"/>
    </circle>
  </svg>
);

// Logo completo com texto
export const NeuroLabLogo: React.FC<NeuroLabLogoProps> = ({ 
  className = '', 
  color = '#2D5A1F', 
  size = 120,
  variant = 'full'
}) => {
  if (variant === 'icon-only') {
    return <NeuroLabIcon className={className} color={color} size={size} />;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <NeuroLabIcon color={color} size={Math.round(size * 0.4)} />
      {variant !== 'text-only' && (
        <div className="flex flex-col">
          <span 
            className="font-bold leading-tight"
            style={{ 
              color, 
              fontSize: Math.round(size * 0.25) + 'px' 
            }}
          >
            NeuroIA
          </span>
          <span 
            className="font-medium leading-tight opacity-70"
            style={{ 
              color, 
              fontSize: Math.round(size * 0.15) + 'px' 
            }}
          >
            Lab
          </span>
        </div>
      )}
    </div>
  );
};

// Variações do ícone para diferentes contextos
export const NeuroLabIconSmall: React.FC<Omit<NeuroLabLogoProps, 'size'>> = (props) => (
  <NeuroLabIcon {...props} size={20} />
);

export const NeuroLabIconMedium: React.FC<Omit<NeuroLabLogoProps, 'size'>> = (props) => (
  <NeuroLabIcon {...props} size={32} />
);

export const NeuroLabIconLarge: React.FC<Omit<NeuroLabLogoProps, 'size'>> = (props) => (
  <NeuroLabIcon {...props} size={48} />
);

// Favicon/App Icon version (simplified for small sizes)
export const NeuroLabFavicon: React.FC<NeuroLabLogoProps> = ({ 
  className = '', 
  color = '#2D5A1F', 
  size = 16 
}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
    {/* Simplified brain shape */}
    <path 
      d="M8 2C10.5 2 12.5 4 12.5 6.5C12.5 7.2 12.3 7.8 12 8.3C13 8.6 13.7 9.5 13.7 10.7C13.7 12.2 12.5 13.4 11 13.4C10.6 13.4 10.3 13.3 10 13.1C9.4 13.3 8.7 13.4 8 13.4C7.3 13.4 6.6 13.3 6 13.1C5.7 13.3 5.4 13.4 5 13.4C3.5 13.4 2.3 12.2 2.3 10.7C2.3 9.5 3 8.6 4 8.3C3.7 7.8 3.5 7.2 3.5 6.5C3.5 4 5.5 2 8 2Z" 
      fill={color}
    />
    
    {/* Simple neural connections */}
    <circle cx="6" cy="6" r="0.7" fill="white" opacity="0.8"/>
    <circle cx="10" cy="6" r="0.7" fill="white" opacity="0.8"/>
    <circle cx="8" cy="8.5" r="0.7" fill="white" opacity="0.8"/>
    
    {/* AI chip indicator */}
    <rect x="7" y="10" width="2" height="1.5" rx="0.3" fill="white" opacity="0.9"/>
  </svg>
);

export default NeuroLabLogo;