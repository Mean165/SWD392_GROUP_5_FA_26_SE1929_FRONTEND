export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isNotEmpty = (value?: string): boolean => Boolean(value && value.trim().length > 0);
