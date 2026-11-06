import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../../context/LanguageContext';
import GenerateQuestionPage from './GenerateQuestionPage';

const questionServiceMock = vi.hoisted(() => ({
  createQuestionGenerationJob: vi.fn(),
  deleteQuestionDocument: vi.fn(),
  getGenerationQuestions: vi.fn(),
  getQuestionDocument: vi.fn(),
  getQuestionDocuments: vi.fn(),
  getQuestionGenerationErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
  getQuestionGenerationJob: vi.fn(),
  getQuestionGenerationRetryAfter: vi.fn(),
  getQuestionGenerationSubjects: vi.fn(),
  getQuestionGenerationTopics: vi.fn(),
  uploadQuestionDocument: vi.fn(),
}));

vi.mock('../../../services/question/questionService', () => questionServiceMock);

const renderPage = () => render(
  <LanguageProvider>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <GenerateQuestionPage embedded />
    </MemoryRouter>
  </LanguageProvider>,
);

describe('GenerateQuestionPage subject and topic selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('aiviva-language', 'vi');
    localStorage.removeItem('aiviva-question-generation-job');
    questionServiceMock.getQuestionGenerationSubjects.mockResolvedValue([
      { subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' },
    ]);
    questionServiceMock.getQuestionGenerationTopics.mockResolvedValue([
      { topicId: 'topic-1', topicCode: 'TOPIC-001', topicName: 'Lập trình Java cơ bản', description: null },
    ]);
    questionServiceMock.getQuestionDocuments.mockResolvedValue([]);
    questionServiceMock.getGenerationQuestions.mockResolvedValue({
      items: [],
      page: 0,
      size: 10,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('loads topics for the selected subject and enables upload only after selecting a topic', async () => {
    renderPage();

    const subjectSelect = await screen.findByLabelText('Môn học');
    const topicSelect = screen.getByLabelText('Chủ đề');
    const fileInput = screen.getByLabelText('Tải PDF, PPTX hoặc DOCX');

    expect(subjectSelect).toHaveValue('');
    expect(topicSelect).toBeDisabled();
    expect(fileInput).toBeDisabled();

    fireEvent.change(subjectSelect, { target: { value: 'subject-1' } });
    expect(await screen.findByRole('option', { name: 'TOPIC-001 · Lập trình Java cơ bản' })).toBeInTheDocument();
    expect(topicSelect).toBeEnabled();
    expect(fileInput).toBeDisabled();
    expect(questionServiceMock.getQuestionGenerationTopics).toHaveBeenCalledWith('subject-1', expect.any(AbortSignal));

    fireEvent.change(topicSelect, { target: { value: 'topic-1' } });
    await waitFor(() => expect(questionServiceMock.getQuestionDocuments).toHaveBeenCalledWith('subject-1', 'topic-1', expect.any(AbortSignal)));
    await waitFor(() => expect(fileInput).toBeEnabled());
  });

  it('keeps request errors distinct from a successful empty subject response and offers retry', async () => {
    questionServiceMock.getQuestionGenerationSubjects
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce([
        { subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' },
      ]);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách môn học.');
    expect(screen.queryByText(/không có môn học nào được gán/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('option', { name: /SWD392/ })).toBeInTheDocument();
    expect(questionServiceMock.getQuestionGenerationSubjects).toHaveBeenCalledTimes(2);
  });

  it('places an empty assignment notice across the scope form without stretching one field', async () => {
    questionServiceMock.getQuestionGenerationSubjects.mockResolvedValueOnce([]);
    renderPage();

    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent('Không có môn học nào được gán');
    expect(notice).toHaveClass('qg-scope-notice');
    expect(notice.parentElement).toHaveClass('qg-form');
    expect(screen.getByLabelText('Chủ đề')).toBeDisabled();
  });

  it('submits one selected Bloom level without generating question rubrics and notifies on completion', async () => {
    const onGenerationComplete = vi.fn();
    questionServiceMock.getQuestionDocuments.mockResolvedValueOnce([{
      documentId: 'document-1',
      subjectId: 'subject-1',
      topicId: 'topic-1',
      uploadedBy: 'lecturer-1',
      filename: 'course.pdf',
      contentType: 'application/pdf',
      size: 128,
      status: 'READY',
      errorReason: null,
      uploadedAt: '2026-11-04T00:00:00Z',
      processedAt: '2026-11-04T00:00:00Z',
    }]);
    questionServiceMock.createQuestionGenerationJob.mockResolvedValueOnce({
      jobId: 'job-1', subjectId: 'subject-1', topicId: 'topic-1', status: 'DONE', progress: 100,
      generatedCount: 3, error: null, createdAt: '2026-11-04T00:00:00Z', startedAt: null,
      completedAt: '2026-11-04T00:00:00Z', questionIds: ['question-1', 'question-2', 'question-3'],
    });

    render(
      <LanguageProvider>
        <MemoryRouter>
          <GenerateQuestionPage embedded singleBloom onGenerationComplete={onGenerationComplete} />
        </MemoryRouter>
      </LanguageProvider>,
    );

    fireEvent.change(await screen.findByLabelText('Môn học'), { target: { value: 'subject-1' } });
    fireEvent.change(await screen.findByLabelText('Chủ đề'), { target: { value: 'topic-1' } });
    await screen.findByText('course.pdf');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.change(screen.getByLabelText('Số câu hỏi'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('REMEMBER'));
    fireEvent.click(screen.getByLabelText('CREATE'));
    fireEvent.click(screen.getByLabelText('APPLY'));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu sinh' }));

    await waitFor(() => expect(questionServiceMock.createQuestionGenerationJob).toHaveBeenCalledWith({
      subjectId: 'subject-1',
      topicId: 'topic-1',
      documentIds: ['document-1'],
      numberOfQuestions: 3,
      bloomDistribution: { REMEMBER: 0, UNDERSTAND: 0, APPLY: 2, ANALYZE: 0, EVALUATE: 0, CREATE: 1 },
      language: 'vi',
      generateRubric: false,
      rubricTotalPoints: 10,
    }));
    await waitFor(() => expect(onGenerationComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText('Sinh rubric')).not.toBeInTheDocument();
  });

  it('shows clear network and quota errors and allows another generation attempt', async () => {
    questionServiceMock.getQuestionDocuments.mockResolvedValue([{
      documentId: 'document-1', subjectId: 'subject-1', topicId: 'topic-1', uploadedBy: 'lecturer-1',
      filename: 'course.pdf', contentType: 'application/pdf', size: 128, status: 'READY', errorReason: null,
      uploadedAt: '2026-11-04T00:00:00Z', processedAt: '2026-11-04T00:00:00Z',
    }]);
    questionServiceMock.createQuestionGenerationJob
      .mockRejectedValueOnce({ isAxiosError: true, message: 'Network Error' })
      .mockResolvedValueOnce({
        jobId: 'job-failed', subjectId: 'subject-1', topicId: 'topic-1', status: 'FAILED', progress: 10,
        generatedCount: 0, error: 'AI provider quota or rate limit reached', createdAt: '2026-11-04T00:00:00Z',
        startedAt: '2026-11-04T00:00:00Z', completedAt: '2026-11-04T00:00:00Z', questionIds: [],
      })
      .mockResolvedValueOnce({
        jobId: 'job-retry', subjectId: 'subject-1', topicId: 'topic-1', status: 'DONE', progress: 100,
        generatedCount: 4, error: null, createdAt: '2026-11-04T00:00:00Z', startedAt: null,
        completedAt: '2026-11-04T00:00:00Z', questionIds: ['question-1'],
      });

    render(
      <LanguageProvider>
        <MemoryRouter>
          <GenerateQuestionPage embedded singleBloom />
        </MemoryRouter>
      </LanguageProvider>,
    );

    fireEvent.change(await screen.findByLabelText('Môn học'), { target: { value: 'subject-1' } });
    fireEvent.change(await screen.findByLabelText('Chủ đề'), { target: { value: 'topic-1' } });
    await screen.findByText('course.pdf');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Tạo yêu cầu sinh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối đến máy chủ. Hãy kiểm tra kết nối mạng rồi thử lại.');

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Nhà cung cấp AI đã hết hạn mức hoặc giới hạn tốc độ. Hãy thử lại sau.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(questionServiceMock.createQuestionGenerationJob).toHaveBeenCalledTimes(3));
  });

  it('cancels an in-flight document upload using the upload request signal', async () => {
    const file = new File(['course material'], 'course.pdf', { type: 'application/pdf' });
    questionServiceMock.uploadQuestionDocument.mockImplementationOnce((_subjectId, _topicId, _file, signal) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject({ isAxiosError: true, message: 'Request canceled' }), { once: true });
    }));
    renderPage();

    fireEvent.change(await screen.findByLabelText('Môn học'), { target: { value: 'subject-1' } });
    fireEvent.change(await screen.findByLabelText('Chủ đề'), { target: { value: 'topic-1' } });
    const input = await screen.findByLabelText('Tải PDF, PPTX hoặc DOCX');
    fireEvent.change(input, { target: { files: [file] } });
    await screen.findByText('course.pdf');
    fireEvent.click(await screen.findByRole('button', { name: 'Hủy tải lên' }));

    expect(await screen.findByText('Đã hủy tải lên.')).toBeInTheDocument();
    expect(questionServiceMock.uploadQuestionDocument).toHaveBeenCalledWith('subject-1', 'topic-1', file, expect.any(AbortSignal));
  });

  it('retries a failed document upload without asking the lecturer to reselect the file', async () => {
    const file = new File(['course material'], 'course.pdf', { type: 'application/pdf' });
    questionServiceMock.uploadQuestionDocument
      .mockRejectedValueOnce(new Error('Temporary upload failure'))
      .mockResolvedValueOnce({
        documentId: 'document-1', subjectId: 'subject-1', topicId: 'topic-1', uploadedBy: 'lecturer-1',
        filename: 'course.pdf', contentType: 'application/pdf', size: 128, status: 'READY', errorReason: null,
        uploadedAt: '2026-11-04T00:00:00Z', processedAt: '2026-11-04T00:00:00Z',
      });
    questionServiceMock.getQuestionGenerationErrorMessage.mockReturnValueOnce('Temporary upload failure');
    renderPage();

    fireEvent.change(await screen.findByLabelText('Môn học'), { target: { value: 'subject-1' } });
    fireEvent.change(await screen.findByLabelText('Chủ đề'), { target: { value: 'topic-1' } });
    fireEvent.change(await screen.findByLabelText('Tải PDF, PPTX hoặc DOCX'), { target: { files: [file] } });
    expect(await screen.findByText('Temporary upload failure')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Sẵn sàng')).toBeInTheDocument();
    expect(questionServiceMock.uploadQuestionDocument).toHaveBeenCalledTimes(2);
  });
});
