import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataChartProps<T> {
  data: T[];
  xAxisKey: keyof T;
  barDataKey: keyof T;
  fill: string;
}

const DataChart = <T extends Record<string, any>>({ data, xAxisKey, barDataKey, fill }: DataChartProps<T>) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey as string} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={barDataKey as string} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DataChart;
