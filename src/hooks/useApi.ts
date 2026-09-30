import { useCallback } from 'react';

export const useApi = () => {
  const request = useCallback(async <T,>(executor: () => Promise<T>): Promise<T> => {
    // TODO: add shared request handling later, such as error formatting or toast notifications
    return executor();
  }, []);

  return { request };
};
