import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import ExamDetailPage from './ExamDetailPage';

const mocks = vi.hoisted(() => ({ useAuth: vi.fn(), useExamSessionDetail: vi.fn() }));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('../../../hooks/useExamSessionDetail', () => ({ default: mocks.useExamSessionDetail }));

describe('ExamDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mocks.useAuth.mockReturnValue({ user: { role: 'LECTURER' } });
    mocks.useExamSessionDetail.mockReturnValue({
      session: { sessionId: 'session-1', createdById: 'le-1', createdByName: 'Lecturer', topicId: 'topic-1', topicName: 'Software design', sessionName: 'Oral session', maxMainQuestions: 6, maxFollowupPerQuestion: 1, maxOverlapPercent: 40, timeLimitMinutes: 15, status: 'SCHEDULED', startTime: null, createdAt: '', bloomDistribution: { REMEMBER: 1, APPLY: 1 }, statistics: { studentCount: 1, completedCount: 0, absentCount: 0 } },
      students: { content: [{ assignmentId: 'a-1', sessionId: 'session-1', sessionName: 'Oral session', studentId: 'st-1', studentCode: 'ST1', studentName: 'Student One', studentEmail: 'st@example.test', scheduledTime: null, status: 'IN_PROGRESS', attemptId: 'attempt-1', attemptStatus: 'IN_PROGRESS' }], page: 0, size: 50, totalElements: 1, totalPages: 1 },
      readiness: { ready: false, canStart: false, studentCount: 1, unscheduledCount: 0, overlappingCount: 2, approvedQuestionsByBloom: { REMEMBER: 4 }, missingQuestionsByBloom: {}, warnings: ['Có một cảnh báo.'], blockingErrors: [], issues: [
        { code: 'SUBJECT_RUBRIC_MISSING', bloomLevel: null, have: null, need: null, maxPercent: null, minimumAdditionalQuestions: null, minimumIsUpperBound: null, additionalQuestionsByBloom: null },
        { code: 'SUBJECT_RUBRIC_INVALID', bloomLevel: null, have: null, need: null, maxPercent: null, minimumAdditionalQuestions: null, minimumIsUpperBound: null, additionalQuestionsByBloom: null },
        { code: 'INSUFFICIENT_QUESTIONS', bloomLevel: 'UNDERSTAND', have: 1, need: 2, maxPercent: null, minimumAdditionalQuestions: null, minimumIsUpperBound: null, additionalQuestionsByBloom: null },
        { code: 'OVERLAP_EXCEEDS_LIMIT', bloomLevel: null, have: null, need: null, maxPercent: 40, minimumAdditionalQuestions: 3, minimumIsUpperBound: true, additionalQuestionsByBloom: { UNDERSTAND: 3 } },
        { code: 'SCHEDULE_OVERLAP', bloomLevel: null, have: 2, need: null, maxPercent: null, minimumAdditionalQuestions: null, minimumIsUpperBound: null, additionalQuestionsByBloom: null },
      ] },
      usage: null, loading: false, studentsLoading: false, readinessLoading: false, usageLoading: false, error: '', studentsError: '', readinessError: '', usageError: '',
      loadSession: vi.fn().mockResolvedValue(undefined), loadStudents: vi.fn().mockResolvedValue(undefined), loadReadiness: vi.fn().mockResolvedValue(undefined), loadUsage: vi.fn().mockResolvedValue(undefined),
      loadPlan: vi.fn(), addStudents: vi.fn(), importStudents: vi.fn(), removeStudent: vi.fn(), updateSchedule: vi.fn(), autoSchedule: vi.fn(),
      start: vi.fn().mockResolvedValue(undefined), cancel: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined), refreshAll: vi.fn(),
    });
  });

  it('loads readiness in its tab and confirms cancellation when a student is in progress', async () => {
    render(<LanguageProvider><MemoryRouter initialEntries={['/lecturer/exam-sessions/session-1']}><ExamDetailPage /></MemoryRouter></LanguageProvider>);
    expect(screen.getByText('Oral session')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Sẵn sàng thi' }));
    await waitFor(() => expect(mocks.useExamSessionDetail.mock.results[0].value.loadReadiness).toHaveBeenCalled());
    expect(screen.getByText('Có một cảnh báo.')).toBeInTheDocument();
    expect(screen.getByText('Môn học chưa có rubric active.')).toBeInTheDocument();
    expect(screen.getByText('Rubric môn học có tiêu chí hoặc trọng số không hợp lệ.')).toBeInTheDocument();
    expect(screen.getByText('Mức UNDERSTAND hiện có 1 câu đã duyệt, cần ít nhất 2 câu.')).toBeInTheDocument();
    expect(screen.getByText('Không thể cấp phát đề với giới hạn trùng 40%.')).toBeInTheDocument();
    expect(screen.getByText(/cận trên ước lượng/)).toBeInTheDocument();
    expect(screen.getByText('Có 2 cặp lịch thi bị trùng giờ.')).toBeInTheDocument();
    expect(screen.getByText(/tối đa 2 câu có thể trùng giữa hai sinh viên/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hủy phiên' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Hủy phiên thi' });
    expect(within(dialog).getByText(/Có sinh viên đang thi/)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Lý do hủy'), { target: { value: 'Lịch cần thay đổi' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận hủy' }));
    await waitFor(() => expect(mocks.useExamSessionDetail.mock.results[0].value.cancel).toHaveBeenCalledWith('Lịch cần thay đổi'));
  });
});
