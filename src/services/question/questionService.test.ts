import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveGenerationQuestions,
  createQuestionGenerationJob,
  getGenerationQuestions,
  getQuestionGenerationSubjects,
  getQuestionGenerationTopics,
  uploadQuestionDocument,
} from './questionService';

const questionApiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api/apiClient', () => ({ default: questionApiMock }));

describe('question generation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads assigned subjects through the additive generation route and unwraps the response envelope', async () => {
    const subjects = [{ subjectId: 'subject-1', subjectCode: 'SWD392', subjectName: 'Software Development Project' }];
    questionApiMock.get.mockResolvedValue({ data: { success: true, message: 'ok', data: subjects, timestamp: 'now' } });

    await expect(getQuestionGenerationSubjects()).resolves.toEqual(subjects);
    expect(questionApiMock.get).toHaveBeenCalledWith('/question-generation/subjects', { signal: undefined });
  });

  it('loads topics for the selected subject and unwraps the response envelope', async () => {
    const topics = [{ topicId: 'topic-1', topicCode: 'TOPIC-001', topicName: 'Java basics', description: null }];
    questionApiMock.get.mockResolvedValue({ data: { success: true, message: 'ok', data: topics, timestamp: 'now' } });

    await expect(getQuestionGenerationTopics('subject-1')).resolves.toEqual(topics);
    expect(questionApiMock.get).toHaveBeenCalledWith('/question-generation/subjects/subject-1/topics', { signal: undefined });
  });

  it('sends a single multipart file with subject and topic query parameters', async () => {
    const file = new File(['searchable document'], 'lecture.pdf', { type: 'application/pdf' });
    const document = { documentId: 'document-1', status: 'UPLOADED' };
    questionApiMock.post.mockResolvedValue({ data: { success: true, message: 'accepted', data: document } });

    await expect(uploadQuestionDocument('subject-1', 'topic-1', file)).resolves.toEqual(document);
    const [path, body, config] = questionApiMock.post.mock.calls[0];
    expect(path).toBe('/question-generation/documents');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(config).toEqual(expect.objectContaining({
      params: { subjectId: 'subject-1', topicId: 'topic-1' },
    }));
    expect(config).not.toHaveProperty('headers.Content-Type');
  });

  it('submits the configured job request without changing its contract fields', async () => {
    const payload = {
      subjectId: 'subject-1',
      topicId: 'topic-1',
      documentIds: ['document-1'],
      numberOfQuestions: 4,
      bloomDistribution: { REMEMBER: 1, UNDERSTAND: 1, APPLY: 1, ANALYZE: 1 } as const,
      language: 'vi' as const,
      generateRubric: true,
      rubricTotalPoints: 10,
    };
    const job = { jobId: 'job-1', status: 'QUEUED', questionIds: [] };
    questionApiMock.post.mockResolvedValue({ data: { success: true, message: 'accepted', data: job } });

    await expect(createQuestionGenerationJob(payload)).resolves.toEqual(job);
    expect(questionApiMock.post).toHaveBeenCalledWith('/question-generation/jobs', payload, { signal: undefined });
  });

  it('requests bank-only results with the supported filters', async () => {
    const result = { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 };
    questionApiMock.get.mockResolvedValue({ data: { success: true, message: 'ok', data: result } });

    await expect(getGenerationQuestions({ bankOnly: true, subjectId: 'subject-1', page: 0, size: 20 })).resolves.toEqual(result);
    expect(questionApiMock.get).toHaveBeenCalledWith('/question-generation/questions', {
      params: { bankOnly: true, subjectId: 'subject-1', page: 0, size: 20 },
      signal: undefined,
    });
  });

  it('sends bulk approval as one all-or-nothing request', async () => {
    const questions = [{ questionId: 'question-1', status: 'APPROVED' }];
    questionApiMock.post.mockResolvedValue({ data: { success: true, message: 'ok', data: questions } });

    await expect(approveGenerationQuestions(['question-1'])).resolves.toEqual(questions);
    expect(questionApiMock.post).toHaveBeenCalledWith('/question-generation/questions/approve-bulk', { questionIds: ['question-1'] }, { signal: undefined });
  });
});
