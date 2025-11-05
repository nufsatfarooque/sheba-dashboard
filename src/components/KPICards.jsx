import React from 'react';
import { Users, AlertTriangle, TrendingUp, Target } from 'lucide-react';

const KPICards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Customers',
      value: stats.total_customers?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'At Risk',
      value: stats.at_risk_count?.toLocaleString() || '0',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Critical Risk',
      value: stats.critical_risk_count?.toLocaleString() || '0',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Retention Rate',
      value: `${((stats.retention_rate || 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;