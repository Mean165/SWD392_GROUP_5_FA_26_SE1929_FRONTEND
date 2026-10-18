import React, { useState } from 'react';
import type { Question, QuestionStatus } from '../../types/question';

interface QuestionRubricsModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string | number, status: QuestionStatus) => Promise<void>;
}

export default function QuestionRubricsModal({
  question,
  isOpen,
  onClose,
  onStatusChange,
}: QuestionRubricsModalProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !question) return null;

  const totalWeight =
    question.rubrics?.reduce((acc, r) => acc + (Number(r.weightRatio) || 0), 0) || 0;
  const isWeightValid = Math.abs(totalWeight - 1.0) <= 0.001;

  const handleStatus = async (status: QuestionStatus) => {
    try {
      setIsUpdatingStatus(true);
      await onStatusChange(question.id, status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getBloomLabel = (level: string) => {
    switch (level) {
      case 'REMEMBER':
        return 'Nhận biết (Remember)';
      case 'UNDERSTAND':
        return 'Thông hiểu (Understand)';
      case 'APPLY':
        return 'Vận dụng (Apply)';
      case 'ANALYZE':
        return 'Phân tích (Analyze)';
      default:
        return level;
    }
  };

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Từ chối
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rubric-details-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 id="rubric-details-title" className="text-lg font-bold text-slate-900">
              Chi tiết Tiêu chí chấm (Rubric)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mã: {question.id} • {question.chapter || question.topicName || `Chương #${question.topicId}`}
            </p>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Question Text Box */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nội dung câu hỏi thi vấn đáp
            </div>
            <p className="text-sm font-medium text-slate-900 leading-relaxed">
              {question.content || question.questionText}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap pt-1 border-t border-slate-200/40">
              <span>
                <strong>Mức độ:</strong> {getBloomLabel(question.bloomLevel)}
              </span>
              <span>
                <strong>Trạng thái:</strong> {getStatusBadge(question.status)}
              </span>
              {question.createdBy && (
                <span>
                  <strong>Giảng viên:</strong> {question.createdBy}
                </span>
              )}
            </div>
          </div>

          {/* Rubrics breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900">
                Bảng phân rã Tiêu chí chấm ({question.rubrics?.length || 0} tiêu chí)
              </h4>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isWeightValid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                }`}
              >
                Tổng trọng số: {(totalWeight * 100).toFixed(0)}% ({totalWeight.toFixed(2)})
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3" style={{ width: '6%' }}>#</th>
                    <th className="py-2.5 px-3" style={{ width: '30%' }}>Tiêu chí chấm</th>
                    <th className="py-2.5 px-3 text-center" style={{ width: '12%' }}>Thang điểm</th>
                    <th className="py-2.5 px-3 text-center" style={{ width: '14%' }}>Trọng số</th>
                    <th className="py-2.5 px-3" style={{ width: '38%' }}>Kiến thức kỳ vọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {question.rubrics && question.rubrics.length > 0 ? (
                    question.rubrics.map((r, index) => (
                      <tr key={r.id || index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-400">#{index + 1}</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 font-semibold">{r.criteriaName}</strong>
                          {r.description && r.description !== r.expectedKnowledgePoints && (
                            <div className="text-[11px] text-slate-500 mt-0.5">{r.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {r.maxScore || 10} đ
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px]">
                            {(Number(r.weightRatio) * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 leading-relaxed">
                          {r.expectedKnowledgePoints || r.description || 'Chưa thiết lập mô tả.'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Chưa có tiêu chí chấm nào được thiết lập cho câu hỏi này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Quick Actions */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">Cập nhật nhanh trạng thái:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStatus('APPROVED')}
                disabled={isUpdatingStatus || question.status === 'APPROVED'}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 transition-all disabled:opacity-40"
              >
                ✓ Duyệt câu hỏi
              </button>
              <button
                type="button"
                onClick={() => handleStatus('REJECTED')}
                disabled={isUpdatingStatus || question.status === 'REJECTED'}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 transition-all disabled:opacity-40"
              >
                ✕ Từ chối
              </button>
              <button
                type="button"
                onClick={() => handleStatus('PENDING')}
                disabled={isUpdatingStatus || question.status === 'PENDING'}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-40"
              >
                ↺ Đặt lại Chờ duyệt
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/40 flex justify-end">
          <button
            type="button"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
