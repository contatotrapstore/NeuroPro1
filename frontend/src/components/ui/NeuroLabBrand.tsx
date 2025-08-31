import React from 'react';
import { NeuroLabIcon, NeuroLabLogo } from '../icons/NeuroLabLogo';

interface NeuroLabBrandProps {
  variant?: 'icon' | 'logo' | 'full';
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  color?: string;
  className?: string;
  showAnimation?: boolean;
}

export const NeuroLabBrand: React.FC<NeuroLabBrandProps> = ({
  variant = 'logo',
  size = 'medium',
  color = '#2D5A1F',
  className = '',
  showAnimation = false
}) => {
  const sizeMap = {
    small: { icon: 20, logo: 80 },
    medium: { icon: 32, logo: 120 },
    large: { icon: 48, logo: 160 },
    'extra-large': { icon: 64, logo: 200 }
  };

  const baseClassName = showAnimation ? 'animate-pulse' : '';
  const fullClassName = `${baseClassName} ${className}`;

  if (variant === 'icon') {
    return (
      <NeuroLabIcon
        color={color}
        size={sizeMap[size].icon}
        className={fullClassName}
      />
    );
  }

  if (variant === 'logo') {
    return (
      <NeuroLabLogo
        color={color}
        size={sizeMap[size].logo}
        variant="icon-only"
        className={fullClassName}
      />
    );
  }

  return (
    <NeuroLabLogo
      color={color}
      size={sizeMap[size].logo}
      variant="full"
      className={fullClassName}
    />
  );
};

// Variações pré-configuradas para contextos específicos
export const NeuroLabHeader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <NeuroLabBrand
    variant="logo"
    size="medium"
    className={className}
  />
);

export const NeuroLabAuth: React.FC<{ className?: string }> = ({ className = '' }) => (
  <NeuroLabBrand
    variant="icon"
    size="large"
    color="white"
    className={className}
  />
);

export const NeuroLabSidebar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <NeuroLabBrand
    variant="logo"
    size="small"
    className={className}
  />
);

export const NeuroLabWelcome: React.FC<{ className?: string }> = ({ className = '' }) => (
  <NeuroLabBrand
    variant="icon"
    size="extra-large"
    showAnimation={true}
    className={className}
  />
);

export default NeuroLabBrand;