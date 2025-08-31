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
  // Usar o iconMap diretamente sem switch statement
  const IconComponent = iconMap[iconType as IconType];
  
  if (IconComponent) {
    return <IconComponent color={color} size={size} className={className} />;
  }
  
  // Fallback melhorado - verificar se é emoji primeiro
  if (iconType && iconType.length <= 2 && /\p{Emoji}/u.test(iconType)) {
    return (
      <span 
        className={`inline-flex items-center justify-center ${className}`}
        style={{ 
          fontSize: `${size}px`, 
          color,
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        {iconType}
      </span>
    );
  }
  
  // Fallback para ícones não encontrados - usar ícone padrão
  return (
    <span 
      className={`inline-flex items-center justify-center bg-gray-200 rounded ${className}`}
      style={{ 
        fontSize: `${Math.round(size * 0.6)}px`, 
        color: '#666',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      ?
    </span>
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