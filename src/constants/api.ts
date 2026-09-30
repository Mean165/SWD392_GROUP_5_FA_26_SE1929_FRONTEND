export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    me: '/auth/me',
  },
  user: '/user',
  question: '/question',
  exam: '/exam',
  interview: '/interview',
  evaluation: '/evaluation',
  monitoring: '/monitoring',
  report: '/report',
  system: '/system',
} as const;
