import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { BloomLevel, Topic, CreateQuestionRequest } from '../../../types/question';
import { createQuestion, DEFAULT_TOPICS } from '../../../services/question/questionService';
import Toast, { type ToastMessage } from '../../../components/common/Toast';

interface RubricRowState {
  id: string;
  criteriaName: string;
  maxScore: number;
  weightRatio: number | string;
  expectedKnowledgePoints: string;
  description: string;
}

export default function CreateQuestionPage() {
  const navigate = useNavigate();
  const topics: Topic[] = DEFAULT_TOPICS;

  // Form Fields
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ? String(topics[0].id) : 'ch-1');
  const [content, setContent] = useState<string>('');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('UNDERSTAND');
  const [createdBy, setCreatedBy] = useState<string>('TS. Nguyễn Thị Minh (Bộ môn Triết học)');
  const sourceType = 'MANUAL';

  // Dynamic Rubric state - Khởi tạo sẵn 2 tiêu chí mẫu có tổng trọng số = 1.00 (100%)
  const [rubrics, setRubrics] = useState<RubricRowState[]>([
    {
      id: 'crit-1',
      criteriaName: 'Nội dung lý luận cơ bản & chuẩn xác khái niệm',
      maxScore: 10,
      weightRatio: 0.5,
      expectedKnowledgePoints:
        'Trình bày chính xác định nghĩa, nội dung nguyên lý hoặc quy luật triết học theo giáo trình chuẩn Bộ GD&ĐT.',
      description: 'Đạt tối đa khi trình bày đầy đủ định nghĩa và thuật ngữ triết học chính xác.',
    },
    {
      id: 'crit-2',
      criteriaName: 'Ý nghĩa phương pháp luận & vận dụng thực tiễn',
      maxScore: 10,
      weightRatio: 0.5,
      expectedKnowledgePoints:
        'Rút ra bài học phương pháp luận đúng đắn, phê phán các quan điểm sai lầm, liên hệ với thực tiễn học tập và xã hội.',
      description: 'Đạt tối đa khi liên hệ được với thực tiễn cách mạng Việt Nam hoặc rèn luyện bản thân.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // STRICT VALIDATION: Tính tổng real-time của weightRatio
  const calculateTotalWeight = (): number => {
    return rubrics.reduce((acc, row) => {
      const val = parseFloat(String(row.weightRatio));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const totalWeight = calculateTotalWeight();
  const weightDiff = Math.abs(totalWeight - 1.0);
  const isWeightValid = weightDiff <= 0.001;

  // Thêm dòng tiêu chí rubric mới
  const handleAddRubric = () => {
    const newId = `crit-${Date.now()}`;
    setRubrics([
      ...rubrics,
      {
        id: newId,
        criteriaName: '',
        maxScore: 10,
        weightRatio: 0.0,
        expectedKnowledgePoints: '',
        description: '',
      },
    ]);
  };

  // Xóa dòng rubric
  const handleRemoveRubric = (idToRemove: string) => {
    if (rubrics.length <= 1) return;
    setRubrics(rubrics.filter((r) => r.id !== idToRemove));
  };

  // Cập nhật giá trị một dòng rubric
  const handleRubricChange = (
    id: string,
    field: keyof Omit<RubricRowState, 'id'>,
    value: any,
  ) => {
    setRubrics(
      rubrics.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      }),
    );
  };

  // Tự động phân bổ đều trọng số
  const handleDistributeWeightsEvenly = () => {
    if (rubrics.length === 0) return;
    const count = rubrics.length;
    const baseWeight = Math.floor((1.0 / count) * 100) / 100;
    const remainder = Math.round((1.0 - baseWeight * count) * 100) / 100;

    const distributed = rubrics.map((r, index) => ({
      ...r,
      weightRatio: index === 0 ? Number((baseWeight + remainder).toFixed(2)) : baseWeight,
    }));
    setRubrics(distributed);
  };

  // Validation form
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!topicId) {
      errs.topicId = 'Vui lòng chọn chương / chủ đề học phần.';
    }

    if (!content.trim()) {
      errs.content = 'Nội dung câu hỏi không được để trống.';
    } else if (content.trim().length < 10) {
      errs.content = 'Nội dung câu hỏi phải có độ dài tối thiểu 10 ký tự.';
    }

    if (!bloomLevel) {
      errs.bloomLevel = 'Vui lòng chọn mức độ nhận thức.';
    }

    if (rubrics.length === 0) {
      errs.rubrics = 'Bắt buộc phải có ít nhất 1 tiêu chí chấm điểm.';
    }

    // Kiểm tra từng tiêu chí rubric
    rubrics.forEach((r, idx) => {
      if (!r.criteriaName.trim()) {
        errs[`rubric_name_${r.id}`] = `Tiêu chí #${idx + 1}: Tên tiêu chí không được để trống.`;
      }
      if (!r.expectedKnowledgePoints.trim()) {
        errs[`rubric_desc_${r.id}`] = `Tiêu chí #${idx + 1}: Kiến thức kỳ vọng không được để trống.`;
      }
      const w = parseFloat(String(r.weightRatio));
      if (isNaN(w) || w <= 0 || w > 1.0) {
        errs[`rubric_weight_${r.id}`] = `Tiêu chí #${idx + 1}: Trọng số phải nằm trong khoảng từ 0.01 đến 1.00.`;
      }
    });

    if (!isWeightValid) {
      errs.weightSum = `Tổng trọng số hiện tại là ${totalWeight.toFixed(3)} (${(
        totalWeight * 100
      ).toFixed(1)}%). Bắt buộc phải bằng đúng 1.00 (100%).`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('error', 'Vui lòng kiểm tra lại các trường thông tin và đảm bảo tổng trọng số bằng đúng 1.00.');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const selectedTopic = topics.find((t) => String(t.id) === String(topicId));
      const payload: CreateQuestionRequest = {
        content: content.trim(),
        questionText: content.trim(),
        topicId,
        topicName: selectedTopic ? selectedTopic.name : `Chương #${topicId}`,
        chapter: selectedTopic ? selectedTopic.name : `Chương #${topicId}`,
        bloomLevel,
        sourceType,
        createdBy: createdBy.trim() || 'TS. Nguyễn Thị Minh',
        rubrics: rubrics.map((r) => ({
          criteriaName: r.criteriaName.trim(),
          maxScore: Number(r.maxScore) || 10,
          description: r.description.trim() || r.expectedKnowledgePoints.trim(),
          expectedKnowledgePoints: r.expectedKnowledgePoints.trim(),
          weightRatio: Number(parseFloat(String(r.weightRatio)).toFixed(3)),
        })),
        status: 'PENDING',
      };

      await createQuestion(payload);
      addToast('success', 'Tạo mới câu hỏi và tiêu chí chấm thành công!');
      setTimeout(() => {
        navigate('/lecturer/questions');
      }, 1000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu câu hỏi. Vui lòng kiểm tra lại kết nối mạng hoặc dữ liệu nhập.';
      setErrors({ general: msg });
      addToast('error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-8 space-y-6 text-slate-800 font-sans">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/lecturer/questions" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Ngân hàng câu hỏi
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold">Tạo câu hỏi mới</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tạo câu hỏi & Thiết lập Rubric
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Học phần: Triết học Mác – Lênin • Chuẩn hóa câu hỏi thi vấn đáp và tiêu chuẩn thang điểm
          </p>
        </div>

        <div>
          <Link
            to="/lecturer/questions"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
          >
            ← Quay lại danh sách
          </Link>
        </div>
      </div>

      {/* Pedagogical Guidelines Callout */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
        <div className="text-2xl leading-none">💡</div>
        <div className="space-y-1 text-xs text-emerald-900">
          <h4 className="font-bold text-sm text-emerald-800">
            Quy chuẩn biên soạn câu hỏi Triết học Mác – Lênin
          </h4>
          <p className="leading-relaxed">
            • <strong>Chương 1 & Chương 2:</strong> Tập trung vào vấn đề cơ bản của triết học, bản chất vật chất và ý thức, hai nguyên lý và ba quy luật của phép biện chứng duy vật.
          </p>
          <p className="leading-relaxed">
            • <strong>Quy định Rubric:</strong> Mỗi câu hỏi cần có từ 2–4 tiêu chí thành phần với thang điểm 10. Tổng trọng số của tất cả các tiêu chí BẮT BUỘC phải bằng đúng 1.00 (100%).
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {errors.general && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium" role="alert">
            {errors.general}
          </div>
        )}

        {/* Section 1: Thông tin câu hỏi */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">1. Thông tin tổng quát câu hỏi</h3>
            <span className="text-xs text-slate-500">Phân loại chương mục và thang đo nhận thức</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="form-topic" className="block text-xs font-medium text-slate-700">
                Chương / Chủ đề học phần <span className="text-rose-500">*</span>
              </label>
              <select
                id="form-topic"
                className={`w-full h-10 rounded-xl border bg-slate-50/50 px-3.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.topicId ? 'border-rose-400' : 'border-slate-200'
                }`}
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value);
                  if (errors.topicId) setErrors((prev) => ({ ...prev, topicId: '' }));
                }}
                disabled={isSubmitting}
              >
                {topics.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.topicId && <p className="text-rose-600 text-[11px]">{errors.topicId}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="form-bloom" className="block text-xs font-medium text-slate-700">
                Mức độ nhận thức (Thang đo Bloom) <span className="text-rose-500">*</span>
              </label>
              <select
                id="form-bloom"
                className={`w-full h-10 rounded-xl border bg-slate-50/50 px-3.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.bloomLevel ? 'border-rose-400' : 'border-slate-200'
                }`}
                value={bloomLevel}
                onChange={(e) => {
                  setBloomLevel(e.target.value as BloomLevel);
                  if (errors.bloomLevel) setErrors((prev) => ({ ...prev, bloomLevel: '' }));
                }}
                disabled={isSubmitting}
              >
                <option value="REMEMBER">Nhận biết (Remember) — Tái hiện chuẩn xác định nghĩa, phạm trù</option>
                <option value="UNDERSTAND">Thông hiểu (Understand) — Cắt nghĩa, giải thích bản chất nguyên lý</option>
                <option value="APPLY">Vận dụng (Apply) — Gắn lý luận triết học vào thực tiễn xã hội</option>
                <option value="ANALYZE">Phân tích (Analyze) — Mổ xẻ mâu thuẫn, so sánh và đánh giá biện chứng</option>
              </select>
              {errors.bloomLevel && <p className="text-rose-600 text-[11px]">{errors.bloomLevel}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="form-content" className="block text-xs font-medium text-slate-700">
                Nội dung câu hỏi thi vấn đáp <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{content.length} ký tự</span>
            </div>
            <textarea
              id="form-content"
              rows={4}
              className={`w-full rounded-xl border bg-slate-50/50 p-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.content ? 'border-rose-400' : 'border-slate-200'
              }`}
              placeholder="Nhập nội dung câu hỏi vấn đáp Triết học Mác – Lênin (VD: Trình bày định nghĩa vật chất của V.I.Lênin và phân tích ý nghĩa phương pháp luận...)"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
              }}
              disabled={isSubmitting}
            />
            {errors.content && <p className="text-rose-600 text-[11px]">{errors.content}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="form-author" className="block text-xs font-medium text-slate-700">
              Giảng viên biên soạn đề
            </label>
            <input
              id="form-author"
              type="text"
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="VD: TS. Nguyễn Thị Minh (Bộ môn Triết học Mác – Lênin)"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Section 2: Thiết lập Rubric chấm điểm */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Thiết lập bảng Tiêu chí chấm (Rubric)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Định nghĩa các tiêu chí chấm điểm, thang điểm tối đa và tỷ lệ trọng số
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
                onClick={handleDistributeWeightsEvenly}
                title="Tự động chia đều trọng số cho các tiêu chí hiện có"
                disabled={isSubmitting || rubrics.length === 0}
              >
                ⚖ Phân bổ đều trọng số
              </button>
              <button
                type="button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm"
                onClick={handleAddRubric}
                disabled={isSubmitting}
              >
                + Thêm tiêu chí
              </button>
            </div>
          </div>

          {/* STRICT VALIDATION INDICATOR */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isWeightValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span>{isWeightValid ? '✓' : '⚠'}</span>
                <span>
                  {isWeightValid ? (
                    <strong>Tổng trọng số: 100% (1.00) — Đạt chuẩn hợp lệ</strong>
                  ) : (
                    <strong>
                      Tổng trọng số hiện tại: {totalWeight.toFixed(3)} ({(totalWeight * 100).toFixed(1)}%) — Bắt buộc phải bằng đúng 1.00 (100%)
                    </strong>
                  )}
                </span>
              </div>
              {!isWeightValid && (
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
                  {totalWeight < 1.0
                    ? `Còn thiếu: ${(1.0 - totalWeight).toFixed(3)}`
                    : `Vượt quá: ${(totalWeight - 1.0).toFixed(3)}`}
                </span>
              )}
            </div>

            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isWeightValid ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, totalWeight * 100))}%` }}
              />
            </div>

            {!isWeightValid && (
              <p className="text-[11px] text-amber-700">
                Quy định bảo đảm chất lượng: Nút "Lưu câu hỏi" sẽ bị khóa cho đến khi tổng trọng số của toàn bộ tiêu chí đạt chính xác 1.00 (100%).
              </p>
            )}
          </div>

          {/* Rubric Rows List */}
          <div className="space-y-4">
            {rubrics.map((row, index) => {
              const nameErr = errors[`rubric_name_${row.id}`];
              const descErr = errors[`rubric_desc_${row.id}`];
              const weightErr = errors[`rubric_weight_${row.id}`];

              return (
                <div key={row.id} className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-xs">
                      Tiêu chí đánh giá #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full">
                        {((parseFloat(String(row.weightRatio)) || 0) * 100).toFixed(0)}% điểm số
                      </span>
                      {rubrics.length > 1 && (
                        <button
                          type="button"
                          className="text-rose-500 hover:text-rose-700 font-semibold text-xs px-2 py-0.5 rounded hover:bg-rose-50 transition-colors"
                          onClick={() => handleRemoveRubric(row.id)}
                          title="Xóa tiêu chí này"
                          disabled={isSubmitting}
                        >
                          ✕ Xóa
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Tên tiêu chí */}
                    <div className="sm:col-span-8 space-y-1">
                      <label className="block text-xs font-medium text-slate-600">
                        Tên tiêu chí chấm <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full h-10 rounded-xl border bg-white px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          nameErr ? 'border-rose-400' : 'border-slate-200'
                        }`}
                        placeholder="VD: Định nghĩa vật chất của V.I.Lênin"
                        value={row.criteriaName}
                        onChange={(e) => handleRubricChange(row.id, 'criteriaName', e.target.value)}
                        disabled={isSubmitting}
                      />
                      {nameErr && <p className="text-rose-600 text-[10px]">{nameErr}</p>}
                    </div>

                    {/* Thang điểm */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-medium text-slate-600">Thang điểm</label>
                      <input
                        type="number"
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 text-center font-bold"
                        value={row.maxScore}
                        onChange={(e) => handleRubricChange(row.id, 'maxScore', Number(e.target.value) || 10)}
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Trọng số */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-medium text-slate-600">
                        Trọng số (0.01 - 1.00) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.01"
                        max="1.00"
                        className={`w-full h-10 rounded-xl border bg-white px-3 text-xs text-slate-700 text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          weightErr ? 'border-rose-400' : 'border-slate-200'
                        }`}
                        value={row.weightRatio}
                        onChange={(e) =>
                          handleRubricChange(
                            row.id,
                            'weightRatio',
                            e.target.value === '' ? '' : parseFloat(e.target.value),
                          )
                        }
                        disabled={isSubmitting}
                      />
                      {weightErr && <p className="text-rose-600 text-[10px]">{weightErr}</p>}
                    </div>
                  </div>

                  {/* Kiến thức kỳ vọng & Tiêu chuẩn */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-600">
                      Kiến thức kỳ vọng & Tiêu chuẩn đạt điểm <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      className={`w-full rounded-xl border bg-white p-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        descErr ? 'border-rose-400' : 'border-slate-200'
                      }`}
                      placeholder="Nêu rõ các ý chính thí sinh cần phân tích chuẩn xác để đạt trọn điểm của tiêu chí này..."
                      value={row.expectedKnowledgePoints}
                      onChange={(e) => {
                        handleRubricChange(row.id, 'expectedKnowledgePoints', e.target.value);
                        handleRubricChange(row.id, 'description', e.target.value);
                      }}
                      disabled={isSubmitting}
                    />
                    {descErr && <p className="text-rose-600 text-[10px]">{descErr}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/lecturer/questions"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
            disabled={isSubmitting || !isWeightValid}
            title={
              !isWeightValid
                ? 'Nút lưu bị vô hiệu hóa vì tổng trọng số chưa bằng 1.00'
                : 'Lưu câu hỏi vào ngân hàng đề'
            }
          >
            {isSubmitting ? (
              <span>Đang lưu câu hỏi...</span>
            ) : (
              <span>Lưu câu hỏi & Tiêu chí chấm ({isWeightValid ? 'Sẵn sàng' : 'Trọng số chưa hợp lệ'})</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
