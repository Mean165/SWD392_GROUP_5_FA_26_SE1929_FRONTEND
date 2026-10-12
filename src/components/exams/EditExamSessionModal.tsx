import React, { useState } from 'react';
import { updateExamSession } from '../../services/exam/examService';
import type { ExamSessionResponse } from '../../types/exam';
import '../../pages/lecturer/exams/ExamsPage.css';

interface EditExamSessionModalProps {
  session: ExamSessionResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function EditExamSessionModal({
  session,
  isOpen,
  onClose,
  onSuccess,
}: EditExamSessionModalProps) {
  const [sessionName, setSessionName] = useState(session.sessionName || '');
  const [maxMainQuestions, setMaxMainQuestions] = useState<number>(session.maxMainQuestions || 3);
  const [maxFollowupPerQuestion, setMaxFollowupPerQuestion] = useState<number>(
    session.maxFollowupPerQuestion || 2,
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(session.timeLimitMinutes || 15);
  const [status, setStatus] = useState<string>(session.status || 'SCHEDULED');
  const [startTime, setStartTime] = useState<string>(
    session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      setErrorMsg('Vui lòng nhập tên phiên thi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let formattedStartTime: string | undefined = undefined;
      if (startTime) {
        formattedStartTime = new Date(startTime).toISOString();
      }

      await updateExamSession(session.sessionId, {
        sessionName: sessionName.trim(),
        maxMainQuestions: Number(maxMainQuestions),
        maxFollowupPerQuestion: Number(maxFollowupPerQuestion),
        timeLimitMinutes: Number(timeLimitMinutes),
        status,
        startTime: formattedStartTime,
      });

      onSuccess('Cập nhật cấu hình phiên thi thành công!');
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật phiên thi.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh Sửa Phiên Thi Vấn Đáp</h2>
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
            {errorMsg && (
              <div className="alert-toast alert-error">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-session-name">Tên phiên thi *</label>
              <input
                id="edit-session-name"
                type="text"
                className="form-control"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="edit-max-main">Số câu hỏi chính *</label>
                <input
                  id="edit-max-main"
                  type="number"
                  min="1"
                  max="50"
                  className="form-control"
                  value={maxMainQuestions}
                  onChange={(e) => setMaxMainQuestions(Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-max-followup">Số câu hỏi đào sâu tối đa/câu *</label>
                <input
                  id="edit-max-followup"
                  type="number"
                  min="0"
                  max="10"
                  className="form-control"
                  value={maxFollowupPerQuestion}
                  onChange={(e) => setMaxFollowupPerQuestion(Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="edit-time-limit">Thời lượng thi mỗi SV (phút) *</label>
                <input
                  id="edit-time-limit"
                  type="number"
                  min="1"
                  max="180"
                  className="form-control"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Trạng thái phiên thi</label>
                <select
                  id="edit-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                  <option value="IN_PROGRESS">Đang diễn ra (IN_PROGRESS)</option>
                  <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                  <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-start-time">Thời gian bắt đầu</label>
              <input
                id="edit-start-time"
                type="datetime-local"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
              />
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
              id="btn-submit-edit-session"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
