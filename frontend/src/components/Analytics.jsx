import { useEffect, useState } from 'react';
import api from '../services/api';
import { Alert } from './ui';

const RANGES = [7, 30, 90];

// Round the axis maximum up to 1/2/5 x 10^n so ticks land on clean numbers
const niceTicks = (maxValue, count = 4) => {
  if (maxValue <= 0) return [0, 1];
  const rawStep = maxValue / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep);
  const niceStep = Math.max(1, step);
  const top = Math.ceil(maxValue / niceStep) * niceStep;
  const ticks = [];
  for (let value = 0; value <= top; value += niceStep) ticks.push(value);
  return ticks;
};

const formatDay = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const formatHour = (hour) => {
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
};

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

// Vertical columns from a shared baseline with a hover/focus tooltip
const ColumnChart = ({ data, labelEvery, ariaLabel, unit }) => {
  const [active, setActive] = useState(null);
  const maxValue = Math.max(0, ...data.map((item) => item.value));
  const ticks = niceTicks(maxValue);
  const top = ticks[ticks.length - 1];

  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative h-40 pl-8 sm:h-52">
        <div className="pointer-events-none absolute inset-y-0 left-8 right-0 flex flex-col justify-between" aria-hidden="true">
          {ticks.slice().reverse().map((tick) => (
            <div key={tick} className="relative h-0 border-t border-slate-100">
              <span className="absolute -left-8 -top-2 w-6 text-right text-[11px] tabular-nums text-slate-400">{tick}</span>
            </div>
          ))}
        </div>

        <div className="relative flex h-full items-end gap-0.5">
          {data.map((item, index) => (
            <div
              key={item.key}
              className={`relative flex h-full min-w-0 flex-1 items-end justify-center rounded-t outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${active === index ? 'bg-brand-50' : ''}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              tabIndex={0}
              aria-label={`${item.tooltipLabel}: ${item.value} ${unit}`}
            >
              <div
                className={`w-full max-w-[24px] rounded-t ${active === index ? 'bg-brand-700' : 'bg-brand-500'}`}
                style={{ height: `${(item.value / top) * 100}%` }}
              />
              {active === index && (
                <div className={`pointer-events-none absolute top-0 z-10 whitespace-nowrap rounded-md bg-ink px-2.5 py-2 text-xs text-white shadow-lg ${index > data.length / 2 ? 'right-1/2' : 'left-1/2'}`}>
                  <div><strong>{item.value}</strong> {unit}</div>
                  <div className="text-slate-300">{item.tooltipLabel}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex gap-0.5 pl-8" aria-hidden="true">
        {data.map((item, index) => (
          <span key={item.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[11px] text-slate-400">
            {index % labelEvery === 0 ? item.label : ''}
          </span>
        ))}
      </div>
    </div>
  );
};

// Labeled horizontal bars for a short ranked/categorical list
const BarList = ({ items, emptyText }) => {
  const maxValue = Math.max(0, ...items.map((item) => item.value));
  if (!items.length || maxValue === 0) return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(80px,30%)_1fr_auto] items-center gap-3 text-sm" title={`${item.label}: ${item.value}`}>
          <span className="truncate text-slate-700">{item.label}</span>
          <span className="h-4">
            <span className="block h-full min-w-[2px] rounded-r bg-brand-500" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </span>
          <span className="min-w-[2ch] text-right font-semibold tabular-nums text-ink">{item.value}</span>
        </li>
      ))}
    </ul>
  );
};

const ChartCard = ({ title, wide, children }) => (
  <div className={`card p-5 sm:p-6 ${wide ? 'lg:col-span-2' : ''}`}>
    <h3 className="mb-4 text-base font-semibold">{title}</h3>
    {children}
  </div>
);

const Analytics = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    api.get('/dashboard/analytics', { params: { days, tz } })
      .then((response) => { if (mounted) setData(response.data); })
      .catch((err) => { if (mounted) setError(err.response?.data?.message || 'Could not load analytics'); })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [days]);

  const tiles = data ? [
    { label: 'Check-ins', value: data.totals.checkIns },
    { label: 'Unique visitors', value: data.totals.uniqueVisitors },
    { label: 'Appointment requests', value: data.totals.appointments },
    { label: 'Approval rate', value: data.totals.approvalRate === null ? '—' : `${data.totals.approvalRate}%` },
    { label: 'Avg. visit length', value: formatMinutes(data.totals.averageVisitMinutes) },
  ] : [];

  return (
    <section className="space-y-4 pt-2" aria-labelledby="analytics-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="analytics-title" className="text-lg font-bold">Analytics</h2>
          <p className="text-sm text-slate-500">Visitor activity for your organization{data ? ` (${data.timezone})` : ''}</p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card" role="group" aria-label="Time range">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${range === days ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-pressed={range === days}
              onClick={() => setDays(range)}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      <Alert>{error}</Alert>
      {loading && !data && <p className="py-8 text-center text-sm text-slate-500">Loading analytics...</p>}

      {data && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {tiles.map((tile) => (
              <div className="card p-4" key={tile.label}>
                <p className="text-xs font-medium text-slate-500">{tile.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-ink">{tile.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Check-ins per day" wide>
              <ColumnChart
                ariaLabel={`Check-ins per day over the last ${data.days} days`}
                unit="check-ins"
                labelEvery={data.days <= 7 ? 1 : data.days <= 30 ? 5 : 15}
                data={data.visitsPerDay.map((day) => ({
                  key: day.date,
                  value: day.checkIns,
                  label: formatDay(day.date),
                  tooltipLabel: `${formatDay(day.date)} · ${day.visitors} visitor${day.visitors === 1 ? '' : 's'}`,
                }))}
              />
            </ChartCard>

            <ChartCard title="Busiest hours" wide>
              <ColumnChart
                ariaLabel="Check-ins by hour of day"
                unit="check-ins"
                labelEvery={3}
                data={data.checkInsByHour.map((hour) => ({
                  key: hour.hour,
                  value: hour.checkIns,
                  label: formatHour(hour.hour),
                  tooltipLabel: `${formatHour(hour.hour)} – ${formatHour((hour.hour + 1) % 24)}`,
                }))}
              />
            </ChartCard>

            <ChartCard title="Appointments by status">
              <BarList
                emptyText="No appointments in this period."
                items={data.appointmentStatus.map((item) => ({
                  label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                  value: item.count,
                }))}
              />
            </ChartCard>

            <ChartCard title="Top hosts">
              <BarList
                emptyText="No hosted appointments in this period."
                items={data.topHosts.map((host) => ({ label: host.name, value: host.count }))}
              />
            </ChartCard>
          </div>

          <details className="card group">
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-brand-600 sm:px-6">
              <span className="mr-1 inline-block transition-transform group-open:rotate-90">&#9656;</span> View daily data as a table
            </summary>
            <div className="table-wrap border-t border-slate-200">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Check-ins</th><th>Unique visitors</th></tr></thead>
                <tbody>
                  {data.visitsPerDay.map((day) => (
                    <tr key={day.date}><td>{formatDay(day.date)}</td><td className="tabular-nums">{day.checkIns}</td><td className="tabular-nums">{day.visitors}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
};

export default Analytics;
