import React from 'react';
import { Icon } from '../ui/Icon';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon, 
  color = '#2D5A1F',
  onClick
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'arrowUp';
      case 'down': return 'arrowDown';
      default: return 'minus';
    }
  };

  return (
    <div 
      className={`card-hover p-6 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            {title}
          </h3>
          <div className="text-2xl font-bold text-gray-900">
            {value}
          </div>
        </div>
        
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Icon name={icon as any} className="w-6 h-6 text-white" />
        </div>
      </div>

      {change && (
        <div className="flex items-center space-x-1">
          <Icon 
            name={getTrendIcon() as any} 
            className={`w-4 h-4 ${getTrendColor()}`}
          />
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {change}
          </span>
          <span className="text-sm text-gray-500">vs último período</span>
        </div>
      )}
    </div>
  );
};

interface DashboardStatsProps {
  stats: {
    activeSubscriptions: number;
    subscribedAssistants: number;
    availableAssistants: number;
    conversationsCount: number;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statsData = [
    {
      title: 'Assinaturas Ativas',
      value: stats.activeSubscriptions,
      icon: 'checkCircle',
      color: '#10B981',
    },
    {
      title: 'Seus Assistentes',
      value: stats.subscribedAssistants,
      icon: 'brain',
      color: '#0E1E03',
    },
    {
      title: 'Outros Assistentes',
      value: stats.availableAssistants,
      icon: 'sparkles',
      color: '#3B82F6',
    },
    {
      title: 'Conversas Este Mês',
      value: stats.conversationsCount,
      icon: 'message',
      color: '#8B5CF6',
      onClick: () => window.location.href = '/chat'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <StatCard
          key={stat.title}
          {...stat}
        />
      ))}
    </div>
  );
};