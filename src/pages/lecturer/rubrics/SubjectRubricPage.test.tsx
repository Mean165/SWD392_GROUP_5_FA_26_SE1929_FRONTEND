import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SubjectRubricPage from './SubjectRubricPage';
import { LanguageProvider } from '../../../context/LanguageContext';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(), getRubricSubjects: vi.fn(), getSubjectRubric: vi.fn(), getSubjectRubricStats: vi.fn(),
  createSubjectRubric: vi.fn(), updateSubjectRubric: vi.fn(), deleteSubjectRubric: vi.fn(),
}));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../../api/rubricApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/rubricApi')>();
  return { ...actual, getRubricSubjects: mocks.getRubricSubjects, getSubjectRubric: mocks.getSubjectRubric, getSubjectRubricStats: mocks.getSubjectRubricStats, createSubjectRubric: mocks.createSubjectRubric, updateSubjectRubric: mocks.updateSubjectRubric, deleteSubjectRubric: mocks.deleteSubjectRubric };
});

const activeRubric = {
  rubricId: 'rubric-1', subjectId: 'subject-1', topicId: null, bloomLevel: null,
  name: 'Course rubric', description: 'Whole course', status: 'ACTIVE', createdBy: null,
  createdAt: '', updatedAt: '', source: 'SUBJECT',
  criteria: [{ criteriaId: 'criteria-1', rubricId: 'rubric-1', questionId: null, criteriaName: 'Accuracy', expectedKnowledgePoints: 'Correct facts', weightRatio: 0.6 }, { criteriaId: 'criteria-2', rubricId: 'rubric-1', questionId: null, criteriaName: 'Reasoning', expectedKnowledgePoints: 'Clear reasoning', weightRatio: 0.4 }],
};
function renderPage() { return render(<LanguageProvider><MemoryRouter><SubjectRubricPage /></MemoryRouter></LanguageProvider>); }

describe('SubjectRubricPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ user: { role: 'LECTURER' } });
    mocks.getRubricSubjects.mockResolvedValue([{ subjectId: 'subject-1', subjectCode: 'SWD', subjectName: 'Software' }]);
    mocks.getSubjectRubric.mockResolvedValue(activeRubric);
    mocks.getSubjectRubricStats.mockResolvedValue({ subjectId: 'subject-1', activeRubricId: 'rubric-1', criteriaCount: 2, approvedQuestionsByBloom: { REMEMBER: 4, UNDERSTAND: 3, APPLY: 5, ANALYZE: 2, EVALUATE: 1, CREATE: 2 }, topicId: null, levels: null });
    mocks.updateSubjectRubric.mockResolvedValue({ ...activeRubric, rubricId: 'rubric-2' });
    mocks.createSubjectRubric.mockResolvedValue(activeRubric);
    mocks.deleteSubjectRubric.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('loads the active subject rubric and Bloom question statistics without topic or rubric-level controls', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Course rubric' })).toBeInTheDocument();
    expect(screen.getByText(/Nhớ \(REMEMBER\): 4/)).toBeInTheDocument();
    expect(screen.getByText(/Sáng tạo \(CREATE\): 2/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Chủ đề')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mức Bloom')).not.toBeInTheDocument();
    expect(mocks.getSubjectRubric).toHaveBeenCalledWith('subject-1');
  });

  it('updates the subject rubric with decimal weights and no legacy identifiers', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa' }));
    fireEvent.change(screen.getByLabelText('Tên tiêu chí 1'), { target: { value: 'Precision' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu rubric' }));
    await waitFor(() => expect(mocks.updateSubjectRubric).toHaveBeenCalledWith('subject-1', expect.objectContaining({
      name: 'Course rubric', criteria: [{ criteriaName: 'Precision', expectedKnowledgePoints: 'Correct facts', weightRatio: 0.6 }, { criteriaName: 'Reasoning', expectedKnowledgePoints: 'Clear reasoning', weightRatio: 0.4 }],
    })));
    const payload = mocks.updateSubjectRubric.mock.calls[0][1];
    expect(payload).not.toHaveProperty('bloomLevel');
    expect(payload).not.toHaveProperty('topicId');
    expect(mocks.getSubjectRubric).toHaveBeenCalledTimes(2);
  });

  it('treats a subject rubric 404 as an empty state and posts only subject rubric fields', async () => {
    const notFound = Object.assign(new Error('not found'), { isAxiosError: true, response: { status: 404 } });
    mocks.getSubjectRubric.mockRejectedValue(notFound);
    renderPage();
    expect(await screen.findByText('Môn học này chưa có rubric active.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tạo rubric' }));
    fireEvent.change(screen.getByLabelText('Tên rubric'), { target: { value: 'New rubric' } });
    fireEvent.change(screen.getByLabelText('Tên tiêu chí 1'), { target: { value: 'Accuracy' } });
    fireEvent.change(screen.getByLabelText('Nội dung kỳ vọng 1'), { target: { value: 'Correct facts' } });
    fireEvent.change(screen.getByLabelText('Trọng số (%) 1'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: '+ Thêm tiêu chí' }));
    fireEvent.change(screen.getByLabelText('Tên tiêu chí 2'), { target: { value: 'Reasoning' } });
    fireEvent.change(screen.getByLabelText('Nội dung kỳ vọng 2'), { target: { value: 'Clear reasoning' } });
    fireEvent.change(screen.getByLabelText('Trọng số (%) 2'), { target: { value: '40' } });
    expect(document.querySelector('.weight-total')?.textContent).toContain('100.00%');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu rubric' }));
    await waitFor(() => expect(mocks.createSubjectRubric).toHaveBeenCalledWith('subject-1', expect.objectContaining({
      name: 'New rubric', criteria: [{ criteriaName: 'Accuracy', expectedKnowledgePoints: 'Correct facts', weightRatio: 0.6 }, { criteriaName: 'Reasoning', expectedKnowledgePoints: 'Clear reasoning', weightRatio: 0.4 }],
    })));
  });
});
