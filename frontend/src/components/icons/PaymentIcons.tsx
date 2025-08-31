import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// PIX - Brazilian instant payment system logo (official design)
export const PixIcon: React.FC<IconProps> = ({ className = '', color = '#32BCAD', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* PIX Official Logo - Formato X estilizado */}
    <g transform="translate(2, 2)">
      {/* Background circle */}
      <circle cx="10" cy="10" r="10" fill="white" stroke="#32BCAD" strokeWidth="0.5"/>
      
      {/* PIX X shape */}
      <g fill="#32BCAD">
        {/* Top left triangle */}
        <path d="M4 4 L10 10 L8.5 10 L4 5.5 Z"/>
        
        {/* Top right triangle */}
        <path d="M16 4 L10 10 L11.5 10 L16 5.5 Z"/>
        
        {/* Bottom left triangle */}
        <path d="M4 16 L10 10 L8.5 10 L4 14.5 Z"/>
        
        {/* Bottom right triangle */}
        <path d="M16 16 L10 10 L11.5 10 L16 14.5 Z"/>
        
        {/* Center square */}
        <rect x="8.5" y="8.5" width="3" height="3" rx="0.5"/>
      </g>
      
      {/* PIX text */}
      <text x="10" y="18" textAnchor="middle" fontSize="3" fill="#32BCAD" fontWeight="bold" fontFamily="Arial, sans-serif">PIX</text>
    </g>
  </svg>
);

// Boleto - Brazilian bank slip with barcode
export const BoletoIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Document outline */}
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none"/>
    
    {/* Header section */}
    <path d="M3 8H21" stroke={color} strokeWidth="1.5"/>
    
    {/* Barcode lines */}
    <path d="M5 11V13M7 10V14M9 11V13M11 10V14M13 11V13M15 10V14M17 11V13M19 10V14" 
          stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    
    {/* Info lines */}
    <path d="M5 16H12M5 18H15" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    
    {/* Bank symbol */}
    <circle cx="17" cy="6" r="1.5" stroke={color} strokeWidth="1" fill="none"/>
    <path d="M16 6H18" stroke={color} strokeWidth="0.8"/>
  </svg>
);

// Credit Card - Professional credit card icon
export const CreditCardIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Card outline */}
    <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    
    {/* Magnetic stripe */}
    <rect x="2" y="9" width="20" height="2" fill={color}/>
    
    {/* Chip */}
    <rect x="4" y="13" width="3" height="2" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    
    {/* Card number dots */}
    <circle cx="9" cy="14" r="0.5" fill={color}/>
    <circle cx="11" cy="14" r="0.5" fill={color}/>
    <circle cx="13" cy="14" r="0.5" fill={color}/>
    <circle cx="15" cy="14" r="0.5" fill={color}/>
    
    {/* Security features */}
    <path d="M17 16H20" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

// Debit Card - Similar to credit but with slight visual difference
export const DebitCardIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Card outline */}
    <rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    
    {/* Different magnetic stripe pattern for debit */}
    <rect x="2" y="8" width="20" height="1" fill={color}/>
    <rect x="2" y="10" width="20" height="1" fill={color}/>
    
    {/* Chip */}
    <rect x="4" y="13" width="3" height="2" rx="0.5" stroke={color} strokeWidth="1" fill="none"/>
    
    {/* Card number dots */}
    <circle cx="9" cy="14" r="0.5" fill={color}/>
    <circle cx="11" cy="14" r="0.5" fill={color}/>
    <circle cx="13" cy="14" r="0.5" fill={color}/>
    <circle cx="15" cy="14" r="0.5" fill={color}/>
    
    {/* Debit indicator */}
    <text x="18.5" y="16.5" textAnchor="middle" fontSize="4" fill={color} fontWeight="bold">D</text>
  </svg>
);

// Bank Transfer icon
export const BankTransferIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Bank building */}
    <path d="M3 21V11L12 4L21 11V21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 4V21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Bank columns */}
    <path d="M6 12V18M9 12V18M15 12V18M18 12V18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    
    {/* Transfer arrows */}
    <path d="M2 8L6 8M6 8L4 6M6 8L4 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 8L18 8M18 8L20 6M18 8L20 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Digital Wallet icon
export const DigitalWalletIcon: React.FC<IconProps> = ({ className = '', color = 'currentColor', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Phone outline */}
    <rect x="6" y="2" width="12" height="20" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    
    {/* Screen */}
    <rect x="8" y="5" width="8" height="12" rx="1" stroke={color} strokeWidth="1" fill="none"/>
    
    {/* Wallet/Payment interface */}
    <circle cx="12" cy="11" r="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M10 9L14 13M14 9L10 13" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    
    {/* Home button */}
    <circle cx="12" cy="19" r="1" fill={color}/>
    
    {/* Signal/connectivity indicator */}
    <path d="M9 7H11M13 7H15" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

export const paymentIconMap = {
  'credit-card': CreditCardIcon,
  'debit-card': DebitCardIcon,
  'pix': PixIcon,
  'boleto': BoletoIcon,
  'bank-transfer': BankTransferIcon,
  'digital-wallet': DigitalWalletIcon,
} as const;

export type PaymentIconType = keyof typeof paymentIconMap;