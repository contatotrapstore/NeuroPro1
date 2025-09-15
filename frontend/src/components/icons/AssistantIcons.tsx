import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// PsicoPlano - Mapa/Rota com pontos conectados
export const MapRouteIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2Z" fill={color}/>
    <path d="M6 8C7.10457 8 8 8.89543 8 10C8 11.1046 7.10457 12 6 12C4.89543 12 4 11.1046 4 10C4 8.89543 4.89543 8 6 8Z" fill={color}/>
    <path d="M18 8C19.1046 8 20 8.89543 20 10C20 11.1046 19.1046 12 18 12C16.8954 12 16 11.1046 16 10C16 8.89543 16.8954 8 18 8Z" fill={color}/>
    <path d="M12 16C13.1046 16 14 16.8954 14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16Z" fill={color}/>
    <path d="M12 6L6 10M18 10L12 6M6 10L12 16M18 10L12 16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// NeuroCase - Prancheta médica com check
export const ClipboardCheckIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2V4H16V2C16 1.44772 15.5523 1 15 1H9C8.44772 1 8 1.44772 8 2Z" fill={color}/>
    <path d="M4 4C4 3.44772 4.44772 3 5 3H7V5H17V3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z" stroke={color} strokeWidth="2"/>
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 8H17M7 16H13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Guia Ético - Balança da justiça
export const BalanceScaleIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3V21M12 21H8M12 21H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M7 8L5 12H9L7 8ZM17 8L15 12H19L17 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 8H17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="7" cy="8" r="1" fill={color}/>
    <circle cx="17" cy="8" r="1" fill={color}/>
  </svg>
);

// SessãoMap - Calendário com relógio
export const CalendarClockIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 6C3 5.44772 3.44772 5 4 5H20C20.5523 5 21 5.44772 21 6V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V6Z" stroke={color} strokeWidth="2"/>
    <path d="M7 3V7M17 3V7M3 9H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="14" cy="15" r="3" stroke={color} strokeWidth="1.5"/>
    <path d="M14 13V15L15.5 16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 13H10M7 17H10" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

// ClinReplay - Duas pessoas conversando (simulação)
export const ConversationIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="7" r="3" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="7" r="3" stroke={color} strokeWidth="2"/>
    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H11M18 21V19C18 16.7909 16.2091 15 14 15H13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 12C6.89543 12 6 12.8954 6 14V15H10V14C10 12.8954 9.10457 12 8 12Z" fill={color}/>
    <path d="M16 12C17.1046 12 18 12.8954 18 14V15H14V14C14 12.8954 14.8954 12 16 12Z" fill={color}/>
  </svg>
);

// CognitiMap - Cérebro com engrenagens
export const BrainGearIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3C8.68629 3 6 5.68629 6 9C6 10.5 6.5 11.8 7.3 12.8C7.1 13.2 7 13.6 7 14C7 15.1046 7.89543 16 9 16H15C16.1046 16 17 15.1046 17 14C17 13.6 16.9 13.2 16.7 12.8C17.5 11.8 18 10.5 18 9C18 5.68629 15.3137 3 12 3Z" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="18" r="2" stroke={color} strokeWidth="1.5"/>
    <path d="M15 16V17M15 19V20M13.5 17.5L14 18M16 18L16.5 17.5M16.5 18.5L16 18M14 18L13.5 18.5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    <path d="M9 7H12M9 9H11" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// MindRoute - Bússola/Setas direcionais
export const CompassIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path d="M16.2 7.8L12 12L7.8 16.2L12 12L16.2 7.8Z" fill={color}/>
    <path d="M12 12L7.8 7.8L12 12L16.2 16.2L12 12Z" stroke={color} strokeWidth="1"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// TheraTrack - Gráfico de linha ascendente
export const TrendingUpIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 17L9 11L13 15L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 7H21V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="3" cy="17" r="1.5" fill={color}/>
    <circle cx="9" cy="11" r="1.5" fill={color}/>
    <circle cx="13" cy="15" r="1.5" fill={color}/>
    <circle cx="21" cy="7" r="1.5" fill={color}/>
  </svg>
);

// NeuroLaudo - Documento com selo/certificado
export const DocumentSealIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2H6C5.44772 2 5 2.44772 5 3V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V8L14 2Z" stroke={color} strokeWidth="2"/>
    <path d="M14 2V8H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.5"/>
    <path d="M14.5 16L15.5 17L17.5 15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10H12M7 14H10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// PsicoTest - Clipboard com checklist
export const TestClipboardIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 2V4H16V2C16 1.44772 15.5523 1 15 1H9C8.44772 1 8 1.44772 8 2Z" fill={color}/>
    <path d="M4 4C4 3.44772 4.44772 3 5 3H7V5H17V3H19C19.5523 3 20 3.44772 20 4V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V4Z" stroke={color} strokeWidth="2"/>
    <circle cx="8" cy="9" r="1" fill={color}/>
    <circle cx="8" cy="13" r="1" fill={color}/>
    <circle cx="8" cy="17" r="1" fill={color}/>
    <path d="M11 9H16M11 13H16M11 17H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// TheraFocus - Alvo/Foco com centro
export const TargetIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="1" fill={color}/>
    <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// PsicoBase - Livro aberto com lupa
export const BookSearchIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 3H8C9.10457 3 10 3.89543 10 5V19C10 20.1046 9.10457 21 8 21H2V3Z" stroke={color} strokeWidth="2"/>
    <path d="M22 3H16C14.8954 3 14 3.89543 14 5V19C14 20.1046 14.8954 21 16 21H22V3Z" stroke={color} strokeWidth="2"/>
    <path d="M10 12H14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="17.5" cy="8.5" r="2.5" stroke={color} strokeWidth="1.5"/>
    <path d="M19.5 10.5L21 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// MindHome - Casa com coração
export const HomeHeartIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 12L12 3L21 12V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12Z" stroke={color} strokeWidth="2"/>
    <path d="M9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21" stroke={color} strokeWidth="2"/>
    <path d="M12 8.5C12 7.67157 12.6716 7 13.5 7C14.3284 7 15 7.67157 15 8.5C15 9.32843 14.3284 10 13.5 10C13.2239 10 12.9634 9.93657 12.7322 9.82292C12.2834 10.4971 11.5 11 10.5 11C9.5 11 8.71657 10.4971 8.26777 9.82292C8.03664 9.93657 7.77614 10 7.5 10C6.67157 10 6 9.32843 6 8.5C6 7.67157 6.67157 7 7.5 7C8.32843 7 9 7.67157 9 8.5" stroke={color} strokeWidth="1.5"/>
  </svg>
);

// ClinPrice - Calculadora com cifrão
export const CalculatorDollarIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="2" width="12" height="18" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M6 6H14M6 18H14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="10" r="1" fill={color}/>
    <circle cx="12" cy="10" r="1" fill={color}/>
    <circle cx="8" cy="14" r="1" fill={color}/>
    <circle cx="12" cy="14" r="1" fill={color}/>
    <path d="M19 8V10C19.5523 10 20 10.4477 20 11S19.5523 12 19 12V14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 8H20M19 14H20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// PsicopedIA - Graduação com cérebro
export const GraduationBrainIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 3L2 8L12 13L22 8L12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 10C8 11.5 9.5 13 12 13C14.5 13 16 11.5 16 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// NeuroABA - Peças de quebra-cabeça
export const PuzzleIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 4H9V8C9 9.1 9.9 10 11 10C12.1 10 13 9.1 13 8V4H20V11H16C14.9 11 14 11.9 14 13C14 14.1 14.9 15 16 15H20V20H13V16C13 14.9 12.1 14 11 14C9.9 14 9 14.9 9 16V20H4V4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="7" cy="7" r="1" fill={color}/>
    <circle cx="17" cy="17" r="1" fill={color}/>
  </svg>
);

// TheraCasal - Dois anéis entrelaçados (casamento)
export const RingsIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="9" cy="12" r="5" stroke={color} strokeWidth="2"/>
    <circle cx="15" cy="12" r="5" stroke={color} strokeWidth="2"/>
    <path d="M9 7L15 7M9 17L15 17" stroke={color} strokeWidth="1" strokeOpacity="0.5"/>
  </svg>
);

// Harmonia Sistêmica - Árvore familiar/hierárquica
export const FamilyTreeIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="4" r="2" fill={color}/>
    <circle cx="7" cy="12" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="17" cy="12" r="2" stroke={color} strokeWidth="2"/>
    <circle cx="5" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="15" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="19" cy="20" r="1.5" stroke={color} strokeWidth="1.5"/>
    <path d="M12 6V8M12 8L7 10M12 8L17 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 14V18M17 14V18M5 18V16M9 18V16M15 18V16M19 18V16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Simulador de Paciente de Psicanálise - Cérebro com ondas/conexões psicoanalíticas
export const PsychologyBrainIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Contorno do cérebro */}
    <path d="M6 8C6 5.79086 7.79086 4 10 4C11.1046 4 12.1045 4.44772 12.8284 5.17157C13.4142 4.58579 14.2043 4.2 15 4.2C16.7673 4.2 18.2 5.6327 18.2 7.4C18.2 7.8 18.1 8.2 18 8.5C19.2 9.2 20 10.5 20 12C20 13.8 19 15.4 17.5 16.2C17.8 16.8 18 17.5 18 18.2C18 19.7 16.7 21 15.2 21H8.8C7.3 21 6 19.7 6 18.2V8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Ondas cerebrais */}
    <path d="M8 10C8.5 9.5 9.5 9.5 10 10C10.5 10.5 11.5 10.5 12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 13C8.5 12.5 9.5 12.5 10 13C10.5 13.5 11.5 13.5 12 13C12.5 12.5 13.5 12.5 14 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 16C8.5 15.5 9.5 15.5 10 16C10.5 16.5 11.5 16.5 12 16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Pontos de conexão neural */}
    <circle cx="9.5" cy="9" r="0.8" fill={color}/>
    <circle cx="11.5" cy="11.5" r="0.8" fill={color}/>
    <circle cx="13.5" cy="14.5" r="0.8" fill={color}/>
    <circle cx="15" cy="9.5" r="0.8" fill={color}/>
  </svg>
);

// ====== ÍCONES BÁSICOS PREDEFINIDOS ======

// Cérebro básico
export const BrainIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 8C6 5.79086 7.79086 4 10 4C11.1046 4 12.1045 4.44772 12.8284 5.17157C13.4142 4.58579 14.2043 4.2 15 4.2C16.7673 4.2 18.2 5.6327 18.2 7.4C18.2 7.8 18.1 8.2 18 8.5C19.2 9.2 20 10.5 20 12C20 13.8 19 15.4 17.5 16.2C17.8 16.8 18 17.5 18 18.2C18 19.7 16.7 21 15.2 21H8.8C7.3 21 6 19.7 6 18.2V8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 10L11 12L15 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="11" cy="14" r="1" fill={color}/>
    <circle cx="14" cy="16" r="1" fill={color}/>
  </svg>
);

// Coração
export const HeartIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.99864 7.05 2.99864C5.59096 2.99864 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.54864 7.04097 1.54864 8.5C1.54864 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Livro
export const BookIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 7H16M8 11H16M8 15H12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// Capelo de formatura
export const GraduationCapIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12V16C6 17.1046 8.68629 20 12 20C15.3137 20 18 17.1046 18 16V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 10V13.5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="22" cy="15.5" r="1.5" stroke={color} strokeWidth="2"/>
  </svg>
);

// Microfone
export const MicIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 1C13.1046 1 14 1.89543 14 3V11C14 12.1046 13.1046 13 12 13C10.8954 13 10 12.1046 10 11V3C10 1.89543 10.8954 1 12 1Z" stroke={color} strokeWidth="2"/>
    <path d="M19 10V11C19 15.4183 15.4183 19 11 19H13C17.4183 19 21 15.4183 21 11V10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M5 10V11C5 15.4183 8.58172 19 13 19H11C6.58172 19 3 15.4183 3 11V10" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19V23M8 23H16" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Usuários/Grupo
export const UsersIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="2"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.6227 3.85071 18.1676 4.55232C18.7126 5.25392 19.0097 6.11683 19.0097 7.005C19.0097 7.89317 18.7126 8.75608 18.1676 9.45768C17.6227 10.1593 16.8604 10.6597 16 10.88" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Escudo
export const ShieldIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Estrela
export const StarIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Lâmpada
export const LightBulbIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 21H15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3C8.68629 3 6 5.68629 6 9C6 10.8954 6.89543 12.5684 8.33333 13.6111L9 18H15L15.6667 13.6111C17.1046 12.5684 18 10.8954 18 9C18 5.68629 15.3137 3 12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 18H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Mapeamento de ícones por ID
export const iconMap = {
  'map-route': MapRouteIcon,
  'clipboard-check': ClipboardCheckIcon,
  'balance-scale': BalanceScaleIcon,
  'calendar-clock': CalendarClockIcon,
  'conversation': ConversationIcon,
  'brain-gear': BrainGearIcon,
  'compass': CompassIcon,
  'trending-up': TrendingUpIcon,
  'document-seal': DocumentSealIcon,
  'test-clipboard': TestClipboardIcon,
  'target': TargetIcon,
  'book-search': BookSearchIcon,
  'home-heart': HomeHeartIcon,
  'calculator-dollar': CalculatorDollarIcon,
  'graduation-brain': GraduationBrainIcon,
  'puzzle': PuzzleIcon,
  'rings': RingsIcon,
  'family-tree': FamilyTreeIcon,
  'psychology-brain': PsychologyBrainIcon,
  // Ícones básicos adicionados
  'brain': BrainIcon,
  'heart': HeartIcon,
  'book': BookIcon,
  'graduationCap': GraduationCapIcon,
  'mic': MicIcon,
  'users': UsersIcon,
  'shield': ShieldIcon,
  'star': StarIcon,
  'lightBulb': LightBulbIcon,
} as const;