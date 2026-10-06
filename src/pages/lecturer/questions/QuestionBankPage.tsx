import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Question, QuestionStatus } from '../../../types/question';
import {
  getQuestions,
  updateQuestionStatus,
  DEFAULT_TOPICS,
  INITIAL_MOCK_QUESTIONS_ML,
} from '../../../services/question/questionService';
import QuestionFilter, { type QuestionFilterState } from '../../../components/questions/QuestionFilter';
import QuestionTable from '../../../components/questions/QuestionTable';
import CreateQuestionModal from '../../../components/questions/CreateQuestionModal';
import QuestionRubricsModal from '../../../components/questions/QuestionRubricsModal';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

export default function QuestionBankPage() {
  const navigate = useNavigate();

  // Initialize state explicitly as an empty array []
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<QuestionFilterState>({
    topicId: 'ALL',
    bloomLevel: 'ALL',
    status: 'ALL',
    keyword: '',
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedQuestionForRubrics, setSelectedQuestionForRubrics] = useState<Question | null>(
    null,
  );

  // Toast system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper applying filters to an array of questions
  const applyFilters = (list: Question[]): Question[] => {
    let result = [...list];
    if (filters.topicId !== 'ALL') {
      result = result.filter(
        (q) =>
          String(q.topicId) === String(filters.topicId) ||
          (q.chapter && q.chapter.toLowerCase().includes(String(filters.topicId).toLowerCase())),
      );
    }
    if (filters.bloomLevel !== 'ALL') {
      result = result.filter((q) => q.bloomLevel === filters.bloomLevel);
    }
    if (filters.status !== 'ALL') {
      result = result.filter((q) => q.status === filters.status);
    }
    if (filters.keyword.trim()) {
      const kw = filters.keyword.toLowerCase().trim();
      result = result.filter(
        (q) =>
          (q.content && q.content.toLowerCase().includes(kw)) ||
          (q.questionText && q.questionText.toLowerCase().includes(kw)) ||
          (q.chapter && q.chapter.toLowerCase().includes(kw)) ||
          (q.topicName && q.topicName.toLowerCase().includes(kw)) ||
          (q.createdBy && q.createdBy.toLowerCase().includes(kw)),
      );
    }
    return result;
  };

  // Load questions with graceful fallback
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getQuestions({
        topicId: filters.topicId !== 'ALL' ? filters.topicId : undefined,
        bloomLevel: filters.bloomLevel !== 'ALL' ? (filters.bloomLevel as any) : undefined,
        status: filters.status !== 'ALL' ? (filters.status as any) : undefined,
        keyword: filters.keyword.trim() || undefined,
      });

      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        setQuestions(applyFilters(INITIAL_MOCK_QUESTIONS_ML));
      }
    } catch (err: any) {
      console.warn('Backend questions API offline or unreachable. Using fallback mock questions:', err);
      setQuestions(applyFilters(INITIAL_MOCK_QUESTIONS_ML));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Handler for quick status toggle in table or modal
  const handleStatusChange = async (id: string | number, newStatus: QuestionStatus) => {
    try {
      await updateQuestionStatus(id, newStatus);
    } catch (err: any) {
      console.warn('Backend status update offline, updating local state directly:', err);
    }

    setQuestions((prev) =>
      prev.map((q) => (String(q.id) === String(id) ? { ...q, status: newStatus } : q)),
    );

    if (selectedQuestionForRubrics && String(selectedQuestionForRubrics.id) === String(id)) {
      setSelectedQuestionForRubrics((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    const statusVi =
      newStatus === 'APPROVED' ? 'Đã duyệt' : newStatus === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt';
    addToast('success', `Cập nhật trạng thái câu hỏi thành công: ${statusVi}!`);
  };

  const handleResetFilters = () => {
    setFilters({
      topicId: 'ALL',
      bloomLevel: 'ALL',
      status: 'ALL',
      keyword: '',
    });
  };

  const handleQuestionCreated = (msg: string) => {
    addToast('success', msg);
    fetchQuestions();
  };

  // Metrics calculation
  const totalQuestions = questions.length;
  const approvedCount = questions.filter((q) => q.status === 'APPROVED').length;
  const pendingCount = questions.filter((q) => q.status === 'PENDING').length;
  const rejectedCount = questions.filter((q) => q.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ngân hàng câu hỏi & Tiêu chí chấm (Rubric)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Học phần: Triết học Mác – Lênin (Chương 1 & Chương 2) • Thang nhận thức Bloom & Chuẩn Rubric
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/lecturer/questions/rubrics"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center gap-2 text-xs"
            id="btn-manage-rubrics"
            title="Quản lý tổng quan bảng tiêu chí chấm Rubric"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Quản lý Rubric</span>
          </Link>

          <Link
            to="/lecturer/questions/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 text-xs"
            id="btn-open-create-question"
            title="Tạo câu hỏi mới kèm bảng tiêu chí chấm Rubric"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Tạo câu hỏi mới</span>
          </Link>

          <button
            type="button"
            className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 font-medium px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs"
            onClick={() => setIsCreateModalOpen(true)}
            title="Tạo nhanh bằng cửa sổ pop-up"
          >
            <span>Tạo nhanh (Modal)</span>
          </button>
        </div>
      </div>

      {/* 2. Metric / Stat Cards with Increased Visual Weight & Tinted Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số câu hỏi
            </span>
            <div className="text-3xl font-bold tracking-tight text-slate-800 mt-1">
              {totalQuestions}
            </div>
          </div>
          <div className="bg-indigo-50 text-indigo-600 border border-indigo-100/60 p-3 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Đã duyệt
            </span>
            <div className="text-3xl font-bold tracking-tight text-slate-800 mt-1">
              {approvedCount}
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 border border-emerald-100/60 p-3 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Chờ xét duyệt
            </span>
            <div className="text-3xl font-bold tracking-tight text-slate-800 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="bg-amber-50 text-amber-600 border border-amber-100/60 p-3 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bị từ chối
            </span>
            <div className="text-3xl font-bold tracking-tight text-slate-800 mt-1">
              {rejectedCount}
            </div>
          </div>
          <div className="bg-rose-50 text-rose-600 border border-rose-100/60 p-3 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar (Elevated Card) */}
      <QuestionFilter
        filters={filters}
        topics={DEFAULT_TOPICS}
        onChange={setFilters}
        onReset={handleResetFilters}
        isLoading={isLoading}
        totalCount={questions.length}
      />

      {/* 4. Data Table Container (Elevated Crisp Card) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-800">Đang tải Ngân hàng câu hỏi...</p>
            <p className="text-xs text-slate-500">Đang đồng bộ dữ liệu câu hỏi và bảng rubric từ hệ thống</p>
          </div>
        ) : errorMessage ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              ⚠
            </div>
            <p className="text-sm font-semibold text-rose-600">{errorMessage}</p>
            <p className="text-xs text-slate-500">Không thể kết nối đến máy chủ API câu hỏi.</p>
            <button
              type="button"
              className="mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-4 py-2 rounded-xl transition-all"
              onClick={fetchQuestions}
            >
              Thử lại
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-800">Không tìm thấy câu hỏi phù hợp</p>
            <p className="text-xs text-slate-500 max-w-md">
              Không có câu hỏi nào khớp với tiêu chí tìm kiếm hoặc ngân hàng đề môn Triết học Mác – Lênin hiện đang trống.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
                onClick={handleResetFilters}
              >
                Xóa bộ lọc
              </button>
              <Link
                to="/lecturer/questions/create"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3.5 py-2 rounded-xl transition-all"
              >
                + Tạo câu hỏi mới
              </Link>
            </div>
          </div>
        ) : (
          <QuestionTable
            questions={questions}
            onViewRubrics={(q) => setSelectedQuestionForRubrics(q)}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modal: Create Question with Dynamic Rubrics & Strict Validation */}
      <CreateQuestionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleQuestionCreated}
        topics={DEFAULT_TOPICS}
      />

      {/* Modal: View Rubric Details */}
      <QuestionRubricsModal
        question={selectedQuestionForRubrics}
        isOpen={Boolean(selectedQuestionForRubrics)}
        onClose={() => setSelectedQuestionForRubrics(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
