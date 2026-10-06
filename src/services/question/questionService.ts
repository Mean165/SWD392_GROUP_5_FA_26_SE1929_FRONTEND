import apiClient from '../api/apiClient';
import type {
  Question,
  RubricCriteria,
  CreateQuestionRequest,
  QuestionFilterParams,
  QuestionStatus,
  Topic,
} from '../../types/question';
import type { ApiResponse } from '../../types/user';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'ch-1',
    name: 'Chương 1: Triết học & vai trò trong đời sống xã hội',
    code: 'CHUONG_1',
    description: 'Vấn đề cơ bản của triết học, vật chất và ý thức, vai trò thế giới quan và phương pháp luận.',
  },
  {
    id: 'ch-2',
    name: 'Chương 2: Phép biện chứng duy vật',
    code: 'CHUONG_2',
    description: 'Hai nguyên lý, ba quy luật cơ bản, sáu cặp phạm trù của phép biện chứng duy vật.',
  },
  {
    id: 'ch-3',
    name: 'Chương 3: Chủ nghĩa duy vật lịch sử',
    code: 'CHUONG_3',
    description: 'Học thuyết hình thái kinh tế - xã hội, giai cấp, nhà nước và ý thức xã hội.',
  },
];

const LOCAL_STORAGE_KEY = 'aives_mock_questions_ml';

export const INITIAL_MOCK_QUESTIONS_ML: Question[] = [
  {
    id: 'ML-Q101',
    content:
      'Trình bày định nghĩa vật chất của V.I.Lênin và phân tích ý nghĩa khoa học của định nghĩa đối với cuộc đấu tranh chống chủ nghĩa duy tâm và thuyết không thể biết.',
    questionText:
      'Trình bày định nghĩa vật chất của V.I.Lênin và phân tích ý nghĩa khoa học của định nghĩa đối với cuộc đấu tranh chống chủ nghĩa duy tâm và thuyết không thể biết.',
    chapter: 'Chương 1: Triết học & vai trò trong đời sống xã hội',
    topicId: 'ch-1',
    topicName: 'Chương 1: Triết học & vai trò trong đời sống xã hội',
    bloomLevel: 'REMEMBER',
    status: 'APPROVED',
    sourceType: 'MANUAL',
    createdBy: 'TS. Nguyễn Thị Minh (Bộ môn Triết học Mác - Lênin)',
    rubrics: [
      {
        id: 'R-101-1',
        criteriaName: 'Thuộc tính thực tại khách quan và khả năng phản ánh',
        maxScore: 10,
        weightRatio: 0.4,
        description: 'Đạt tối đa khi nêu chuẩn xác định nghĩa: vật chất là thực tại khách quan đem lại cho con người trong cảm giác.',
        expectedKnowledgePoints:
          'Trình bày đúng định nghĩa: Vật chất là phạm trù triết học chỉ thực tại khách quan được đem lại trong cảm giác, được cảm giác chép lại, chụp lại, phản ánh.',
      },
      {
        id: 'R-101-2',
        criteriaName: 'Ý nghĩa khắc phục hạn chế siêu hình & bác bỏ duy tâm',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Phân tích được tính triệt để giải quyết mặt thứ nhất vấn đề cơ bản của triết học.',
        expectedKnowledgePoints:
          'Khắc phục triệt để quan niệm quy vật chất về vật thể cụ thể (đồng nhất với nguyên tử); giải quyết đúng đắn vấn đề cơ bản của triết học.',
      },
      {
        id: 'R-101-3',
        criteriaName: 'Ý nghĩa định hướng phương pháp luận khoa học tự nhiên',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Chỉ rõ cuộc khủng hoảng vật lý đầu thế kỷ XX và niềm tin khoa học.',
        expectedKnowledgePoints:
          'Mở đường cho khoa học tự nhiên phát triển, khẳng định vật chất vô cùng vô tận, không tự nhiên sinh ra hay mất đi.',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'ML-Q102',
    content:
      'Phân tích nguồn gốc tự nhiên và nguồn gốc xã hội của ý thức. Nguồn gốc nào đóng vai trò quyết định trực tiếp đến sự ra đời và phát triển của ý thức con người?',
    questionText:
      'Phân tích nguồn gốc tự nhiên và nguồn gốc xã hội của ý thức. Nguồn gốc nào đóng vai trò quyết định trực tiếp đến sự ra đời và phát triển của ý thức con người?',
    chapter: 'Chương 1: Triết học & vai trò trong đời sống xã hội',
    topicId: 'ch-1',
    topicName: 'Chương 1: Triết học & vai trò trong đời sống xã hội',
    bloomLevel: 'UNDERSTAND',
    status: 'APPROVED',
    sourceType: 'MANUAL',
    createdBy: 'PGS.TS. Trần Quốc Tuấn',
    rubrics: [
      {
        id: 'R-102-1',
        criteriaName: 'Nguồn gốc tự nhiên (Bộ não người & thế giới khách quan)',
        maxScore: 10,
        weightRatio: 0.35,
        description: 'Làm rõ bộ não người là khí quan vật chất và mối quan hệ phản ánh thế giới khách quan.',
        expectedKnowledgePoints:
          'Bộ óc người có cấu trúc tinh vi, hoàn thiện; năng lực phản ánh năng động sáng tạo của não người đối với thế giới bên ngoài.',
      },
      {
        id: 'R-102-2',
        criteriaName: 'Nguồn gốc xã hội (Lao động & Ngôn ngữ)',
        maxScore: 10,
        weightRatio: 0.45,
        description: 'Chứng minh lao động và ngôn ngữ biến vượn thành người và hình thành tư duy trừu tượng.',
        expectedKnowledgePoints:
          'Lao động thay đổi dáng đi, chế tạo công cụ, nảy sinh nhu cầu giao tiếp; ngôn ngữ là cái vỏ vật chất của tư duy, phương tiện truyền đạt kinh nghiệm.',
      },
      {
        id: 'R-102-3',
        criteriaName: 'Khẳng định vai trò quyết định của nguồn gốc xã hội',
        maxScore: 10,
        weightRatio: 0.2,
        description: 'Kết luận nguồn gốc xã hội là đòn bẩy quyết định bản chất xã hội của ý thức.',
        expectedKnowledgePoints:
          'Nếu tách khỏi đời sống xã hội, con người không thể có ý thức người. Phê phán quan điểm duy tâm và cơ học.',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ML-Q201',
    content:
      'Phân tích nội dung quy luật chuyển hóa từ những sự thay đổi về lượng thành những sự thay đổi về chất và ngược lại. Rút ra bài học phương pháp luận đối với quá trình học tập của sinh viên.',
    questionText:
      'Phân tích nội dung quy luật chuyển hóa từ những sự thay đổi về lượng thành những sự thay đổi về chất và ngược lại. Rút ra bài học phương pháp luận đối với quá trình học tập của sinh viên.',
    chapter: 'Chương 2: Phép biện chứng duy vật',
    topicId: 'ch-2',
    topicName: 'Chương 2: Phép biện chứng duy vật',
    bloomLevel: 'ANALYZE',
    status: 'PENDING',
    sourceType: 'MANUAL',
    createdBy: 'ThS. Lê Hoàng Nam',
    rubrics: [
      {
        id: 'R-201-1',
        criteriaName: 'Khái niệm Chất, Lượng, Độ, Điểm nút, Bước nhảy',
        maxScore: 10,
        weightRatio: 0.35,
        description: 'Định nghĩa đúng các phạm trù cấu thành quy luật lượng - chất.',
        expectedKnowledgePoints:
          'Chất là tính quy định khách quan vốn có; lượng là số lượng, quy mô, trình độ; độ là giới hạn; điểm nút là thời điểm lượng đổi đạt ngưỡng; bước nhảy là bước chuyển chất.',
      },
      {
        id: 'R-201-2',
        criteriaName: 'Mối quan hệ biện chứng giữa tích lũy lượng & biến đổi chất',
        maxScore: 10,
        weightRatio: 0.35,
        description: 'Làm rõ sự lượng đổi dẫn đến chất đổi và chiều ngược lại.',
        expectedKnowledgePoints:
          'Quá trình lượng đổi diễn ra dần dần; khi vượt qua điểm nút thì chất mới ra đời; chất mới tác động trở lại tạo nhịp điệu phát triển mới cho lượng.',
      },
      {
        id: 'R-201-3',
        criteriaName: 'Ý nghĩa phương pháp luận & liên hệ thực tiễn học tập',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Liên hệ tránh nôn nóng đốt cháy giai đoạn hoặc bảo thủ trì trệ.',
        expectedKnowledgePoints:
          'Phải kiên trì tích lũy kiến thức từng ngày; không chủ quan, chống tư tưởng đốt cháy giai đoạn (tả khuynh) hoặc bảo thủ không dám đột phá (hữu khuynh).',
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ML-Q202',
    content:
      'Vận dụng mối quan hệ biện chứng giữa "Cái chung" và "Cái riêng" để làm sáng tỏ chủ trương: tiếp thu tinh hoa văn hóa nhân loại đồng thời giữ gìn, phát huy bản sắc văn hóa dân tộc Việt Nam.',
    questionText:
      'Vận dụng mối quan hệ biện chứng giữa "Cái chung" và "Cái riêng" để làm sáng tỏ chủ trương: tiếp thu tinh hoa văn hóa nhân loại đồng thời giữ gìn, phát huy bản sắc văn hóa dân tộc Việt Nam.',
    chapter: 'Chương 2: Phép biện chứng duy vật',
    topicId: 'ch-2',
    topicName: 'Chương 2: Phép biện chứng duy vật',
    bloomLevel: 'APPLY',
    status: 'APPROVED',
    sourceType: 'MANUAL',
    createdBy: 'TS. Nguyễn Thị Minh',
    rubrics: [
      {
        id: 'R-202-1',
        criteriaName: 'Lý luận cặp phạm trù Cái chung và Cái riêng',
        maxScore: 10,
        weightRatio: 0.4,
        description: 'Phân tích bản chất cái chung tồn tại trong cái riêng, cái riêng tồn tại trong mối liên hệ với cái chung.',
        expectedKnowledgePoints:
          'Cái chung chỉ tồn tại trong cái riêng, thông qua cái riêng mà biểu hiện; cái riêng chỉ tồn tại trong mối liên hệ đưa đến cái chung; cái đơn nhất và cái chung có thể chuyển hóa.',
      },
      {
        id: 'R-202-2',
        criteriaName: 'Vận dụng tiếp thu tinh hoa văn hóa nhân loại (Cái chung)',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Làm rõ các giá trị phổ quát của nhân loại như khoa học, dân chủ, văn minh.',
        expectedKnowledgePoints:
          'Chủ động hội nhập, tiếp thu tri thức, công nghệ, tư tưởng nhân văn tiến bộ của thế giới làm phong phú đời sống tinh thần.',
      },
      {
        id: 'R-202-3',
        criteriaName: 'Giữ gìn bản sắc văn hóa dân tộc (Cái riêng - Bản sắc độc đáo)',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Khẳng định tinh thần hòa nhập nhưng không hòa tan.',
        expectedKnowledgePoints:
          'Bảo tồn cốt cách, truyền thống yêu nước, đạo lý nhân nghĩa của dân tộc; phát huy cái độc đáo để đóng góp vào kho tàng văn hóa nhân loại.',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'ML-Q203',
    content:
      'Phân tích quy luật thống nhất và đấu tranh của các mặt đối lập (Quy luật mâu thuẫn). Tại sao V.I.Lênin khẳng định quy luật này là hạt nhân của phép biện chứng duy vật?',
    questionText:
      'Phân tích quy luật thống nhất và đấu tranh của các mặt đối lập (Quy luật mâu thuẫn). Tại sao V.I.Lênin khẳng định quy luật này là hạt nhân của phép biện chứng duy vật?',
    chapter: 'Chương 2: Phép biện chứng duy vật',
    topicId: 'ch-2',
    topicName: 'Chương 2: Phép biện chứng duy vật',
    bloomLevel: 'ANALYZE',
    status: 'PENDING',
    sourceType: 'MANUAL',
    createdBy: 'PGS.TS. Đỗ Đức Hiếu',
    rubrics: [
      {
        id: 'R-203-1',
        criteriaName: 'Khái niệm mặt đối lập & mâu thuẫn biện chứng',
        maxScore: 10,
        weightRatio: 0.35,
        description: 'Khẳng định tính khách quan, phổ biến và đa dạng của mâu thuẫn biện chứng.',
        expectedKnowledgePoints:
          'Mặt đối lập là các khuynh hướng, thuộc tính bài trừ phủ định nhau; mâu thuẫn biện chứng là sự thống nhất và đấu tranh giữa các mặt đối lập.',
      },
      {
        id: 'R-203-2',
        criteriaName: 'Sự thống nhất và đấu tranh - Nguồn gốc, động lực phát triển',
        maxScore: 10,
        weightRatio: 0.35,
        description: 'Làm rõ tại sao đấu tranh là tuyệt đối, thống nhất là tương đối.',
        expectedKnowledgePoints:
          'Sự đấu tranh chuyển hóa mâu thuẫn dẫn đến sự sụp đổ cái cũ, ra đời cái mới; mâu thuẫn giải quyết là nguồn gốc tự thân của sự vận động, phát triển.',
      },
      {
        id: 'R-203-3',
        criteriaName: 'Lý giải vì sao là hạt nhân của phép biện chứng & phương pháp luận',
        maxScore: 10,
        weightRatio: 0.3,
        description: 'Chỉ ra mâu thuẫn chỉ ra nguồn gốc sâu xa của vận động phát triển.',
        expectedKnowledgePoints:
          'Quy luật mâu thuẫn vạch ra nguồn gốc động lực bên trong; nắm được mâu thuẫn là nắm được chìa khóa giải quyết vấn đề.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MOCK_QUESTIONS_ML;
}

function saveStoredQuestions(questions: Question[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // ignore
  }
}

/**
 * GET /questions
 * Lấy danh sách câu hỏi trong ngân hàng đề, hỗ trợ filter theo topicId/chapter, bloomLevel, status
 */
export const getQuestions = async (params?: QuestionFilterParams): Promise<Question[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Question[]> | Question[]>('/questions', {
      params,
    });
    const data = (response.data as ApiResponse<Question[]>)?.data ?? (response.data as Question[]);
    if (Array.isArray(data) && data.length > 0) {
      saveStoredQuestions(data);
      return data;
    }
    return getStoredQuestions();
  } catch {
    // Fallback sang dữ liệu local Chủ nghĩa Mác - Lênin
    let list = getStoredQuestions();
    if (params) {
      if (params.topicId && params.topicId !== 'ALL') {
        list = list.filter((q) => String(q.topicId) === String(params.topicId));
      }
      if (params.bloomLevel && params.bloomLevel !== 'ALL') {
        list = list.filter((q) => q.bloomLevel === params.bloomLevel);
      }
      if (params.status && params.status !== 'ALL') {
        list = list.filter((q) => q.status === params.status);
      }
      if (params.keyword && params.keyword.trim()) {
        const kw = params.keyword.toLowerCase().trim();
        list = list.filter(
          (q) =>
            (q.content && q.content.toLowerCase().includes(kw)) ||
            (q.questionText && q.questionText.toLowerCase().includes(kw)) ||
            (q.topicName && q.topicName.toLowerCase().includes(kw)) ||
            (q.chapter && q.chapter.toLowerCase().includes(kw)),
        );
      }
    }
    return list;
  }
};

/**
 * GET /questions/{id}
 */
export const getQuestionById = async (id: string | number): Promise<Question | null> => {
  try {
    const response = await apiClient.get<ApiResponse<Question> | Question>(`/questions/${id}`);
    return (response.data as ApiResponse<Question>)?.data ?? (response.data as Question);
  } catch {
    const list = getStoredQuestions();
    return list.find((q) => String(q.id) === String(id)) || null;
  }
};

/**
 * POST /questions
 * Tạo mới câu hỏi kèm rubrics đánh giá
 */
export const createQuestion = async (payload: CreateQuestionRequest): Promise<Question> => {
  const topicObj = DEFAULT_TOPICS.find((t) => String(t.id) === String(payload.topicId));
  const textContent = payload.content || payload.questionText || '';
  const chapterName = payload.chapter || topicObj?.name || `Chương #${payload.topicId}`;

  const newQuestion: Question = {
    id: `ML-Q${Date.now().toString().slice(-4)}`,
    content: textContent,
    questionText: textContent,
    chapter: chapterName,
    topic: chapterName,
    topicId: payload.topicId,
    topicName: chapterName,
    bloomLevel: payload.bloomLevel,
    status: payload.status || 'PENDING',
    sourceType: payload.sourceType || 'MANUAL',
    createdBy: payload.createdBy || 'TS. Nguyễn Thị Minh',
    rubrics: payload.rubrics.map((r, idx) => ({
      ...r,
      id: `R-${Date.now().toString().slice(-4)}-${idx + 1}`,
      maxScore: r.maxScore || 10,
      description: r.description || r.expectedKnowledgePoints,
      expectedKnowledgePoints: r.expectedKnowledgePoints || r.description || '',
    })),
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await apiClient.post<ApiResponse<Question> | Question>('/questions', payload);
    const data = (response.data as ApiResponse<Question>)?.data ?? (response.data as Question);
    const currentList = getStoredQuestions();
    saveStoredQuestions([data || newQuestion, ...currentList]);
    return data || newQuestion;
  } catch {
    const currentList = getStoredQuestions();
    const updated = [newQuestion, ...currentList];
    saveStoredQuestions(updated);
    return newQuestion;
  }
};

/**
 * PATCH /questions/{id}/status
 */
export const updateQuestionStatus = async (
  id: string | number,
  status: QuestionStatus,
): Promise<Question> => {
  try {
    const response = await apiClient.patch<ApiResponse<Question> | Question>(
      `/questions/${id}/status`,
      { status },
    );
    const data = (response.data as ApiResponse<Question>)?.data ?? (response.data as Question);

    const currentList = getStoredQuestions();
    const updated = currentList.map((q) => {
      if (String(q.id) === String(id)) {
        return data ? { ...q, ...data } : { ...q, status };
      }
      return q;
    });
    saveStoredQuestions(updated);

    return data || updated.find((q) => String(q.id) === String(id))!;
  } catch {
    const currentList = getStoredQuestions();
    let updatedItem: Question | null = null;
    const updated = currentList.map((q) => {
      if (String(q.id) === String(id)) {
        updatedItem = { ...q, status, updatedAt: new Date().toISOString() };
        return updatedItem;
      }
      return q;
    });
    saveStoredQuestions(updated);
    if (!updatedItem) {
      throw new Error(`Không tìm thấy câu hỏi có mã ${id}.`);
    }
    return updatedItem;
  }
};

/**
 * GET /questions/{id}/rubrics
 */
export const getQuestionRubrics = async (questionId: string | number): Promise<RubricCriteria[]> => {
  try {
    const response = await apiClient.get<ApiResponse<RubricCriteria[]> | RubricCriteria[]>(
      `/questions/${questionId}/rubrics`,
    );
    return (
      (response.data as ApiResponse<RubricCriteria[]>)?.data ??
      (response.data as RubricCriteria[]) ??
      []
    );
  } catch {
    const question = (await getQuestionById(questionId)) || null;
    return question?.rubrics || [];
  }
};

/**
 * POST /questions/{id}/rubrics
 */
export const createQuestionRubrics = async (
  questionId: string | number,
  rubricsPayload: RubricCriteria | RubricCriteria[],
): Promise<RubricCriteria[]> => {
  try {
    const response = await apiClient.post<ApiResponse<RubricCriteria[]> | RubricCriteria[]>(
      `/questions/${questionId}/rubrics`,
      rubricsPayload,
    );
    const data =
      (response.data as ApiResponse<RubricCriteria[]>)?.data ??
      (response.data as RubricCriteria[]) ??
      [];
    return Array.isArray(data) ? data : [data];
  } catch {
    const newItems = Array.isArray(rubricsPayload) ? rubricsPayload : [rubricsPayload];
    const currentList = getStoredQuestions();
    const updated = currentList.map((q) => {
      if (String(q.id) === String(questionId)) {
        return {
          ...q,
          rubrics: [...q.rubrics, ...newItems],
        };
      }
      return q;
    });
    saveStoredQuestions(updated);
    const target = updated.find((q) => String(q.id) === String(questionId));
    return target?.rubrics || [];
  }
};

export default {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestionStatus,
  getQuestionRubrics,
  createQuestionRubrics,
  DEFAULT_TOPICS,
  INITIAL_MOCK_QUESTIONS_ML,
};
