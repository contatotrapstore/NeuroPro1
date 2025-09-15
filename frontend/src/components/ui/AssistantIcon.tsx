import React from 'react';
import { iconMap } from '../icons/AssistantIcons';

type IconType = keyof typeof iconMap;

interface AssistantIconProps {
  iconType: string | IconType;
  color?: string;
  size?: number;
  className?: string;
}

// Mapeamento de IDs de assistentes para ícones
const assistantIdToIcon: Record<string, string> = {
  'psicoplano': 'map-route',
  'neurocase': 'clipboard-check',
  'guia-etico': 'balance-scale',
  'sessaomap': 'calendar-clock',
  'clinreplay': 'conversation',
  'cognitimap': 'brain-gear',
  'mindroute': 'compass',
  'theratrack': 'trending-up',
  'neurolaudo': 'document-seal',
  'psicotest': 'test-clipboard',
  'therafocus': 'target',
  'psicobase': 'book-search',
  'mindhome': 'home-heart',
  'clinprice': 'calculator-dollar',
  'harmonia-sistemica': 'family-tree',
  'neuroaba': 'graduation-brain',
  'psicopedia': 'puzzle',
  'theracasal': 'rings'
};

// Mapeamento adicional para ícones legados e aliases
const legacyIconMapping: Record<string, string> = {
  // Aliases comuns
  'cerebro': 'brain',
  'coração': 'heart',
  'coracao': 'heart',
  'livro': 'book',
  'formatura': 'graduationCap',
  'microfone': 'mic',
  'grupo': 'users',
  'pessoas': 'users',
  'escudo': 'shield',
  'estrela': 'star',
  'lampada': 'lightBulb',
  'lâmpada': 'lightBulb',
  'ideia': 'lightBulb',

  // Variações em inglês
  'brain-circuit': 'brain-gear',
  'psychology': 'psychology-brain',
  'psychoanalysis': 'psychology-brain',
  'neuropsychology': 'brain-gear',
  'cognitive': 'brain-gear',
  'therapy': 'conversation',
  'counseling': 'conversation',
  'assessment': 'test-clipboard',
  'evaluation': 'test-clipboard',
  'diagnosis': 'document-seal',
  'treatment': 'target',
  'intervention': 'target',
  'family': 'family-tree',
  'couple': 'rings',
  'relationships': 'rings',
  'home': 'home-heart',
  'wellness': 'heart',
  'health': 'heart',
  'education': 'graduationCap',
  'learning': 'book',
  'development': 'trending-up',
  'progress': 'trending-up',
  'growth': 'trending-up',
  'planning': 'map-route',
  'strategy': 'map-route',
  'consultation': 'conversation',
  'session': 'calendar-clock',
  'schedule': 'calendar-clock',
  'appointment': 'calendar-clock',
  'report': 'document-seal',
  'documentation': 'document-seal',
  'analysis': 'brain-gear',
  'research': 'book-search',
  'study': 'book-search',
  'protection': 'shield',
  'safety': 'shield',
  'excellence': 'star',
  'quality': 'star',
  'innovation': 'lightBulb',
  'creativity': 'lightBulb',
  'communication': 'mic',
  'voice': 'mic',
  'speaking': 'mic',
  'community': 'users',
  'team': 'users',
  'collaboration': 'users'
};

export const AssistantIcon: React.FC<AssistantIconProps> = ({
  iconType,
  color = 'currentColor',
  size = 24,
  className = ''
}) => {
  console.log('AssistantIcon rendering:', { iconType, availableIcons: Object.keys(iconMap) });

  // Etapa 1: Se o iconType é um ID de assistente, converter para o ícone correto
  let finalIconType = iconType;
  if (assistantIdToIcon[iconType]) {
    finalIconType = assistantIdToIcon[iconType];
    console.log(`🔄 Convertendo ID '${iconType}' para ícone '${finalIconType}'`);
  }

  // Etapa 2: Se não encontrou, verificar mapeamento de ícones legados
  if (!iconMap[finalIconType as IconType] && legacyIconMapping[iconType]) {
    finalIconType = legacyIconMapping[iconType];
    console.log(`🔄 Mapeando ícone legado '${iconType}' para '${finalIconType}'`);
  }

  // Etapa 3: Usar o iconMap diretamente
  const IconComponent = iconMap[finalIconType as IconType];

  if (IconComponent) {
    console.log('✅ Ícone SVG encontrado:', finalIconType);
    return <IconComponent color={color} size={size} className={className} />;
  }

  console.log('⚠️ Ícone SVG não encontrado, usando fallback para:', finalIconType);
  
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