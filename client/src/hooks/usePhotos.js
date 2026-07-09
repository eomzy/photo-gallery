import { useCallback, useEffect, useState } from 'react';
import * as photosApi from '../api/photos.api.js';

export function usePhotos(tagId) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await photosApi.listPhotos(tagId);
      setPhotos(data.photos);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [tagId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { photos, loading, error, refetch };
}
