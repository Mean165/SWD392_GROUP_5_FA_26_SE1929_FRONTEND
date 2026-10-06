import React, { useState } from 'react';
import type { CreateExamSessionRequest, ExamSessionStatus } from '../../types/examSession';
import { createExamSession } from '../../services/exam/examSessionService';

interface CreateExamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormErrors {
  sessionName?: string;
  timeLimitMinutes?: string;
  maxMainQuestions?: string;
  maxFollowupPerQuestion?: string;
  startTime?: string;
  general?: string;
}

export default function CreateExamSessionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateExamSessionModalProps) {
  // Default values per specification
  const [sessionName, setSessionName] = useState<string>('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(45);
  const [maxMainQuestions, setMaxMainQuestions] = useState<number>(3); // default 3
  const [maxFollowupPerQuestion, setMaxFollowupPerQuestion] = useState<number>(2); // default 2

  // Default startTime: tomorrow at 08:30 AM
  const getInitialStartTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 30, 0, 0);
    // YYYY-MM-DDTHH:mm
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState<string>(getInitialStartTime());
  const [status, setStatus] = useState<ExamSessionStatus>('DRAFT');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!sessionName.trim()) {
      errs.sessionName = 'Session name is required.';
    } else if (sessionName.trim().length < 5) {
      errs.sessionName = 'Session name must be at least 5 characters.';
    }

    if (!timeLimitMinutes || Number(timeLimitMinutes) <= 0) {
      errs.timeLimitMinutes = 'Time limit must be greater than 0 minutes.';
    } else if (Number(timeLimitMinutes) > 360) {
      errs.timeLimitMinutes = 'Time limit cannot exceed 360 minutes (6 hours).';
    }

    if (!maxMainQuestions || Number(maxMainQuestions) < 1) {
      errs.maxMainQuestions = 'Must have at least 1 main question.';
    }

    if (maxFollowupPerQuestion === undefined || Number(maxFollowupPerQuestion) < 0) {
      errs.maxFollowupPerQuestion = 'Follow-up questions cannot be negative.';
    }

    if (!startTime) {
      errs.startTime = 'Start time is required.';
    } else {
      const selected = new Date(startTime).getTime();
      if (isNaN(selected)) {
        errs.startTime = 'Invalid start date format.';
      }
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
      const payload: CreateExamSessionRequest = {
        sessionName: sessionName.trim(),
        timeLimitMinutes: Number(timeLimitMinutes),
        maxMainQuestions: Number(maxMainQuestions),
        maxFollowupPerQuestion: Number(maxFollowupPerQuestion),
        startTime,
        status,
      };

      await createExamSession(payload);
      onSuccess(`Exam session "${sessionName.trim()}" created successfully!`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create exam session. Please check inputs.';
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
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-container ses-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-session-modal-title"
      >
        <div className="modal-header">
          <div className="ses-modal-header-title">
            <h3 id="create-session-modal-title" className="modal-title">
              Create Exam Session
            </h3>
            <span className="ses-notice-tag">No courseId required</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {errors.general && (
          <div className="alert-message alert-error" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Session Name */}
          <div className="form-group">
            <label htmlFor="create-ses-name" className="form-label">
              Session Name <span className="text-required">*</span>
            </label>
            <input
              id="create-ses-name"
              type="text"
              className={`form-input ${errors.sessionName ? 'input-error' : ''}`}
              placeholder="e.g. Midterm Oral Interview - Web Architecture & Systems"
              value={sessionName}
              onChange={(e) => {
                setSessionName(e.target.value);
                if (errors.sessionName) setErrors((prev) => ({ ...prev, sessionName: undefined }));
              }}
              disabled={isSubmitting}
            />
            {errors.sessionName && <p className="field-error-text">{errors.sessionName}</p>}
          </div>

          {/* Row: Time Limit & Start Time */}
          <div className="ses-form-row">
            <div className="form-group flex-1">
              <label htmlFor="create-ses-time" className="form-label">
                Time Limit (Minutes) <span className="text-required">*</span>
              </label>
              <input
                id="create-ses-time"
                type="number"
                min="5"
                max="360"
                step="5"
                className={`form-input ${errors.timeLimitMinutes ? 'input-error' : ''}`}
                value={timeLimitMinutes}
                onChange={(e) => {
                  setTimeLimitMinutes(parseInt(e.target.value) || 0);
                  if (errors.timeLimitMinutes)
                    setErrors((prev) => ({ ...prev, timeLimitMinutes: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.timeLimitMinutes && (
                <p className="field-error-text">{errors.timeLimitMinutes}</p>
              )}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="create-ses-start" className="form-label">
                Scheduled Start Time <span className="text-required">*</span>
              </label>
              <input
                id="create-ses-start"
                type="datetime-local"
                className={`form-input ${errors.startTime ? 'input-error' : ''}`}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.startTime && <p className="field-error-text">{errors.startTime}</p>}
            </div>
          </div>

          {/* Row: Question Limits */}
          <div className="ses-form-row">
            <div className="form-group flex-1">
              <label htmlFor="create-ses-main-q" className="form-label">
                Max Main Questions (Default: 3) <span className="text-required">*</span>
              </label>
              <input
                id="create-ses-main-q"
                type="number"
                min="1"
                max="20"
                className={`form-input ${errors.maxMainQuestions ? 'input-error' : ''}`}
                value={maxMainQuestions}
                onChange={(e) => {
                  setMaxMainQuestions(parseInt(e.target.value) || 0);
                  if (errors.maxMainQuestions)
                    setErrors((prev) => ({ ...prev, maxMainQuestions: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.maxMainQuestions && (
                <p className="field-error-text">{errors.maxMainQuestions}</p>
              )}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="create-ses-followup-q" className="form-label">
                Max Follow-ups per Question (Default: 2) <span className="text-required">*</span>
              </label>
              <input
                id="create-ses-followup-q"
                type="number"
                min="0"
                max="10"
                className={`form-input ${errors.maxFollowupPerQuestion ? 'input-error' : ''}`}
                value={maxFollowupPerQuestion}
                onChange={(e) => {
                  setMaxFollowupPerQuestion(parseInt(e.target.value) || 0);
                  if (errors.maxFollowupPerQuestion)
                    setErrors((prev) => ({ ...prev, maxFollowupPerQuestion: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.maxFollowupPerQuestion && (
                <p className="field-error-text">{errors.maxFollowupPerQuestion}</p>
              )}
            </div>
          </div>

          {/* Initial Status */}
          <div className="form-group">
            <label htmlFor="create-ses-status" className="form-label">
              Initial Session Status
            </label>
            <select
              id="create-ses-status"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ExamSessionStatus)}
              disabled={isSubmitting}
            >
              <option value="DRAFT">DRAFT (Nháp - cấu hình trước)</option>
              <option value="READY">READY (Sẵn sàng mở cho sinh viên)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Đang diễn ra)</option>
              <option value="COMPLETED">COMPLETED (Đã kết thúc)</option>
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              id="btn-submit-create-session"
            >
              {isSubmitting ? 'Creating Session...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
