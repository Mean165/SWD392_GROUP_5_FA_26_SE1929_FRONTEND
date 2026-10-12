import React, { useState } from 'react';
import { createExamSession } from '../../services/exam/examService';
import '../../pages/lecturer/exams/ExamsPage.css';

interface CreateExamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormErrors {
  sessionName?: string;
  maxMainQuestions?: string;
  maxFollowupPerQuestion?: string;
  timeLimitMinutes?: string;
  startTime?: string;
  general?: string;
}

export default function CreateExamSessionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExamSessionModalProps) {
  const [sessionName, setSessionName] = useState('');
  const [subjectTopic, setSubjectTopic] = useState('SWD392 - Software Architecture & Design');
  const [selectionStrategy, setSelectionStrategy] = useState('ADAPTIVE');
  const [maxMainQuestions, setMaxMainQuestions] = useState<number>(3);
  const [maxFollowupPerQuestion, setMaxFollowupPerQuestion] = useState<number>(2);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [startTime, setStartTime] = useState<string>('');
  const [status, setStatus] = useState<string>('SCHEDULED');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!sessionName.trim()) {
      errs.sessionName = 'Vui lòng nhập tên phiên thi';
    }

    if (!maxMainQuestions || maxMainQuestions < 1) {
      errs.maxMainQuestions = 'Số câu hỏi chính phải lớn hơn hoặc bằng 1';
    }

    if (maxFollowupPerQuestion < 0) {
      errs.maxFollowupPerQuestion = 'Số câu hỏi đào sâu tối đa không được âm';
    }

    if (!timeLimitMinutes || timeLimitMinutes < 1) {
      errs.timeLimitMinutes = 'Thời lượng thi mỗi thí sinh phải từ 1 phút trở lên';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Chuyển đổi định dạng datetime-local sang ISO format có timezone cho Backend
      let formattedStartTime: string | undefined = undefined;
      if (startTime) {
        formattedStartTime = new Date(startTime).toISOString();
      }

      await createExamSession({
        sessionName: sessionName.trim(),
        maxMainQuestions: Number(maxMainQuestions),
        maxFollowupPerQuestion: Number(maxFollowupPerQuestion),
        timeLimitMinutes: Number(timeLimitMinutes),
        status: (status || 'DRAFT') as any,
        startTime: formattedStartTime || new Date().toISOString(),
      });

      onSuccess('Tạo phiên thi vấn đáp thành công!');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo phiên thi. Vui lòng thử lại.';
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tạo Phiên Thi Vấn Đáp Mới</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.general && (
              <div className="alert-toast alert-error">
                <span>{errors.general}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="session-name">Tên phiên thi *</label>
              <input
                id="session-name"
                type="text"
                className="form-control"
                placeholder="VD: Vấn đáp môn SWD392 - Lớp SE1929 - Ca Sáng"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.sessionName && (
                <span className="field-error">{errors.sessionName}</span>
              )}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="create-modal-subject">Môn học / Chủ đề *</label>
                <select
                  id="create-modal-subject"
                  className="form-control"
                  value={subjectTopic}
                  onChange={(e) => setSubjectTopic(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="SWD392 - Software Architecture & Design">SWD392 - Software Architecture & Design</option>
                  <option value="PRN231 - Building Cross-Platform Back-End Applications">PRN231 - Building Cross-Platform Back-End Applications</option>
                  <option value="PRM392 - Mobile Programming">PRM392 - Mobile Programming</option>
                  <option value="DBI202 - Database Systems">DBI202 - Database Systems</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="create-modal-strategy">Chiến lược câu hỏi AI</label>
                <select
                  id="create-modal-strategy"
                  className="form-control"
                  value={selectionStrategy}
                  onChange={(e) => setSelectionStrategy(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="ADAPTIVE">Thích ứng theo Bloom & Tránh trùng thí sinh liên tiếp</option>
                  <option value="RANDOM">Ngẫu nhiên cân bằng độ khó</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="max-main-q">Số câu hỏi chính *</label>
                <input
                  id="max-main-q"
                  type="number"
                  min="1"
                  max="50"
                  className="form-control"
                  value={maxMainQuestions}
                  onChange={(e) => setMaxMainQuestions(Number(e.target.value))}
                  disabled={isSubmitting}
                />
                <span className="form-hint">Số lượng câu hỏi bốc từ ngân hàng câu hỏi</span>
                {errors.maxMainQuestions && (
                  <span className="field-error">{errors.maxMainQuestions}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="max-followup-q">Số câu hỏi đào sâu tối đa/câu *</label>
                <input
                  id="max-followup-q"
                  type="number"
                  min="0"
                  max="10"
                  className="form-control"
                  value={maxFollowupPerQuestion}
                  onChange={(e) => setMaxFollowupPerQuestion(Number(e.target.value))}
                  disabled={isSubmitting}
                />
                <span className="form-hint">AI hỏi xoáy theo câu trả lời của SV</span>
                {errors.maxFollowupPerQuestion && (
                  <span className="field-error">{errors.maxFollowupPerQuestion}</span>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="time-limit">Thời lượng thi mỗi SV (phút) *</label>
                <input
                  id="time-limit"
                  type="number"
                  min="1"
                  max="180"
                  className="form-control"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  disabled={isSubmitting}
                />
                {errors.timeLimitMinutes && (
                  <span className="field-error">{errors.timeLimitMinutes}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="status">Trạng thái ban đầu</label>
                <select
                  id="status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                  <option value="IN_PROGRESS">Bắt đầu ngay (IN_PROGRESS)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="start-time">Thời gian bắt đầu phiên thi</label>
              <input
                id="start-time"
                type="datetime-local"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="form-hint">
                Dùng làm mốc thời gian để tự động tính khung giờ cho thí sinh đầu tiên
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={isSubmitting}
              id="btn-submit-create-session"
            >
              {isSubmitting ? 'Đang tạo phiên...' : 'Tạo phiên thi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
