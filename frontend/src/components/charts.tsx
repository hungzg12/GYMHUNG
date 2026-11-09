'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from 'recharts';
export interface ChartPoint {
  name: string;
  [key: string]: string | number | null;
}
export function TrendChart({
  data,
  series = [{ key: 'value', name: 'Giá trị', color: '#c1f56b' }],
  kind = 'area',
  label,
}: {
  data: ChartPoint[];
  series?: { key: string; name: string; color: string }[];
  kind?: 'area' | 'bar' | 'line';
  label: string;
}) {
  const axes = (
    <>
      <CartesianGrid stroke="#30322e" vertical={false} strokeDasharray="3 5" />
      <XAxis
        dataKey="name"
        tickLine={false}
        axisLine={false}
        tick={{ fill: '#92988c', fontSize: 12 }}
        minTickGap={20}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={{ fill: '#92988c', fontSize: 12 }}
        width={42}
      />
      <Tooltip
        contentStyle={{
          background: '#22251f',
          border: '1px solid #42473a',
          borderRadius: 8,
          color: '#eef0e9',
        }}
        labelStyle={{ color: '#bdc5b6' }}
        formatter={(value) =>
          new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
            Number(value),
          )
        }
      />
      {series.length > 1 && <Legend />}
    </>
  );
  return (
    <figure className="chart-container" aria-label={label}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 600, height: 240 }}
      >
        {kind === 'bar' ? (
          <BarChart data={data} barSize={19}>
            {axes}
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        ) : kind === 'line' ? (
          <LineChart data={data}>
            {axes}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={data}>
            {axes}
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.08}
                strokeWidth={2.5}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
