// Helpers that turn list query-string parameters (search, from, to) into MongoDB filters.

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "contains" regex, or null when the search term is empty
const searchRegex = (search) => {
  const term = String(search || '').trim().slice(0, 100);
  return term ? new RegExp(escapeRegex(term), 'i') : null;
};

// Inclusive date range on `field` from YYYY-MM-DD strings; `to` covers the whole day
const dateRangeFilter = (field, from, to) => {
  const range = {};
  const start = from ? new Date(from) : null;
  const end = to ? new Date(to) : null;
  if (start && !Number.isNaN(start.getTime())) range.$gte = start;
  if (end && !Number.isNaN(end.getTime())) {
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? { [field]: range } : {};
};

module.exports = { searchRegex, dateRangeFilter };
