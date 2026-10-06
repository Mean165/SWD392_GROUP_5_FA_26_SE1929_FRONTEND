import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '../../../types/question';
import { getQuestions } from '../../../services/question/questionService';

export default function RubricPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getQuestions()
      .then((data) => setQuestions(data || []))
      .finally(() => setIsLoading(false));
  }, []);

  const totalRubrics = questions.reduce((acc, q) => acc + (q.rubrics?.length || 0), 0);
  const standardizedCount = questions.filter((q) => {
    const total = (q.rubrics || []).reduce((acc, r) => acc + (Number(r.weightRatio) || 0), 0);
    return Math.abs(total - 1.0) <= 0.001;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50/60 p-8 space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tiêu chuẩn Tiêu chí chấm (Rubric Standards)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Học phần: Triết học Mác – Lênin • Bảng ma trận tiêu chí đánh giá, kiến thức kỳ vọng và phân bổ trọng số
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/lecturer/questions"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            ← Về Ngân hàng câu hỏi
          </Link>
          <Link
            to="/lecturer/questions/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center gap-2 text-sm"
          >
            + Tạo câu hỏi & Rubric mới
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Số câu hỏi có Rubric
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {questions.length}
            </div>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Đạt chuẩn 100% trọng số
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {standardizedCount}
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng số tiêu chí chi tiết
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
              {totalRubrics}
            </div>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-800">Đang tải ma trận Rubric...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-semibold text-slate-800">Chưa có bảng tiêu chí chấm nào</p>
            <p className="text-xs text-slate-500">Tạo câu hỏi trong Ngân hàng câu hỏi để thiết lập tiêu chí chấm Rubric.</p>
            <Link
              to="/lecturer/questions/create"
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all"
            >
              + Tạo câu hỏi mới
            </Link>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5" style={{ width: '30%' }}>Câu hỏi & Mã đề</th>
                  <th className="py-3.5 px-4" style={{ width: '18%' }}>Chương / Chủ đề</th>
                  <th className="py-3.5 px-4" style={{ width: '26%' }}>Các tiêu chí chấm thành phần</th>
                  <th className="py-3.5 px-4" style={{ width: '16%' }}>Kiến thức kỳ vọng</th>
                  <th className="py-3.5 px-5 text-right" style={{ width: '10%' }}>Tổng trọng số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q) => {
                  const total = (q.rubrics || []).reduce(
                    (acc, r) => acc + (Number(r.weightRatio) || 0),
                    0,
                  );
                  const isStandard = Math.abs(total - 1.0) <= 0.001;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 align-top">
                        <div className="font-medium text-slate-900 line-clamp-3">
                          {q.content || q.questionText}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                            Mã: {q.id}
                          </span>
                          {q.createdBy && <span className="text-slate-600">• {q.createdBy}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <span className="inline-block bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                          {q.chapter || q.topicName || `Chương #${q.topicId}`}
                        </span>
                      </td>
                      <td className="py-4 px-4 align-top space-y-1.5">
                        {(q.rubrics || []).map((r, i) => (
                          <div key={i} className="text-xs flex items-center justify-between gap-2">
                            <span className="text-slate-800 font-medium">#{i + 1} {r.criteriaName}</span>
                            <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              {(Number(r.weightRatio) * 100).toFixed(0)}% ({r.maxScore || 10}đ)
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="py-4 px-4 align-top space-y-1.5 text-xs text-slate-500 leading-relaxed">
                        {(q.rubrics || []).map((r, i) => (
                          <div key={i} className="line-clamp-2">
                            • {r.expectedKnowledgePoints || r.description}
                          </div>
                        ))}
                      </td>
                      <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                            isStandard
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          {(total * 100).toFixed(0)}% {isStandard ? '✓ Chuẩn' : '⚠'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
