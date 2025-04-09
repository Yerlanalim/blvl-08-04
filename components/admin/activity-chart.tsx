'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

// Sample data for the chart
// In a real application, you would fetch this from your API
const generateMockData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      name: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      users: Math.floor(Math.random() * 50) + 10,
      levels: Math.floor(Math.random() * 20) + 5,
    });
  }
  
  return data;
};

export function ActivityChart() {
  const [data, setData] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="w-full">
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{ 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}
          />
          <Bar
            dataKey="users"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="Пользователи"
          />
          <Bar
            dataKey="levels"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="Прогресс"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 