import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Question, QuestionStatus, BloomLevel } from '../../../types/question';
import {
  getQuestionById,
  deleteQuestion,
  updateQuestionStatus,
} from '../../../services/question/questionService';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id: toastId, type, message }]);
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getQuestionById(id);
        if (data) {
          setQuestion(data);
        } else {
          setErrorMessage(`Không tìm thấy câu hỏi với mã "${id}".`);
        }
      } catch (err: any) {
        console.error('Error fetching question detail:', err);
        setErrorMessage('Không thể tải thông tin câu hỏi từ hệ thống backend.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !question) return;
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng câu hỏi? Hành động này không thể hoàn tác.',
    );
    if (!confirmed) return;

    try {
      await deleteQuestion(id);
      alert('Đã xóa câu hỏi thành công!');
      navigate('/lecturer/questions');
    } catch (err: any) {
      addToast('error', 'Lỗi khi xóa câu hỏi: ' + (err?.message || 'Không thể xóa'));
    }
  };

  const handleStatusChange = async (newStatus: QuestionStatus) => {
    if (!id || !question) return;
    try {
      await updateQuestionStatus(id, newStatus);
      setQuestion((prev) => (prev ? { ...prev, status: newStatus } : null));
      const statusVi =
        newStatus === 'APPROVED' ? 'Đã duyệt' : newStatus === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt';
      addToast('success', `Đã cập nhật trạng thái: ${statusVi}!`);
    } catch (err: any) {
      addToast('error', 'Lỗi cập nhật trạng thái: ' + (err?.message || 'Thất bại'));
    }
  };

  const getBloomBadge = (level: BloomLevel) => {
    switch (level) {
      case 'REMEMBER':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Nhận biết (Remember)</span>;
      case 'UNDERSTAND':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Thông hiểu (Understand)</span>;
      case 'APPLY':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Vận dụng (Apply)</span>;
      case 'ANALYZE':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Phân tích (Analyze)</span>;
      case 'EVALUATE':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">Đánh giá (Evaluate)</span>;
      case 'CREATE':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Sáng tạo (Create)</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{level}</span>;
    }
  };

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Đã duyệt (Approved)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Từ chối (Rejected)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Chờ duyệt (Pending)
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse flex items-center justify-between">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-9 w-32 bg-slate-200 rounded-xl" />
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 space-y-4 animate-pulse">
          <div className="h-6 w-3/4 bg-slate-200 rounded" />
          <div className="h-4 w-1/2 bg-slate-200 rounded" />
          <div className="h-28 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (errorMessage || !question) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center font-bold text-lg">
          ⚠
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy câu hỏi</h2>
        <p className="text-sm text-slate-500">{errorMessage || 'Câu hỏi không tồn tại trong hệ thống.'}</p>
        <Link
          to="/lecturer/questions"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
        >
          ← Quay lại danh sách câu hỏi
        </Link>
      </div>
    );
  }

  const rubrics = question.rubrics || [];
  const totalWeight = rubrics.reduce((acc, r) => acc + (Number(r.weightRatio) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) <= 0.001;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/lecturer/questions" className="hover:text-indigo-600 transition-colors">
              Ngân hàng câu hỏi
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold font-mono">{question.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Chi Tiết Câu Hỏi & Bảng Tiêu Chí Rubric
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/lecturer/questions"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs"
          >
            ← Danh sách
          </Link>
          <Link
            to={`/lecturer/questions/${id || question.id}/edit`}
            onClick={() => navigate(`/lecturer/questions/${id || question.id}/edit`)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Chỉnh sửa câu hỏi & Rubrics"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <span>Chỉnh sửa</span>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Xóa câu hỏi</span>
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            {getBloomBadge(question.bloomLevel)}
            {getStatusBadge(question.status)}
            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              UUID: {question.id}
            </span>
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-2">
            {question.status !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('APPROVED')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs"
              >
                ✓ Duyệt câu hỏi
              </button>
            )}
            {question.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('REJECTED')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-xs px-3 py-1.5 rounded-lg transition-all"
              >
                ✕ Từ chối
              </button>
            )}
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nội dung câu hỏi vấn đáp
          </span>
          <div className="text-base text-slate-900 leading-relaxed font-medium bg-slate-50/80 p-5 rounded-xl border border-slate-200/60">
            {question.content || question.questionText}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <span className="text-xs text-slate-500 font-medium">Học phần / Chủ đề</span>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {question.topicName || question.chapter || question.topicId}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <span className="text-xs text-slate-500 font-medium">Nguồn khởi tạo</span>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {question.sourceType === 'AI_GENERATED' ? '🤖 Sinh bởi AI' : '👤 Giảng viên biên soạn'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <span className="text-xs text-slate-500 font-medium">Người tạo</span>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {question.createdBy || 'TS. Nguyễn Hoàng Nam'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200/50">
            <span className="text-xs text-slate-500 font-medium">Ngày tạo</span>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              {question.createdAt ? new Date(question.createdAt).toLocaleString('vi-VN') : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Criteria Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bảng Tiêu Chí Chấm Rubric</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống AI giám khảo sẽ căn cứ vào các tiêu chí này để chấm điểm câu trả lời và hỏi xoáy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tổng trọng số:</span>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                isWeightValid
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {(totalWeight * 100).toFixed(0)}% {isWeightValid ? '(Hợp lệ 100%)' : '(Chưa chuẩn 100%)'}
            </span>
          </div>
        </div>

        {rubrics.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Chưa có tiêu chí Rubric nào được gắn cho câu hỏi này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4" style={{ width: '5%' }}>STT</th>
                  <th className="py-3 px-4" style={{ width: '25%' }}>Tiêu chí đánh giá</th>
                  <th className="py-3 px-4" style={{ width: '45%' }}>Kiến thức cốt lõi kỳ vọng</th>
                  <th className="py-3 px-4 text-center" style={{ width: '12%' }}>Trọng số</th>
                  <th className="py-3 px-4 text-center" style={{ width: '13%' }}>Thang điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rubrics.map((r, idx) => (
                  <tr key={r.id || r.criteriaId || idx} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-slate-900">{r.criteriaName}</div>
                      {r.description && (
                        <div className="text-xs text-slate-500 mt-1">{r.description}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 align-top text-slate-700 leading-relaxed text-xs">
                      {r.expectedKnowledgePoints}
                    </td>
                    <td className="py-3.5 px-4 align-top text-center">
                      <span className="inline-block bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs">
                        {(Number(r.weightRatio) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 align-top text-center font-medium text-slate-600">
                      {r.maxScore || 10} điểm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
