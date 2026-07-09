import { useCallback, useEffect, useState } from 'react';
import * as tagsApi from '../api/tags.api.js';

export function useTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tagsApi.listTags();
      setTags(data.tags);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tags, loading, refetch };
}
