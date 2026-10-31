import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMonthShort } from '../lib/dates';
import { RATINGS } from '../lib/lookup';
import type { RatingCount } from '../lib/stats';

const axis = { fontSize: 12, fill: '#64748b' };

export function RatingPie({ data }: { data: RatingCount[] }) {
  const shown = data.filter((d) => d.count > 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={shown} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2} isAnimationActive={false}>
          {shown.map((d) => (
            <Cell key={d.rating} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function RatingBars({ data }: { data: RatingCount[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v: number) => [v, 'Evaluaciones']} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.rating} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Stacked bars of ratings per month. */
export function RatingEvolution({ data }: { data: Record<string, number | string>[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" tickFormatter={(m: string) => formatMonthShort(m)} tick={axis} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={(m: string) => formatMonthShort(m)} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {RATINGS.map((r) => (
          <Bar key={r.id} dataKey={r.id} name={r.label} stackId="a" fill={r.color} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
}

export function GradeLines({
  data,
  series,
  xKey = 'period',
  height = 240,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tickFormatter={(m: string) => (/^\d{4}-\d{2}$/.test(m) ? formatMonthShort(m) : m)} tick={axis} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 10]} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={(m: string) => (/^\d{4}-\d{2}$/.test(m) ? formatMonthShort(m) : m)} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2.5} dot={{ r: 4 }} connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function GroupedBars({
  data,
  series,
  xKey,
  domain,
  height = 260,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  xKey: string;
  domain?: [number, number];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={axis} tickLine={false} axisLine={false} interval={0} />
        <YAxis domain={domain} allowDecimals={!!domain} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({ data, color = '#2f7f82', valueLabel }: { data: { name: string; value: number }[]; color?: string; valueLabel: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={130} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v: number) => [v, valueLabel]} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
