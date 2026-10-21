import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { getQuestionGenerationErrorMessage, updateGenerationQuestion } from '../../../services/question/questionService';
import type { BloomLevel, GenerationRubricCriterion, QuestionDetail, UpdateQuestionRequest } from '../../../types/question';
import './question-generation.css';

const BLOOM_LEVELS: BloomLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'];
const DEFAULT_RUBRIC_TOTAL = 10;

type QuestionEditFormProps = {
  question: QuestionDetail;
  rubricOnly?: boolean;
  onUpdated?: (question: QuestionDetail) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export default function QuestionEditForm({ question, rubricOnly = false, onUpdated, onDirtyChange }: QuestionEditFormProps) {
  const { t } = useLanguage();
  const [questionText, setQuestionText] = useState(question.questionText);
  const [referenceAnswer, setReferenceAnswer] = useState(question.referenceAnswer ?? '');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>(question.bloomLevel);
  const [difficulty, setDifficulty] = useState(question.estimatedDifficulty?.toString() ?? '');
  const [answerMinutes, setAnswerMinutes] = useState(question.suggestedAnswerMinutes?.toString() ?? '');
  const [rubric, setRubric] = useState<GenerationRubricCriterion[]>(question.rubric);
  const [rubricTotalPoints, setRubricTotalPoints] = useState(() => question.rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0) || DEFAULT_RUBRIC_TOTAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const rubricPoints = useMemo(() => rubric.reduce((sum, criterion) => sum + (Number(criterion.maxPoints) || 0), 0), [rubric]);

  useEffect(() => {
    setQuestionText(question.questionText);
    setReferenceAnswer(question.referenceAnswer ?? '');
    setBloomLevel(question.bloomLevel);
    setDifficulty(question.estimatedDifficulty?.toString() ?? '');
    setAnswerMinutes(question.suggestedAnswerMinutes?.toString() ?? '');
    setRubric(question.rubric);
    setRubricTotalPoints(question.rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0) || DEFAULT_RUBRIC_TOTAL);
    onDirtyChange?.(false);
  }, [question, onDirtyChange]);

  useEffect(() => {
    const original = question.rubric.map(({ criteriaId, name, description, maxPoints }) => ({ criteriaId, name, description, maxPoints }));
    const current = rubric.map(({ criteriaId, name, description, maxPoints }) => ({ criteriaId, name, description, maxPoints }));
    onDirtyChange?.(JSON.stringify(original) !== JSON.stringify(current));
  }, [onDirtyChange, question.rubric, rubric]);

  const updateCriterion = (index: number, patch: Partial<GenerationRubricCriterion>) => {
    setRubric((current) => current.map((criterion, currentIndex) => currentIndex === index ? { ...criterion, ...patch } : criterion));
    setSaved(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaved(false);
    if (!questionText.trim()) {
      setError(t('Nội dung câu hỏi không được để trống.'));
      return;
    }
    if (!rubric.length) {
      setError(t('Rubric phải có ít nhất một tiêu chí.'));
      return;
    }
    if (rubric.some((criterion) => !criterion.name.trim() || !criterion.description.trim())) {
      setError(t('Tên và mô tả tiêu chí là bắt buộc.'));
      return;
    }
    if (Math.abs(rubricPoints - rubricTotalPoints) > 0.001) {
      setError(t('Tổng điểm tiêu chí phải bằng điểm cấu hình.'));
      return;
    }

    const payload: UpdateQuestionRequest = {
      questionText: questionText.trim(),
      referenceAnswer: referenceAnswer.trim() || null,
      bloomLevel,
      estimatedDifficulty: difficulty === '' ? null : Number(difficulty),
      suggestedAnswerMinutes: answerMinutes === '' ? null : Number(answerMinutes),
      rubric: rubric.map((criterion) => ({
        ...criterion,
        name: criterion.name.trim(),
        description: criterion.description.trim(),
        maxPoints: Number(criterion.maxPoints),
        weight: Number(criterion.maxPoints) / rubricTotalPoints,
      })),
    };

    setSaving(true);
    try {
      const updated = await updateGenerationQuestion(question.questionId, payload);
      onUpdated?.(updated);
      setSaved(true);
    } catch (saveError) {
      setError(getQuestionGenerationErrorMessage(saveError, t('Không thể lưu thay đổi.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="qg-form" onSubmit={handleSubmit}>
      {!rubricOnly && <>
        <label className="qg-field qg-field-wide">
          <span>{t('Nội dung câu hỏi')}</span>
          <textarea className="qg-control" required rows={4} value={questionText} onChange={(event) => { setQuestionText(event.target.value); setSaved(false); }} />
        </label>
        <label className="qg-field qg-field-wide">
          <span>{t('Câu trả lời tham khảo')}</span>
          <textarea className="qg-control" rows={4} value={referenceAnswer} onChange={(event) => { setReferenceAnswer(event.target.value); setSaved(false); }} />
        </label>
        <label className="qg-field">
          <span>{t('Mức Bloom')}</span>
          <select className="qg-control" value={bloomLevel} onChange={(event) => { setBloomLevel(event.target.value as BloomLevel); setSaved(false); }}>
            {BLOOM_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label className="qg-field">
          <span>{t('Độ khó')}</span>
          <input className="qg-control" type="number" step="any" value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setSaved(false); }} />
        </label>
        <label className="qg-field">
          <span>{t('Thời gian trả lời (phút)')}</span>
          <input className="qg-control" type="number" step="any" value={answerMinutes} onChange={(event) => { setAnswerMinutes(event.target.value); setSaved(false); }} />
        </label>
      </>}

      <div className="qg-field-wide qg-rubric-heading">
        <div>
          <h3>{t('Tiêu chí chấm điểm')}</h3>
          <p>{t('Tổng điểm tiêu chí phải bằng điểm cấu hình.')}</p>
        </div>
        <button type="button" className="qg-button qg-button-secondary" onClick={() => { setRubric((current) => [...current, { name: '', description: '', maxPoints: 0, weight: 0 }]); setSaved(false); }}>
          + {t('Thêm tiêu chí')}
        </button>
      </div>

      {rubric.map((criterion, index) => (
        <fieldset className="qg-rubric-item qg-field-wide" key={criterion.criteriaId ?? `criterion-${index}`}>
          <legend>{t('Tiêu chí chấm điểm')} {index + 1}</legend>
          <label className="qg-field">
            <span>{t('Tên tiêu chí')}</span>
            <input className="qg-control" required value={criterion.name} onChange={(event) => updateCriterion(index, { name: event.target.value })} />
          </label>
          <label className="qg-field qg-field-wide">
            <span>{t('Mô tả tiêu chí')}</span>
            <textarea className="qg-control" required rows={2} value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} />
          </label>
          <label className="qg-field">
            <span>{t('Điểm tối đa')}</span>
            <input className="qg-control" type="number" min="0" max={rubricTotalPoints} step="any" required value={criterion.maxPoints} onChange={(event) => updateCriterion(index, { maxPoints: Number(event.target.value) })} />
          </label>
          <button type="button" className="qg-button qg-button-danger qg-remove-criterion" disabled={rubric.length === 1} onClick={() => { setRubric((current) => current.filter((_, criterionIndex) => criterionIndex !== index)); setSaved(false); }}>
            {t('Xóa tiêu chí')}
          </button>
        </fieldset>
      ))}
      <div className="qg-field-wide qg-form-footer">
        <span className={Math.abs(rubricPoints - rubricTotalPoints) < 0.001 ? 'qg-total-valid' : 'qg-total-invalid'}>
          {t('Tổng số')}: {rubricPoints} / {rubricTotalPoints}
        </span>
        <button className="qg-button" type="submit" disabled={saving || question.status === 'REJECTED'}>
          {saving ? t('Đang lưu') : t('Lưu thay đổi')}
        </button>
      </div>
      {error && <p className="qg-error qg-field-wide" role="alert">{error}</p>}
      {saved && <p className="qg-success qg-field-wide" role="status">{t('Đã lưu thay đổi.')}</p>}
    </form>
  );
}
