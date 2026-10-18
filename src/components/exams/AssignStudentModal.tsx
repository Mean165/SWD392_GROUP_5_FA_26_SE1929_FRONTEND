import React, { useState, useEffect } from 'react';
import { assignStudentToSession } from '../../services/exam/examService';
import { getUsers } from '../../services/userService';
import type { ExamSessionResponse } from '../../types/exam';
import type { UserResponse } from '../../types/user';
import '../../pages/lecturer/exams/ExamsPage.css';

interface AssignStudentModalProps {
  session: ExamSessionResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  // Khung giờ gợi ý tiếp theo nếu đã có sinh viên trước đó
  suggestedTime?: string;
}

export default function AssignStudentModal({
  session,
  isOpen,
  onClose,
  onSuccess,
  suggestedTime,
}: AssignStudentModalProps) {
  const [studentCode, setStudentCode] = useState('');
  const [scheduledTime, setScheduledTime] = useState<string>(
    suggestedTime ||
      (session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : ''),
  );
  const [status, setStatus] = useState<string>('SCHEDULED');

  // Danh sách sinh viên tải từ hệ thống
  const [availableStudents, setAvailableStudents] = useState<UserResponse[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Cập nhật lại khung giờ gợi ý khi mở modal
    if (suggestedTime) {
      setScheduledTime(suggestedTime);
    } else if (session.startTime) {
      setScheduledTime(new Date(session.startTime).toISOString().slice(0, 16));
    }

    // Tải danh sách sinh viên thực tế từ Backend
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const users = await getUsers();
        // Lọc sinh viên role ST hoặc có mã sinh viên
        const students = users.filter((u) => {
          const r = (u.role?.roleCode || u.roleName || '').toUpperCase();
          return r === 'ST' || r === 'STUDENT' || (u.studentOrStaffCode && u.studentOrStaffCode.startsWith('SE'));
        });
        setAvailableStudents(students.length > 0 ? students : users);
      } catch {
        // Nếu lỗi mạng, vẫn cho phép nhập mã sinh viên thủ công
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [isOpen, session, suggestedTime]);

  if (!isOpen) return null;

  const handleSelectQuickStudent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    if (selectedCode) {
      setStudentCode(selectedCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      setErrorMsg('Vui lòng chọn hoặc nhập Mã số sinh viên (VD: SE170123)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let formattedScheduledTime: string | undefined = undefined;
      if (scheduledTime) {
        formattedScheduledTime = new Date(scheduledTime).toISOString();
      }

      await assignStudentToSession(session.sessionId, {
        studentCode: studentCode.trim(),
        scheduledTime: formattedScheduledTime,
        status: status || 'SCHEDULED',
      });

      onSuccess(`Đã phân công sinh viên ${studentCode.trim()} vào ca thi vấn đáp thành công!`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gán sinh viên vào phiên thi.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gán Thí Sinh & Chia Khung Giờ Thi</h2>
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

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                Phiên thi: {session.sessionName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                Thời lượng: {session.timeLimitMinutes} phút / thí sinh | Tối đa {session.maxMainQuestions} câu chính + {session.maxFollowupPerQuestion} câu hỏi xoáy
              </div>
            </div>

            {/* Chọn nhanh từ danh sách sinh viên */}
            {availableStudents.length > 0 && (
              <div className="form-group">
                <label htmlFor="quick-student-select">
                  Chọn từ danh sách sinh viên ({availableStudents.length} sinh viên có sẵn)
                </label>
                <select
                  id="quick-student-select"
                  className="form-control"
                  onChange={handleSelectQuickStudent}
                  disabled={isSubmitting || isLoadingStudents}
                  defaultValue=""
                >
                  <option value="">-- Chọn sinh viên để tự điền mã số --</option>
                  {availableStudents.map((st) => (
                    <option key={st.userId} value={st.studentOrStaffCode || st.userId}>
                      [{st.studentOrStaffCode || 'N/A'}] {st.fullName} ({st.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nhập mã sinh viên */}
            <div className="form-group">
              <label htmlFor="student-code">Mã số sinh viên *</label>
              <input
                id="student-code"
                type="text"
                className="form-control"
                placeholder="VD: SE170123 hoặc SE170456"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <span className="form-hint">
                Hệ thống tự động liên kết với hồ sơ thí sinh và bốc câu hỏi tránh trùng lặp
              </span>
            </div>

            {/* Khung giờ thi */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="student-scheduled-time" style={{ margin: 0 }}>
                  Khung giờ vào phòng vấn đáp AI *
                </label>
                {suggestedTime && (
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                    onClick={() => setScheduledTime(suggestedTime)}
                  >
                    Áp dụng slot kế tiếp (+{session.timeLimitMinutes + 2}p)
                  </button>
                )}
              </div>
              <input
                id="student-scheduled-time"
                type="datetime-local"
                className="form-control"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={isSubmitting}
              />
              <span className="form-hint">
                Thời lượng phòng thi: {session.timeLimitMinutes} phút. AI sẽ đếm giờ từ thời điểm này.
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="assignment-status">Trạng thái ban đầu</label>
              <select
                id="assignment-status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
                <option value="WAITING">Đang chờ phòng thi (WAITING)</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={isSubmitting}
              id="btn-submit-assign-student"
            >
              {isSubmitting ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                  <span>Xác nhận gán sinh viên</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
