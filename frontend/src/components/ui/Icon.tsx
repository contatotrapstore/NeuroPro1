import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  Brain,
  Zap,
  Shield,
  Map,
  Users,
  Target,
  BookOpen,
  FileText,
  TestTube,
  BarChart3,
  Home,
  DollarSign,
  Sparkles,
  MessageSquare,
  Settings,
  User,
  Store,
  CreditCard,
  Search,
  Filter,
  ArrowRight,
  Check,
  X,
  Plus,
  Minus,
  Heart,
  Star,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share2,
  Bookmark,
  Flag,
  Trash2,
  Edit3,
  Save,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Menu,
  MoreVertical,
  Grid3X3,
  List,
  Layout,
  Sidebar,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Camera,
  Image,
  Video,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Bluetooth,
  Battery,
  Plug,
  Signal,
  Globe,
  Navigation,
  Compass,
  Route,
  Car,
  Plane,
  Ship,
  Truck,
  Bike,
  User as Walk,
  Rocket,
  Package,
  Gift,
  LogOut,
} from 'lucide-react';
import { iconMap } from '../icons/AssistantIcons';

// Assistant-specific professional icons mapping
const assistantIconMap: Record<string, React.ComponentType<any>> = {
  '📋': FileText,      // PsicoPlano
  '🔍': Target,        // NeuroCase  
  '⚖️': Shield,       // Guia Ético
  '🗺️': Map,          // SessãoMap
  '🎭': Users,         // ClinReplay
  '🧠': Brain,         // CognitiMap
  '🧭': Compass,       // MindRoute
  '📈': BarChart3,     // TheraTrack
  '📄': FileText,      // NeuroLaudo
  '🧪': TestTube,      // PsicoTest
  '🎯': Target,        // TheraFocus
  '📚': BookOpen,      // PsicoBase
  '🏠': Home,          // MindHome
  '💰': DollarSign,    // ClinPrice
};

// UI icons for common use cases
const uiIconMap = {
  // Navigation & Layout
  menu: Menu,
  sidebar: Sidebar,
  grid: Grid3X3,
  list: List,
  layout: Layout,
  home: Home,
  bell: Bell,
  brain: Brain,
  logOut: LogOut,
  
  // Actions
  search: Search,
  filter: Filter,
  add: Plus,
  remove: Minus,
  edit: Edit3,
  save: Save,
  delete: Trash2,
  copy: Copy,
  share: Share2,
  
  // States
  check: Check,
  checkCircle: CheckCircle,
  x: X,
  xCircle: XCircle,
  alert: AlertCircle,
  info: Info,
  help: HelpCircle,
  
  // Arrows & Navigation
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  
  // Commerce
  store: Store,
  card: CreditCard,
  dollar: DollarSign,
  
  // Communication
  message: MessageSquare,
  mail: Mail,
  phone: Phone,
  
  // User & Account
  user: User,
  settings: Settings,
  lock: Lock,
  unlock: Unlock,
  
  // Content
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  
  // Media
  play: Play,
  pause: Pause,
  volume: Volume2,
  volumeOff: VolumeX,
  
  // Special
  sparkles: Sparkles,
  zap: Zap,
  rocket: Rocket,
  package: Package,
  gift: Gift,
  eye: Eye,
  target: Target,
  external: ExternalLink,
  refresh: RefreshCw,
} as const;

type AssistantIconKey = keyof typeof assistantIconMap;
type UIIconKey = keyof typeof uiIconMap;

export interface IconProps {
  name?: UIIconKey | string;
  assistantIcon?: string; // For emoji to SVG conversion
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  animated?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'default' | 'outline' | 'ghost' | 'solid';
  onClick?: () => void;
  children?: React.ReactNode;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

const colorMap = {
  primary: 'text-neuro-primary',
  secondary: 'text-neuro-gray-600',
  success: 'text-neuro-success',
  warning: 'text-neuro-warning',
  error: 'text-neuro-error',
  info: 'text-neuro-info',
};

const variantMap = {
  default: '',
  outline: 'border border-current rounded-lg p-1',
  ghost: 'hover:bg-current/10 rounded-lg p-1 transition-colors',
  solid: 'bg-current/10 text-current rounded-lg p-1',
};

export const Icon: React.FC<IconProps> = ({
  name,
  assistantIcon,
  size = 'md',
  className,
  animated = false,
  color = 'secondary',
  variant = 'default',
  onClick,
  children,
}) => {
  // Determine which icon to render
  let IconComponent: React.ComponentType<any> | null = null;

  if (assistantIcon && assistantIconMap[assistantIcon as AssistantIconKey]) {
    IconComponent = assistantIconMap[assistantIcon as AssistantIconKey];
  } else if (name && iconMap[name as keyof typeof iconMap]) {
    // Check custom assistant icons first
    IconComponent = iconMap[name as keyof typeof iconMap];
  } else if (name && uiIconMap[name as UIIconKey]) {
    // Then check UI icons
    IconComponent = uiIconMap[name as UIIconKey];
  }

  if (!IconComponent && !children) {
    return null;
  }

  const iconClasses = cn(
    sizeMap[size],
    colorMap[color],
    variantMap[variant],
    onClick && 'cursor-pointer',
    className
  );

  const animationProps = animated ? {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 }
  } : {};

  const IconWrapper = animated ? motion.div : 'div';

  return (
    <IconWrapper
      className={iconClasses}
      onClick={onClick}
      {...animationProps}
    >
      {IconComponent ? (
        <IconComponent className="w-full h-full" />
      ) : (
        children
      )}
    </IconWrapper>
  );
};

// Professional assistant icons with proper SVG components
export const AssistantIcons = {
  PsicoPlano: FileText,      // Therapeutic Route Formulator
  NeuroCase: Target,         // Clinical Case Reviewer
  'Guia Ético': Shield,      // Professional Ethics Guide
  SessãoMap: Map,            // Session Structure Formulator
  ClinReplay: Users,         // Session Trainer (AI Patient)
  CognitiMap: Brain,         // Cognitive Restructuring Builder
  MindRoute: Compass,        // Psychological Approaches Guide
  TheraTrack: BarChart3,     // Therapeutic Evolution Evaluator
  NeuroLaudo: FileText,      // Psychological Report Elaborator
  PsicoTest: TestTube,       // Psychological Tests Consultant
  TheraFocus: Target,        // Specific Disorder Interventions Organizer
  PsicoBase: BookOpen,       // Evidence-Based Clinical Strategies
  MindHome: Home,            // Therapeutic Home Activities Elaborator
  ClinPrice: DollarSign,     // Clinical Session Cost Evaluator
};

export default Icon;