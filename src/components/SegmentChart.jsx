import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ExternalLink } from 'lucide-react';

const SegmentChart = ({ segments }) => {
  const navigate = useNavigate();

  // Transform segment data for Recharts
  const chartData = Object.entries(segments || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = {
    'Price-Sensitive': '#3B82F6',
    'High-Value': '#10B981',
    'Quality-Focused': '#F59E0B',
    'Loyal': '#8B5CF6',
    'Occasional': '#FCD34D'
  };

  const handleSegmentClick = (segmentName) => {
    navigate(`/segments/${encodeURIComponent(segmentName)}`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Customer Segments</h2>
        <button
          onClick={() => navigate('/segments')}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          View All <ExternalLink size={14} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={(data) => handleSegmentClick(data.name)}
            style={{ cursor: 'pointer' }}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name] || COLORS[Object.keys(COLORS)[index % Object.keys(COLORS).length]]}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            onClick={(data) => handleSegmentClick(data.value)}
            wrapperStyle={{ cursor: 'pointer' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">Click on segments to view details</p>
    </div>
  );
};

export default SegmentChart;