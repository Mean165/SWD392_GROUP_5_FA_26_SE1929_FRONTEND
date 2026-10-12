import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BloomLevel } from '../../../types/question';
import {
  generateQuestion,
  createQuestion,
  DEFAULT_TOPICS,
  getTopicNameById,
} from '../../../services/question/questionService';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

export default function GenerateQuestionPage() {
  const navigate = useNavigate();

  // Form inputs
  const [topicId, setTopicId] = useState<string>(DEFAULT_TOPICS[0].id);
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('ANALYZE');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(1);
  const [prompt, setPrompt] = useState<string>(
    'Sinh câu hỏi phỏng vấn chuyên sâu về nguyên lý phân tách trách nhiệm trong Microservices và cách thức giải quyết bài toán đồng bộ dữ liệu bằng Saga Pattern.',
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      addToast('warning', 'Vui lòng nhập nội dung prompt yêu cầu cho AI.');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);

    const topicObj = DEFAULT_TOPICS.find((t) => t.id === topicId);

    try {
      const result = await generateQuestion({
        prompt: prompt.trim(),
        subjectCode: topicObj?.code || 'SWD392',
        topicCode: topicId,
        numberOfQuestions: numberOfQuestions,
      });

      setGeneratedResult(result);
      addToast('success', 'AI đã sinh câu hỏi & rubric thành công! Bạn có thể xem trước và lưu vào ngân hàng.');
    } catch (err: any) {
      console.error('Error generating question with AI:', err);
      addToast('error', 'Lỗi khi gọi API AI sinh câu hỏi: ' + (err?.message || 'Thất bại'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToBank = async () => {
    if (!generatedResult) return;
    setIsSaving(true);
    try {
      const topicObj = DEFAULT_TOPICS.find((t) => t.id === topicId);
      const text = generatedResult.questionText || prompt;
      const rubrics = generatedResult.suggestedRubrics || [
        {
          criteriaName: 'Độ chính xác và tính toàn vẹn câu trả lời',
          expectedKnowledgePoints: text,
          weightRatio: 0.5,
          maxScore: 10,
        },
        {
          criteriaName: 'Khả năng phân tích sâu và xử lý tình huống',
          expectedKnowledgePoints: 'Trả lời lưu loát khi giám khảo AI hỏi xoáy.',
          weightRatio: 0.5,
          maxScore: 10,
        },
      ];

      await createQuestion({
        questionText: text,
        content: text,
        topicId: topicId,
        topicName: topicObj?.name,
        bloomLevel: (generatedResult.bloomLevel as BloomLevel) || bloomLevel,
        sourceType: 'AI_GENERATED',
        status: 'APPROVED',
        rubrics,
      });

      addToast('success', 'Đã lưu câu hỏi do AI sinh vào Ngân hàng câu hỏi thành công!');
      setTimeout(() => {
        navigate('/lecturer/questions');
      }, 1000);
    } catch (err: any) {
      addToast('error', 'Lỗi khi lưu câu hỏi: ' + (err?.message || 'Không thể lưu'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <Link to="/lecturer/questions" className="hover:text-indigo-600 transition-colors">
              Ngân hàng câu hỏi
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Sinh câu hỏi với AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>✨ Sinh Câu Hỏi Vấn Đáp Bằng AI Giám Khảo</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối API <code>POST /api/questions/generate</code>. Hệ thống AI tự động đề xuất câu hỏi theo chuẩn thang nhận thức Bloom và sinh kèm bảng tiêu chí Rubric.
          </p>
        </div>

        <Link
          to="/lecturer/questions"
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-xs"
        >
          ← Quay lại ngân hàng
        </Link>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Select Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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

          {/* Select Bloom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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

          {/* Question count */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Số lượng câu hỏi sinh
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Prompt Textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Prompt / Yêu cầu chi tiết gửi AI *
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Mô tả chủ đề, bối cảnh thực tế dự án, hoặc các khía cạnh kỹ thuật bạn muốn AI tập trung tạo câu hỏi..."
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>Gợi ý: Càng cung cấp ngữ cảnh cụ thể, AI sẽ đưa ra câu hỏi và thang Rubric càng bám sát thực tế.</span>
            <span>{prompt.length} ký tự</span>
          </div>
        </div>

        {/* Submit generate */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-purple-200 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" strokeWidth="3" />
                </svg>
                <span>AI đang phân tích & sinh câu hỏi...</span>
              </>
            ) : (
              <>
                <span>✨ Khởi tạo bằng AI</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated Result Preview */}
      {generatedResult && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">
                Kết Quả AI Đề Xuất
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700">
                {generatedResult.bloomLevel || bloomLevel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSaveToBank}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : '✓ Lưu vào ngân hàng câu hỏi'}
            </button>
          </div>

          {/* Question Text Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nội dung câu hỏi:
            </span>
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-slate-900 font-medium text-sm leading-relaxed">
              {generatedResult.questionText}
            </div>
          </div>

          {/* Rubrics Preview */}
          {generatedResult.suggestedRubrics && generatedResult.suggestedRubrics.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bảng tiêu chí Rubric AI đề xuất ({generatedResult.suggestedRubrics.length} tiêu chí):
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-3" style={{ width: '35%' }}>Tiêu chí</th>
                      <th className="p-3" style={{ width: '50%' }}>Kiến thức kỳ vọng</th>
                      <th className="p-3 text-center" style={{ width: '15%' }}>Trọng số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedResult.suggestedRubrics.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800 align-top">{r.criteriaName}</td>
                        <td className="p-3 text-slate-600 align-top">{r.expectedKnowledgePoints}</td>
                        <td className="p-3 text-center font-bold text-purple-700 align-top">
                          {(Number(r.weightRatio) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
