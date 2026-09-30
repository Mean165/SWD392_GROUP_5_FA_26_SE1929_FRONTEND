export const formatDate = (value?: string | Date): string => {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

export const formatDateTime = (value?: string | Date): string => {
  if (!value) return '—';

  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};
