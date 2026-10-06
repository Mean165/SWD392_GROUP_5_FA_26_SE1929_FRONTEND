import React, { useState } from 'react';
import type { Question, QuestionStatus, BloomLevel } from '../../types/question';

interface QuestionTableProps {
  questions: Question[];
  onViewRubrics: (question: Question) => void;
  onStatusChange: (id: string | number, newStatus: QuestionStatus) => Promise<void>;
  isLoading?: boolean;
}

export default function QuestionTable({
  questions,
  onViewRubrics,
  onStatusChange,
  isLoading = false,
}: QuestionTableProps) {
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const handleStatusToggle = async (id: string | number, nextStatus: QuestionStatus) => {
    try {
      setUpdatingId(id);
      await onStatusChange(id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getBloomBadge = (level: BloomLevel) => {
    switch (level) {
      case 'REMEMBER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Nhận biết
          </span>
        );
      case 'UNDERSTAND':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            Thông hiểu
          </span>
        );
      case 'APPLY':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Vận dụng
          </span>
        );
      case 'ANALYZE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Phân tích
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {level}
          </span>
        );
    }
  };

  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Từ chối
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ duyệt
          </span>
        );
    }
  };

  const calculateTotalWeight = (q: Question): number => {
    if (!q.rubrics || q.rubrics.length === 0) return 0;
    return q.rubrics.reduce((acc, r) => acc + (Number(r.weightRatio) || 0), 0);
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <tr>
            <th scope="col" className="py-3.5 px-5 font-semibold text-slate-600" style={{ width: '40%' }}>
              Nội dung câu hỏi
            </th>
            <th scope="col" className="py-3.5 px-4 font-semibold text-slate-600" style={{ width: '18%' }}>
              Chương / Chủ đề
            </th>
            <th scope="col" className="py-3.5 px-4 font-semibold text-slate-600" style={{ width: '10%' }}>
              Mức độ
            </th>
            <th scope="col" className="py-3.5 px-4 font-semibold text-slate-600" style={{ width: '14%' }}>
              Tiêu chí chấm
            </th>
            <th scope="col" className="py-3.5 px-4 font-semibold text-slate-600" style={{ width: '10%' }}>
              Trạng thái
            </th>
            <th scope="col" className="py-3.5 px-5 font-semibold text-slate-600 text-center" style={{ width: '8%' }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {questions.map((question) => {
            const isUpdating = updatingId === question.id;
            const rubricCount = question.rubrics?.length || 0;
            const totalWeight = calculateTotalWeight(question);
            const isWeightValid = Math.abs(totalWeight - 1.0) <= 0.001;
            const displayText = question.content || question.questionText;
            const chapterText = question.chapter || question.topicName || `Chương #${question.topicId}`;

            return (
              <tr key={question.id} className="hover:bg-slate-50/60 transition-colors">
                {/* Question Text & Meta */}
                <td className="py-4 px-5 align-top">
                  <div className="font-medium text-slate-900 leading-relaxed line-clamp-3">
                    {displayText}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium">
                      Mã: {question.id}
                    </span>
                    {question.createdBy && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{question.createdBy}</span>
                      </span>
                    )}
                    {question.createdAt && (
                      <span className="text-slate-400">
                        {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </td>

                {/* Chapter / Topic */}
                <td className="py-4 px-4 align-top">
                  <span
                    className="inline-block bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg line-clamp-2 max-w-[200px]"
                    title={chapterText}
                  >
                    {chapterText}
                  </span>
                </td>

                {/* Bloom Level */}
                <td className="py-4 px-4 align-top whitespace-nowrap">
                  {getBloomBadge(question.bloomLevel)}
                </td>

                {/* Rubric Tag & Trigger */}
                <td className="py-4 px-4 align-top">
                  <button
                    type="button"
                    onClick={() => onViewRubrics(question)}
                    className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60 font-medium px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer w-full max-w-[150px]"
                    title="Xem chi tiết các tiêu chí chấm Rubric"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span>{rubricCount} tiêu chí</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isWeightValid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                      title={`Tổng trọng số: ${(totalWeight * 100).toFixed(0)}%`}
                    >
                      {(totalWeight * 100).toFixed(0)}%
                    </span>
                  </button>
                </td>

                {/* Status Badge */}
                <td className="py-4 px-4 align-top whitespace-nowrap">
                  {getStatusBadge(question.status)}
                </td>

                {/* Action Buttons */}
                <td className="py-4 px-5 align-top text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    {question.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(question.id, 'APPROVED')}
                        disabled={isLoading || isUpdating}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 active:scale-95 flex items-center gap-1 disabled:opacity-50 shadow-xs"
                        title="Duyệt câu hỏi này"
                      >
                        ✓ Duyệt
                      </button>
                    )}
                    {question.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(question.id, 'REJECTED')}
                        disabled={isLoading || isUpdating}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 active:scale-95 flex items-center gap-1 disabled:opacity-50 shadow-xs"
                        title="Từ chối câu hỏi này"
                      >
                        ✕ Từ chối
                      </button>
                    )}
                    {question.status !== 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(question.id, 'PENDING')}
                        disabled={isLoading || isUpdating}
                        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 active:scale-95 flex items-center gap-1 disabled:opacity-50 shadow-xs"
                        title="Chuyển về trạng thái chờ duyệt"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
