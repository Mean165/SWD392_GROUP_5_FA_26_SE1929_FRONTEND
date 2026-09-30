export const handleApiError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error('An unexpected API error occurred.');
};
