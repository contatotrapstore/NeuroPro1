import React from 'react';
import { iconMap } from '../icons/AssistantIcons';

type IconType = keyof typeof iconMap;

interface AssistantIconProps {
  iconType: string | IconType;
  color?: string;
  size?: number;
  className?: string;
}

export const AssistantIcon: React.FC<AssistantIconProps> = ({ 
  iconType, 
  color = 'currentColor', 
  size = 24, 
  className = '' 
}) => {
  console.log('AssistantIcon rendering:', { iconType, availableIcons: Object.keys(iconMap) });
  
  // Usar o iconMap diretamente
  const IconComponent = iconMap[iconType as IconType];
  
  if (IconComponent) {
    console.log('✅ Ícone SVG encontrado:', iconType);
    return <IconComponent color={color} size={size} className={className} />;
  }
  
  console.log('⚠️ Ícone SVG não encontrado, usando fallback para:', iconType);
  
  // Fallback melhorado - verificar se é emoji primeiro
  if (iconType && /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(iconType)) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ 
          fontSize: `${size}px`, 
          lineHeight: 1,
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {iconType}
      </span>
    );
  }
  
  // Fallback final - ícone padrão profissional
  return (
    <div 
      className={`inline-flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      style={{ 
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke={color || '#666'} strokeWidth="2"/>
        <circle cx="9" cy="9" r="1.5" fill={color || '#666'}/>
        <circle cx="15" cy="9" r="1.5" fill={color || '#666'}/>
        <path d="M8 15C8 15 10 17 12 17C14 17 16 15 16 15" stroke={color || '#666'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  );
};

// Hook para obter o ícone correto baseado no assistant
export const useAssistantIcon = (assistant: { icon: string; color_theme: string }) => {
  const getIconColor = (colorTheme: string) => {
    // Se color_theme for uma cor CSS válida, usa ela
    if (colorTheme && colorTheme.startsWith('#')) {
      return colorTheme;
    }
    
    // Fallback para cor padrão
    return '#2D5A1F'; // neuro-primary
  };

  return {
    iconType: assistant.icon,
    color: getIconColor(assistant.color_theme),
  };
};