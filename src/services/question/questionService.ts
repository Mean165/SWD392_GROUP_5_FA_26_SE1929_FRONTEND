import apiClient from '../api/apiClient';
import type {
  Question,
  RubricCriteria,
  CreateQuestionRequest,
  QuestionFilterParams,
  QuestionStatus,
  Topic,
  QuestionGenerationRequest,
  RubricRequest,
  BackendQuestionResponse,
} from '../../types/question';
import type { ApiResponse } from '../../types/user';

// Topics chuẩn theo Backend Database (subject_topic)
export const DEFAULT_TOPICS: Topic[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    name: 'SWD392 - Software Architecture & Design',
    code: 'SWD392',
    description: 'Kiến trúc phần mềm, Clean Architecture, Design Patterns và microservices.',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    name: 'PRN231 - Cross-Platform Back-End Development',
    code: 'PRN231',
    description: 'Phát triển backend đa nền tảng với REST API, WebSocket, Security và Docker.',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    name: 'DBI202 - Database Systems',
    code: 'DBI202',
    description: 'Hệ quản trị cơ sở dữ liệu quan hệ, Indexing, Transaction, ACID và tối ưu query.',
  },
];

// Helper tìm tên môn học / topic từ topicId
export function getTopicNameById(topicId?: string): string {
  if (!topicId) return 'Chung';
  const found = DEFAULT_TOPICS.find((t) => t.id === topicId || t.code === topicId);
  return found ? found.name : `Chủ đề #${topicId.slice(0, 8)}`;
}

// Map rubrics mặc định cho các câu hỏi seed của hệ thống
const SEED_RUBRICS_MAP: Record<string, RubricCriteria[]> = {
  '50000000-0000-0000-0000-000000000001': [
    {
      id: '60000000-0000-0000-0000-000000000001',
      criteriaName: 'Định nghĩa nguyên lý DIP chính xác',
      maxScore: 10,
      weightRatio: 0.4,
      description: 'High-level modules không phụ thuộc vào Low-level modules; cả hai phụ thuộc vào abstractions.',
      expectedKnowledgePoints: 'High-level modules should not depend on low-level modules; both depend on abstractions. Abstractions do not depend on details.',
    },
    {
      id: '60000000-0000-0000-0000-000000000002',
      criteriaName: 'Minh họa áp dụng trong Clean Architecture',
      maxScore: 10,
      weightRatio: 0.6,
      description: 'Domain Layer định nghĩa Repository Interface; Infrastructure Layer cài đặt Repository; DI Container inject lúc runtime.',
      expectedKnowledgePoints: 'Domain Layer định nghĩa Interface; Infrastructure cài đặt cụ thể; Dependency Injection giải quyết liên kết.',
    },
  ],
  '50000000-0000-0000-0000-000000000002': [
    {
      id: '60000000-0000-0000-0000-000000000011',
      criteriaName: 'So sánh Monolith vs Microservices',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Chỉ rõ ưu nhược điểm về deployment, scaling, fault isolation và overhead của network.',
      expectedKnowledgePoints: 'Monolith dễ deploy ban đầu nhưng khó scale độc lập. Microservices linh hoạt nhưng chịu overhead mạng và dữ liệu phân tán.',
    },
    {
      id: '60000000-0000-0000-0000-000000000012',
      criteriaName: 'Tiêu chí tách module sang Microservice',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Độc lập về business domain (Bounded Context), yêu cầu throughput khác biệt hoặc công nghệ chuyên biệt.',
      expectedKnowledgePoints: 'Dựa trên Bounded Context (DDD), tải cao đột biến, độc lập chu kỳ phát hành giữa các team.',
    },
  ],
  '50000000-0000-0000-0000-000000000003': [
    {
      id: '60000000-0000-0000-0000-000000000021',
      criteriaName: 'Phân biệt Factory Method & Abstract Factory',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Factory Method dùng inheritance (1 phương thức tạo 1 sản phẩm); Abstract Factory tạo họ các sản phẩm liên quan.',
      expectedKnowledgePoints: 'Factory Method: một method trừu tượng tạo 1 sản phẩm. Abstract Factory: một interface tạo một họ sản phẩm liên quan (family of products).',
    },
    {
      id: '60000000-0000-0000-0000-000000000022',
      criteriaName: 'Ví dụ thực tiễn trong dự án',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Nêu cụ thể bài toán (VD: NotificationFactory: Email/SMS/FCM hoặc PaymentFactory: VNPay/Momo).',
      expectedKnowledgePoints: 'Áp dụng để decouple code khởi tạo với business logic, dễ mở rộng open-closed principle.',
    },
  ],
  '50000000-0000-0000-0000-000000000004': [
    {
      id: '60000000-0000-0000-0000-000000000003',
      criteriaName: 'Cấu trúc và cơ chế xác thực JWT',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Gồm 3 phần: Header, Payload, Signature. Server verify chữ ký không cần query database mỗi request.',
      expectedKnowledgePoints: 'Header.Payload.Signature; verify chữ ký bằng secret key; stateless authorization.',
    },
    {
      id: '60000000-0000-0000-0000-000000000004',
      criteriaName: 'Chiến lược Refresh Token & Thu hồi quyền',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Access token ngắn hạn, Refresh token dài hạn trong Redis/DB; blacklist token khi logout.',
      expectedKnowledgePoints: 'Access Token 15 phút, Refresh token xoay vòng (rotation), cơ chế blacklist hoặc versioning token.',
    },
  ],
  '50000000-0000-0000-0000-000000000005': [
    {
      id: '60000000-0000-0000-0000-000000000031',
      criteriaName: 'Giải thích 4 thuộc tính ACID',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Atomicity (nguyên tử), Consistency (nhất quán), Isolation (cô lập), Durability (bền vững).',
      expectedKnowledgePoints: 'Atomicity: all or nothing. Consistency: state hợp lệ. Isolation: giao dịch đồng thời không can thiệp. Durability: commit lưu vĩnh viễn.',
    },
    {
      id: '60000000-0000-0000-0000-000000000032',
      criteriaName: 'Hậu quả khi vi phạm Isolation Level',
      maxScore: 10,
      weightRatio: 0.5,
      description: 'Dirty Read, Non-repeatable Read, Phantom Read và cách giải quyết qua các mức cô lập (Read Committed, Serializable).',
      expectedKnowledgePoints: 'Đọc dữ liệu chưa commit (Dirty Read), giá trị bị đổi giữa 2 lần đọc (Non-repeatable read), phát sinh dòng mới (Phantom read).',
    },
  ],
};

const LOCAL_STORAGE_KEY = 'aives_custom_questions_store';

function getLocalCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

function saveLocalCustomQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // ignore
  }
}

/**
 * Chuẩn hóa đối tượng QuestionResponse từ Backend thành Question dùng trên giao diện
 */
export function normalizeBackendQuestion(raw: any): Question {
  const qId = String(raw.questionId || raw.id || '');
  const text = raw.questionText || raw.content || '';
  const topId = String(raw.topicId || '30000000-0000-0000-0000-000000000001');
  const topicName = getTopicNameById(topId);

  // Rubrics lấy từ seed nếu có, hoặc tạo rubrics cơ bản
  let rubrics = raw.rubrics;
  if (!Array.isArray(rubrics) || rubrics.length === 0) {
    rubrics = SEED_RUBRICS_MAP[qId] || [
      {
        id: `rubric-${qId}-1`,
        criteriaName: 'Độ chính xác và chiều sâu câu trả lời',
        maxScore: 10,
        weightRatio: 0.6,
        description: 'Thí sinh trả lời đúng các định nghĩa trọng tâm và đưa ra ví dụ minh họa.',
        expectedKnowledgePoints: text,
      },
      {
        id: `rubric-${qId}-2`,
        criteriaName: 'Khả năng phản biện và phân tích câu hỏi đào sâu',
        maxScore: 10,
        weightRatio: 0.4,
        description: 'Thí sinh giải thích mạch lạc khi giám khảo AI hỏi xoáy.',
        expectedKnowledgePoints: 'Phân tích đa chiều và liên hệ thực tế dự án.',
      },
    ];
  }

  return {
    id: qId,
    questionId: qId,
    content: text,
    questionText: text,
    chapter: topicName,
    topic: topicName,
    topicId: topId,
    topicName: topicName,
    bloomLevel: (raw.bloomLevel || 'UNDERSTAND') as any,
    status: (raw.approvalStatus || raw.status || 'APPROVED') as any,
    approvalStatus: (raw.approvalStatus || raw.status || 'APPROVED') as any,
    sourceType: raw.sourceType || 'LECTURER_MANUAL',
    createdBy: raw.createdBy ? `Giảng viên (${String(raw.createdBy).slice(0, 8)})` : 'TS. Nguyễn Hoàng Nam',
    rubrics,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

/**
 * 1. GET /api/questions
 * Lấy danh sách câu hỏi trong ngân hàng đề, hỗ trợ filter client-side
 */
export const getQuestions = async (params?: QuestionFilterParams): Promise<Question[]> => {
  let backendList: Question[] = [];

  try {
    const response = await apiClient.get<ApiResponse<BackendQuestionResponse[]> | BackendQuestionResponse[]>(
      '/questions',
    );
    const rawData =
      (response.data as ApiResponse<BackendQuestionResponse[]>)?.data ??
      (response.data as BackendQuestionResponse[]);

    if (Array.isArray(rawData)) {
      backendList = rawData.map(normalizeBackendQuestion);
    }
  } catch (error) {
    console.warn('Backend /api/questions unreachable. Checking local storage...', error);
  }

  // Kết hợp với các câu hỏi do người dùng vừa tạo cục bộ
  const localList = getLocalCustomQuestions();
  const existingIds = new Set(backendList.map((q) => String(q.id)));
  const combined = [
    ...localList.filter((l) => !existingIds.has(String(l.id))),
    ...backendList,
  ];

  // Nếu cả backend lẫn local đều rỗng, map toàn bộ SEED vào
  let result = combined;
  if (result.length === 0) {
    result = Object.keys(SEED_RUBRICS_MAP).map((seedId) =>
      normalizeBackendQuestion({
        questionId: seedId,
        questionText:
          seedId === '50000000-0000-0000-0000-000000000001'
            ? 'Bạn hãy giải thích nguyên lý Dependency Inversion Principle (DIP) trong SOLID và nêu cách áp dụng nó trong kiến trúc Clean Architecture/Hexagonal Architecture?'
            : seedId === '50000000-0000-0000-0000-000000000002'
            ? 'So sánh sự khác nhau giữa kiến trúc Monolith, Modular Monolith và Microservices. Khi nào nhóm bạn quyết định tách một module thành microservice độc lập?'
            : seedId === '50000000-0000-0000-0000-000000000003'
            ? 'Hãy trình bày về Factory Method Pattern và Abstract Factory Pattern. Trong dự án của bạn, pattern nào đã được sử dụng và giải quyết bài toán gì?'
            : seedId === '50000000-0000-0000-0000-000000000004'
            ? 'Cơ chế xác thực bằng JWT (JSON Web Token) hoạt động như thế nào? Phân biệt Access Token và Refresh Token, làm thế nào để xử lý Token Revocation khi người dùng logout?'
            : 'Hãy giải thích thuộc tính ACID trong quản lý giao dịch cơ sở dữ liệu (Transaction Management). Điều gì sẽ xảy ra nếu tính Isolation bị vi phạm?',
        bloomLevel: seedId.endsWith('1') || seedId.endsWith('3') ? 'APPLY' : seedId.endsWith('2') ? 'ANALYZE' : 'UNDERSTAND',
        topicId:
          seedId.endsWith('4')
            ? '30000000-0000-0000-0000-000000000002'
            : seedId.endsWith('5')
            ? '30000000-0000-0000-0000-000000000003'
            : '30000000-0000-0000-0000-000000000001',
        sourceType: seedId.endsWith('2') ? 'AI_GENERATED' : 'LECTURER_MANUAL',
        approvalStatus: 'APPROVED',
      }),
    );
  }

  // Áp dụng filters
  if (params) {
    if (params.topicId && params.topicId !== 'ALL') {
      result = result.filter(
        (q) => String(q.topicId) === String(params.topicId) || (q.chapter && q.chapter.includes(params.topicId!)),
      );
    }
    if (params.bloomLevel && params.bloomLevel !== 'ALL') {
      result = result.filter((q) => q.bloomLevel === params.bloomLevel);
    }
    if (params.status && params.status !== 'ALL') {
      result = result.filter((q) => q.status === params.status);
    }
    if (params.keyword && params.keyword.trim()) {
      const kw = params.keyword.toLowerCase().trim();
      result = result.filter(
        (q) =>
          (q.content && q.content.toLowerCase().includes(kw)) ||
          (q.questionText && q.questionText.toLowerCase().includes(kw)) ||
          (q.topicName && q.topicName.toLowerCase().includes(kw)) ||
          (q.id && q.id.toLowerCase().includes(kw)),
      );
    }
  }

  return result;
};

/**
 * 2. GET /api/questions/{id}
 * Lấy chi tiết một câu hỏi theo UUID
 */
export const getQuestionById = async (id: string): Promise<Question | null> => {
  try {
    const response = await apiClient.get<ApiResponse<BackendQuestionResponse> | BackendQuestionResponse>(
      `/questions/${id}`,
    );
    const rawData =
      (response.data as ApiResponse<BackendQuestionResponse>)?.data ??
      (response.data as BackendQuestionResponse);

    if (rawData) {
      return normalizeBackendQuestion(rawData);
    }
  } catch (err) {
    console.warn(`GET /api/questions/${id} failed, checking local cache:`, err);
  }

  // Fallback sang local cache / list
  const list = await getQuestions();
  return list.find((q) => String(q.id) === String(id) || String(q.questionId) === String(id)) || null;
};

/**
 * 3. DELETE /api/questions/{id}
 * Xóa câu hỏi khỏi ngân hàng theo UUID
 */
export const deleteQuestion = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/questions/${id}`);
  } catch (err) {
    console.warn(`DELETE /api/questions/${id} failed on backend, deleting locally:`, err);
  }

  // Cập nhật lại local cache
  const localList = getLocalCustomQuestions().filter((q) => String(q.id) !== String(id));
  saveLocalCustomQuestions(localList);
};

/**
 * 4. POST /api/questions/generate
 * Yêu cầu AI sinh câu hỏi theo prompt và môn học
 */
export const generateQuestion = async (payload: QuestionGenerationRequest): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any> | any>('/questions/generate', payload);
    const data = (response.data as ApiResponse<any>)?.data ?? response.data;
    if (data) return data;
  } catch (err) {
    console.warn('POST /api/questions/generate backend fallback:', err);
  }

  // AI Generation simulation nếu backend AI key chưa cấu hình
  const subjectName = getTopicNameById(payload.topicCode || payload.subjectCode);
  const promptSummary = payload.prompt.length > 60 ? payload.prompt.slice(0, 60) + '...' : payload.prompt;

  return {
    questionId: `gen-${Date.now()}`,
    questionText: `[AI Đề Xuất] Dựa trên yêu cầu: "${promptSummary}" thuộc môn ${subjectName}: Phân tích giải pháp kiến trúc tối ưu, chỉ rõ rủi ro hệ thống và các phương án xử lý sự cố.`,
    bloomLevel: 'ANALYZE',
    sourceType: 'AI_GENERATED',
    approvalStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    suggestedRubrics: [
      {
        criteriaName: 'Độ chuẩn xác về lý thuyết và mô hình kiến trúc',
        expectedKnowledgePoints: `Trình bày đúng khái niệm cốt lõi theo đề bài: "${promptSummary}".`,
        weightRatio: 0.5,
      },
      {
        criteriaName: 'Khả năng biện luận giải pháp và xử lý tình huống',
        expectedKnowledgePoints: 'Đưa ra được phương án khả thi, phân tích rủi ro và cách khắc phục sự cố.',
        weightRatio: 0.5,
      },
    ],
  };
};

/**
 * 5. POST /api/rubrics
 * Tạo mới tiêu chí rubric cho câu hỏi
 */
export const createRubric = async (payload: RubricRequest): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any> | any>('/rubrics', payload);
    return (response.data as ApiResponse<any>)?.data ?? response.data;
  } catch (err) {
    console.warn('POST /api/rubrics failed:', err);
    return {
      criteriaId: `rubric-${Date.now()}`,
      ...payload,
    };
  }
};

/**
 * 6. POST /api/questions
 * Tạo mới câu hỏi kèm rubrics đánh giá
 */
export const createQuestion = async (payload: CreateQuestionRequest): Promise<Question> => {
  const textContent = payload.content || payload.questionText || '';
  const topId = String(payload.topicId || '30000000-0000-0000-0000-000000000001');
  const topicName = payload.topicName || getTopicNameById(topId);

  const newQuestion: Question = {
    id: `50000000-${Date.now().toString().slice(-4)}-0000-0000-${Math.floor(Math.random() * 900000000000 + 100000000000)}`,
    content: textContent,
    questionText: textContent,
    chapter: topicName,
    topic: topicName,
    topicId: topId,
    topicName: topicName,
    bloomLevel: payload.bloomLevel,
    status: payload.status || 'APPROVED',
    sourceType: payload.sourceType || 'LECTURER_MANUAL',
    createdBy: payload.createdBy || 'TS. Nguyễn Hoàng Nam',
    rubrics: payload.rubrics.map((r, idx) => ({
      ...r,
      id: `rubric-${Date.now()}-${idx + 1}`,
      maxScore: r.maxScore || 10,
      description: r.description || r.expectedKnowledgePoints,
      expectedKnowledgePoints: r.expectedKnowledgePoints || r.description || '',
    })),
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await apiClient.post<ApiResponse<any> | any>('/questions', {
      questionText: textContent,
      bloomLevel: payload.bloomLevel,
      topicId: topId,
      sourceType: payload.sourceType || 'LECTURER_MANUAL',
      approvalStatus: payload.status || 'APPROVED',
    });
    const data = (response.data as ApiResponse<any>)?.data ?? response.data;
    if (data && data.questionId) {
      newQuestion.id = data.questionId;
      newQuestion.questionId = data.questionId;
    }
  } catch (err) {
    console.warn('Backend POST /api/questions fallback to local storage:', err);
  }

  // Đồng thời gọi POST /api/rubrics cho từng rubric
  for (const r of newQuestion.rubrics) {
    createRubric({
      questionId: newQuestion.id,
      criteriaName: r.criteriaName,
      expectedKnowledgePoints: r.expectedKnowledgePoints,
      weightRatio: r.weightRatio,
    }).catch(() => {});
  }

  // Lưu vào local cache
  const currentList = getLocalCustomQuestions();
  saveLocalCustomQuestions([newQuestion, ...currentList]);

  return newQuestion;
};

/**
 * 7. Cập nhật trạng thái câu hỏi (APPROVED, PENDING, REJECTED)
 */
export const updateQuestionStatus = async (
  id: string,
  status: QuestionStatus,
): Promise<Question> => {
  try {
    await apiClient.patch(`/questions/${id}/status`, { status });
  } catch (err) {
    console.warn(`PATCH /questions/${id}/status failed, updating locally:`, err);
  }

  const list = await getQuestions();
  const target = list.find((q) => String(q.id) === String(id));
  if (target) {
    target.status = status;
    target.approvalStatus = status;
    const local = getLocalCustomQuestions().map((q) => (String(q.id) === String(id) ? { ...q, status } : q));
    saveLocalCustomQuestions(local);
    return target;
  }
  throw new Error(`Không tìm thấy câu hỏi với ID ${id}`);
};

/**
 * 8. Lấy tiêu chí Rubric của câu hỏi
 */
export const getQuestionRubrics = async (questionId: string): Promise<RubricCriteria[]> => {
  const question = await getQuestionById(questionId);
  return question?.rubrics || [];
};

/**
 * 9. Thêm tiêu chí Rubric cho câu hỏi
 */
export const createQuestionRubrics = async (
  questionId: string,
  rubricsPayload: RubricCriteria | RubricCriteria[],
): Promise<RubricCriteria[]> => {
  const items = Array.isArray(rubricsPayload) ? rubricsPayload : [rubricsPayload];
  for (const item of items) {
    await createRubric({
      questionId,
      criteriaName: item.criteriaName,
      expectedKnowledgePoints: item.expectedKnowledgePoints,
      weightRatio: item.weightRatio,
    });
  }
  const updatedQuestion = await getQuestionById(questionId);
  return updatedQuestion?.rubrics || [];
};

export default {
  getQuestions,
  getQuestionById,
  deleteQuestion,
  generateQuestion,
  createRubric,
  createQuestion,
  updateQuestionStatus,
  getQuestionRubrics,
  createQuestionRubrics,
  DEFAULT_TOPICS,
  getTopicNameById,
};
