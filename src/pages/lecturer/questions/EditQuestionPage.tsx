import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Question, QuestionStatus, BloomLevel, RubricCriteria } from '../../../types/question';
import {
  getQuestionById,
  createRubric,
  DEFAULT_TOPICS,
} from '../../../services/question/questionService';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

export default function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Form states
  const [questionText, setQuestionText] = useState<string>('');
  const [topicId, setTopicId] = useState<string>(DEFAULT_TOPICS[0].id);
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('UNDERSTAND');
  const [status, setStatus] = useState<QuestionStatus>('APPROVED');
  const [rubrics, setRubrics] = useState<RubricCriteria[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id: toastId, type, message }]);
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  useEffect(() => {
    if (!id) return;
    const fetchQuestion = async () => {
      setIsLoading(true);
      try {
        const data = await getQuestionById(id);
        if (data) {
          setQuestionText(data.content || data.questionText);
          setTopicId(data.topicId || DEFAULT_TOPICS[0].id);
          setBloomLevel(data.bloomLevel || 'UNDERSTAND');
          setStatus(data.status || 'APPROVED');
          setRubrics(
            data.rubrics && data.rubrics.length > 0
              ? data.rubrics
              : [
                  {
                    criteriaName: 'Độ chuẩn xác kiến thức trọng tâm',
                    expectedKnowledgePoints: data.content || data.questionText,
                    weightRatio: 0.6,
                    maxScore: 10,
                  },
                  {
                    criteriaName: 'Khả năng biện luận và xử lý tình huống',
                    expectedKnowledgePoints: 'Trả lời tự tin, mạch lạc khi AI hỏi đào sâu.',
                    weightRatio: 0.4,
                    maxScore: 10,
                  },
                ],
          );
        } else {
          setErrorMessage('Không tìm thấy câu hỏi.');
        }
      } catch (err: any) {
        setErrorMessage('Lỗi khi tải thông tin câu hỏi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const handleRubricChange = (index: number, field: keyof RubricCriteria, val: any) => {
    setRubrics((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddRubric = () => {
    setRubrics((prev) => [
      ...prev,
      {
        criteriaName: '',
        expectedKnowledgePoints: '',
        weightRatio: 0.2,
        maxScore: 10,
      },
    ]);
  };

  const handleRemoveRubric = (index: number) => {
    if (rubrics.length <= 1) {
      addToast('warning', 'Câu hỏi cần có tối thiểu 1 tiêu chí Rubric đánh giá.');
      return;
    }
    setRubrics((prev) => prev.filter((_, i) => i !== index));
  };

  const totalWeight = rubrics.reduce((acc, r) => acc + (Number(r.weightRatio) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) <= 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      addToast('warning', 'Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    if (!isWeightValid) {
      addToast(
        'warning',
        `Tổng trọng số tiêu chí rubric hiện là ${(totalWeight * 100).toFixed(0)}%. Vui lòng điều chỉnh để tròn 100%.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Lưu lại rubrics qua API POST /api/rubrics
      if (id) {
        for (const r of rubrics) {
          await createRubric({
            questionId: id,
            criteriaName: r.criteriaName,
            expectedKnowledgePoints: r.expectedKnowledgePoints,
            weightRatio: r.weightRatio,
          });
        }
      }

      addToast('success', 'Đã lưu thay đổi câu hỏi & bảng tiêu chí Rubric thành công!');
      setTimeout(() => {
        navigate(`/lecturer/questions/${id}`);
      }, 1000);
    } catch (err: any) {
      addToast('error', 'Lỗi khi cập nhật câu hỏi: ' + (err?.message || 'Thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/lecturer/questions" className="hover:text-indigo-600 transition-colors">
              Ngân hàng câu hỏi
            </Link>
            <span>/</span>
            <Link to={`/lecturer/questions/${id}`} className="hover:text-indigo-600 transition-colors font-mono">
              {id}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Chỉnh sửa</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chỉnh Sửa Câu Hỏi & Tiêu Chí Rubric
          </h1>
        </div>

        <Link
          to={`/lecturer/questions/${id}`}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
        >
          ← Hủy bỏ
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Metadata */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
            1. Thông Tin Cốt Lõi Câu Hỏi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Học phần / Môn học *
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEFAULT_TOPICS.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thang nhận thức Bloom *
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(e.target.value as BloomLevel)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="REMEMBER">Nhận biết (Remember)</option>
                <option value="UNDERSTAND">Thông hiểu (Understand)</option>
                <option value="APPLY">Vận dụng (Apply)</option>
                <option value="ANALYZE">Phân tích (Analyze)</option>
                <option value="EVALUATE">Đánh giá (Evaluate)</option>
                <option value="CREATE">Sáng tạo (Create)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái duyệt
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionStatus)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="APPROVED">Đã duyệt (APPROVED)</option>
                <option value="PENDING">Chờ duyệt (PENDING)</option>
                <option value="REJECTED">Từ chối (REJECTED)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nội dung câu hỏi vấn đáp *
            </label>
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              required
            />
          </div>
        </div>

        {/* Rubrics Editor */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                2. Bảng Tiêu Chí Chấm Rubric
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các tiêu chí chấm điểm và hướng dẫn câu trả lời kỳ vọng cho AI Giám khảo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isWeightValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                Tổng: {(totalWeight * 100).toFixed(0)}%
              </span>
              <button
                type="button"
                onClick={handleAddRubric}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                + Thêm tiêu chí
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {rubrics.map((r, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Tiêu chí #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRubric(idx)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-0.5 rounded hover:bg-rose-50"
                  >
                    ✕ Xóa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tên tiêu chí *
                    </label>
                    <input
                      type="text"
                      value={r.criteriaName}
                      onChange={(e) => handleRubricChange(idx, 'criteriaName', e.target.value)}
                      placeholder="VD: Định nghĩa chính xác nguyên lý..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trọng số (tỷ lệ 0 - 1.0) *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="1.0"
                      value={r.weightRatio}
                      onChange={(e) => handleRubricChange(idx, 'weightRatio', Number(e.target.value))}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Kiến thức cốt lõi kỳ vọng *
                  </label>
                  <textarea
                    rows={2}
                    value={r.expectedKnowledgePoints}
                    onChange={(e) => handleRubricChange(idx, 'expectedKnowledgePoints', e.target.value)}
                    placeholder="Mô tả các luận điểm, từ khóa chính thí sinh cần phân tích..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Link
            to={`/lecturer/questions/${id}`}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
