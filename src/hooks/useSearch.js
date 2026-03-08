import { useState, useCallback, useRef } from 'react';
import { searchAPI } from '../utils/api';
import toast from 'react-hot-toast';

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState(null);
  const [related, setRelated] = useState([]);
  const abortRef = useRef(null);

  const search = useCallback(async (params) => {
    if (!params.query?.trim()) {
      toast.error('Enter a search query');
      return null;
    }
    if (abortRef.current) abortRef.current.abort();
    setLoading(true);
    try {
      const res = await searchAPI.search(params);
      const data = res.data.data;
      setResults(data.results);
      setLastSearch(data);
      setRelated(data.related || []);
      return data;
    } catch (err) {
      toast.error(err.message || 'Search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const openAll = useCallback((results, delay = 140) => {
    if (!results?.length) return;
    results.forEach((r, i) => {
      setTimeout(() => window.open(r.mainUrl || r.urls?.main, '_blank', 'noopener'), i * delay);
    });
    toast.success(`Opened ${results.length} platform${results.length > 1 ? 's' : ''}`, { icon: '🚀' });
  }, []);

  const openOne = useCallback((url, platformName) => {
    window.open(url, '_blank', 'noopener');
    toast.success(`Opened ${platformName}`, { duration: 1500 });
  }, []);

  return { results, loading, lastSearch, related, search, openAll, openOne };
}
