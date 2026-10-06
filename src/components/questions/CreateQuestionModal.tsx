import React, { useState } from 'react';
import type { BloomLevel, Topic, CreateQuestionRequest } from '../../types/question';
import { createQuestion, DEFAULT_TOPICS } from '../../services/question/questionService';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  topics?: Topic[];
}

interface RubricRowState {
  id: string;
  criteriaName: string;
  maxScore: number;
  weightRatio: number | string;
  expectedKnowledgePoints: string;
  description: string;
}

export default function CreateQuestionModal({
  isOpen,
  onClose,
  onSuccess,
  topics = DEFAULT_TOPICS,
}: CreateQuestionModalProps) {
  const [topicId, setTopicId] = useState<string>(topics[0]?.id ? String(topics[0].id) : 'ch-1');
  const [content, setContent] = useState<string>('');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('UNDERSTAND');
  const [createdBy, setCreatedBy] = useState<string>('TS. Nguyễn Thị Minh');
  const sourceType = 'MANUAL';

  // Dynamic Rubric state - Khởi tạo sẵn 2 tiêu chí mẫu có tổng trọng số = 1.00
  const [rubrics, setRubrics] = useState<RubricRowState[]>([
    {
      id: 'row-1',
      criteriaName: 'Nội dung lý luận cơ bản & chuẩn xác khái niệm',
      maxScore: 10,
      weightRatio: 0.5,
      expectedKnowledgePoints: 'Trình bày chính xác định nghĩa, nội dung nguyên lý hoặc quy luật triết học theo giáo trình chuẩn.',
      description: 'Đạt tối đa khi trình bày đầy đủ định nghĩa và thuật ngữ triết học chính xác.',
    },
    {
      id: 'row-2',
      criteriaName: 'Phân tích ý nghĩa phương pháp luận & liên hệ thực tiễn',
      maxScore: 10,
      weightRatio: 0.5,
      expectedKnowledgePoints: 'Rút ra bài học phương pháp luận đúng đắn, phê phán các quan điểm sai trái, liên hệ thực tiễn.',
      description: 'Đạt tối đa khi liên hệ được với thực tiễn cách mạng Việt Nam hoặc rèn luyện của bản thân.',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

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
    const newId = `row-${Date.now()}`;
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

  // Phân bổ đều trọng số tự động (Auto distribute evenly)
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

  // Validation toàn bộ form
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!topicId) {
      errs.topicId = 'Vui lòng chọn chương / chủ đề bài học.';
    }

    if (!content.trim()) {
      errs.content = 'Nội dung câu hỏi không được để trống.';
    } else if (content.trim().length < 10) {
      errs.content = 'Nội dung câu hỏi phải có độ dài ít nhất 10 ký tự.';
    }

    if (!bloomLevel) {
      errs.bloomLevel = 'Vui lòng chọn mức độ nhận thức.';
    }

    if (rubrics.length === 0) {
      errs.rubrics = 'Bắt buộc phải có ít nhất 1 tiêu chí chấm điểm.';
    }

    // Kiểm tra từng dòng rubric
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

    // STRICT VALIDATION: Tổng trọng số phải bằng đúng 1.00
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
    if (!validateForm()) return;

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
      onSuccess('Tạo câu hỏi và tiêu chí chấm mới thành công vào Ngân hàng đề!');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể lưu câu hỏi. Vui lòng kiểm tra lại các trường nhập liệu.';
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-question-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 id="create-question-modal-title" className="text-lg font-bold text-slate-900">
              Tạo câu hỏi & Tiêu chí chấm mới
            </h3>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
              Triết học Mác – Lênin
            </span>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {errors.general && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs" noValidate>
          {/* Top Row: Chapter & Bloom Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="create-qb-topic" className="block font-medium text-slate-700">
                Chương / Chủ đề học phần <span className="text-rose-500">*</span>
              </label>
              <select
                id="create-qb-topic"
                className={`w-full h-10 rounded-xl border bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
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
              <label htmlFor="create-qb-bloom" className="block font-medium text-slate-700">
                Mức độ nhận thức (Bloom) <span className="text-rose-500">*</span>
              </label>
              <select
                id="create-qb-bloom"
                className={`w-full h-10 rounded-xl border bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.bloomLevel ? 'border-rose-400' : 'border-slate-200'
                }`}
                value={bloomLevel}
                onChange={(e) => {
                  setBloomLevel(e.target.value as BloomLevel);
                  if (errors.bloomLevel) setErrors((prev) => ({ ...prev, bloomLevel: '' }));
                }}
                disabled={isSubmitting}
              >
                <option value="REMEMBER">Nhận biết (Remember) — Tái hiện định nghĩa</option>
                <option value="UNDERSTAND">Thông hiểu (Understand) — Giải thích nguyên lý</option>
                <option value="APPLY">Vận dụng (Apply) — Gắn vào thực tiễn đời sống</option>
                <option value="ANALYZE">Phân tích (Analyze) — Đánh giá biện chứng</option>
              </select>
              {errors.bloomLevel && <p className="text-rose-600 text-[11px]">{errors.bloomLevel}</p>}
            </div>
          </div>

          {/* Question Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="create-qb-text" className="block font-medium text-slate-700">
                Nội dung câu hỏi thi vấn đáp <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">{content.length} ký tự</span>
            </div>
            <textarea
              id="create-qb-text"
              rows={3}
              className={`w-full rounded-xl border bg-slate-50/50 p-3 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                errors.content ? 'border-rose-400' : 'border-slate-200'
              }`}
              placeholder="Nhập nội dung câu hỏi vấn đáp Triết học Mác – Lênin (VD: Phân tích định nghĩa vật chất của V.I.Lênin và ý nghĩa phương pháp luận...)"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
              }}
              disabled={isSubmitting}
            />
            {errors.content && <p className="text-rose-600 text-[11px]">{errors.content}</p>}
          </div>

          {/* Created By Row */}
          <div className="space-y-1.5">
            <label htmlFor="create-qb-author" className="block font-medium text-slate-700">
              Giảng viên biên soạn
            </label>
            <input
              id="create-qb-author"
              type="text"
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={createdBy}
              onChange={(e) => setCreatedBy(e.target.value)}
              placeholder="VD: TS. Nguyễn Thị Minh (Bộ môn Triết học)"
              disabled={isSubmitting}
            />
          </div>

          {/* Dynamic Rubric Builder Section */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Xây dựng Tiêu chí chấm (Rubric)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Thiết lập từng tiêu chí thành phần, chuẩn đạt điểm và trọng số. Tổng trọng số bắt buộc bằng đúng 1.00 (100%).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                  onClick={handleDistributeWeightsEvenly}
                  title="Tự động chia đều trọng số cho các tiêu chí"
                  disabled={isSubmitting || rubrics.length === 0}
                >
                  ⚖ Phân bổ đều
                </button>
                <button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                  onClick={handleAddRubric}
                  disabled={isSubmitting}
                >
                  + Thêm tiêu chí
                </button>
              </div>
            </div>

            {/* STRICT VALIDATION - Live Weight Indicator Bar */}
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isWeightValid
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span>{isWeightValid ? '✓' : '⚠'}</span>
                  <span>
                    {isWeightValid
                      ? 'Tổng trọng số: 100% (1.00) — Đạt chuẩn hợp lệ'
                      : `Tổng trọng số: ${totalWeight.toFixed(3)} (${(totalWeight * 100).toFixed(1)}%) — Cần đạt đúng 1.00`}
                  </span>
                </div>
                {!isWeightValid && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">
                    {totalWeight < 1.0
                      ? `Thiếu: ${(1.0 - totalWeight).toFixed(3)}`
                      : `Dư: ${(totalWeight - 1.0).toFixed(3)}`}
                  </span>
                )}
              </div>

              {/* Visual Progress Gauge */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isWeightValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, totalWeight * 100))}%` }}
                />
              </div>
            </div>

            {/* Rubric Rows List */}
            <div className="space-y-3">
              {rubrics.map((row, index) => {
                const nameErr = errors[`rubric_name_${row.id}`];
                const descErr = errors[`rubric_desc_${row.id}`];
                const weightErr = errors[`rubric_weight_${row.id}`];

                return (
                  <div key={row.id} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-xs">
                        Tiêu chí đánh giá #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {((parseFloat(String(row.weightRatio)) || 0) * 100).toFixed(0)}% điểm
                        </span>
                        {rubrics.length > 1 && (
                          <button
                            type="button"
                            className="text-rose-500 hover:text-rose-700 font-semibold text-xs px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
                            onClick={() => handleRemoveRubric(row.id)}
                            title="Xóa tiêu chí này"
                            disabled={isSubmitting}
                          >
                            ✕ Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Tên tiêu chí chấm <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full h-9 rounded-lg border bg-slate-50/50 px-2.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                            nameErr ? 'border-rose-400' : 'border-slate-200'
                          }`}
                          placeholder="VD: Định nghĩa vật chất hoặc Ý nghĩa phương pháp luận"
                          value={row.criteriaName}
                          onChange={(e) => handleRubricChange(row.id, 'criteriaName', e.target.value)}
                          disabled={isSubmitting}
                        />
                        {nameErr && <p className="text-rose-600 text-[10px]">{nameErr}</p>}
                      </div>

                      <div className="sm:col-span-1 space-y-1">
                        <label className="block text-[11px] font-medium text-slate-600">
                          Trọng số (0.01 - 1.00) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          max="1.00"
                          className={`w-full h-9 rounded-lg border bg-slate-50/50 px-2.5 text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
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

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Kiến thức kỳ vọng & Tiêu chuẩn đạt điểm <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        className={`w-full rounded-lg border bg-slate-50/50 p-2.5 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                          descErr ? 'border-rose-400' : 'border-slate-200'
                        }`}
                        placeholder="Nêu rõ các ý chính thí sinh cần trả lời được để đạt tối đa điểm tiêu chí này..."
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

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
              disabled={isSubmitting || !isWeightValid}
            >
              {isSubmitting ? (
                <span>Đang lưu câu hỏi...</span>
              ) : (
                <span>Lưu câu hỏi ({isWeightValid ? 'Sẵn sàng' : 'Trọng số chưa hợp lệ'})</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
