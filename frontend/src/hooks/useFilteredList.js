import { useCallback, useEffect, useRef, useState } from 'react';
import api, { cleanParams } from '../services/api';

// Fetch a list endpoint with query-string filters; text search is debounced.
const useFilteredList = (path, initialFilters) => {
  const initialRef = useRef(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [query, setQuery] = useState(initialFilters);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(path, { params: cleanParams(query) });
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [path, query]);

  useEffect(() => {
    load();
  }, [load]);

  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const resetFilters = () => setFilters(initialRef.current);
  const isFiltered = Object.values(filters).some((value) => value !== '');

  return { items, filters, setFilter, resetFilters, isFiltered, loading, error, reload: load };
};

export default useFilteredList;
