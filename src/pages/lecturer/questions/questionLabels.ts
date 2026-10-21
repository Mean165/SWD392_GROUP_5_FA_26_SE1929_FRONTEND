import type { QuestionStatus } from '../../../types/question';

export const questionStatusLabel = (status: QuestionStatus, t: (text: string) => string): string => {
  if (status === 'APPROVED') return t('Đã duyệt');
  if (status === 'REJECTED') return t('Đã từ chối');
  return t('Bản nháp');
};
