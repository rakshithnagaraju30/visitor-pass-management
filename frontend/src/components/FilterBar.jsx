// Search box, optional status select and date range, laid out in one row above a table.
const FilterBar = ({
  filters,
  onChange,
  onReset,
  isFiltered,
  searchPlaceholder = 'Search...',
  statusKey = 'status',
  statusLabel = 'Status',
  statusOptions,
  dateLabel = 'Date',
  resultCount,
}) => (
  <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50/60 px-5 py-4 sm:px-6" role="search">
    <div className="relative min-w-0 flex-1 basis-full sm:basis-56">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        className="input pl-9"
        placeholder={searchPlaceholder}
        value={filters.search}
        onChange={(event) => onChange('search', event.target.value)}
        aria-label="Search"
      />
    </div>

    {statusOptions && (
      <select
        className="input w-full sm:w-44"
        value={filters[statusKey]}
        onChange={(event) => onChange(statusKey, event.target.value)}
        aria-label={statusLabel}
      >
        <option value="">Any {statusLabel.toLowerCase()}</option>
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    )}

    <label className="flex-1 sm:flex-none">
      <span className="mb-1 block text-xs font-medium text-slate-500">{dateLabel} from</span>
      <input type="date" className="input sm:w-40" value={filters.from} max={filters.to || undefined} onChange={(event) => onChange('from', event.target.value)} />
    </label>

    <label className="flex-1 sm:flex-none">
      <span className="mb-1 block text-xs font-medium text-slate-500">to</span>
      <input type="date" className="input sm:w-40" value={filters.to} min={filters.from || undefined} onChange={(event) => onChange('to', event.target.value)} />
    </label>

    <button type="button" className="btn btn-secondary" onClick={onReset} disabled={!isFiltered}>
      Clear
    </button>

    {resultCount !== undefined && (
      <span className="whitespace-nowrap pb-2.5 text-sm text-slate-500 sm:ml-auto">
        {resultCount} result{resultCount === 1 ? '' : 's'}
      </span>
    )}
  </div>
);

export default FilterBar;
