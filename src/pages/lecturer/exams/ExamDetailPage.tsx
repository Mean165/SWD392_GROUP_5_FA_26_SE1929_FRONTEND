import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getExamSessionById,
  getStudentsBySessionId,
} from '../../../services/exam/examService';
import type {
  ExamSessionResponse,
  StudentSessionAssignmentResponse,
} from '../../../types/exam';
import ParticipantTable from '../../../components/exams/ParticipantTable';
import AssignStudentModal from '../../../components/exams/AssignStudentModal';
import EditExamSessionModal from '../../../components/exams/EditExamSessionModal';
import './ExamsPage.css';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ExamSessionResponse | null>(null);
  const [participants, setParticipants] = useState<StudentSessionAssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [sessionData, studentsData] = await Promise.all([
        getExamSessionById(id),
        getStudentsBySessionId(id),
      ]);
      setSession(sessionData);
      setParticipants(studentsData || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải dữ liệu chi tiết phiên thi.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOperationSuccess = (msg: string) => {
    setSuccessMessage(msg);
    loadData();
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Chưa thiết lập';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Tính toán khung giờ gợi ý cho thí sinh tiếp theo
  const getNextSuggestedTime = (): string | undefined => {
    if (!session) return undefined;
    if (participants.length === 0) {
      return session.startTime
        ? new Date(session.startTime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
    }

    // Lấy thời gian của thí sinh cuối cùng cộng thêm timeLimitMinutes (+ 2 phút nghỉ)
    const lastP = participants[participants.length - 1];
    if (lastP.scheduledTime) {
      const lastDate = new Date(lastP.scheduledTime);
      const nextDate = new Date(lastDate.getTime() + (session.timeLimitMinutes + 2) * 60000);
      return nextDate.toISOString().slice(0, 16);
    }
    return undefined;
  };

  if (isLoading && !session) {
    return (
      <div className="exams-page-container">
        <div className="detail-card" style={{ textAlign: 'center', padding: '3rem' }}>
          Đang tải thông tin phiên thi vấn đáp...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="exams-page-container">
        <div className="alert-toast alert-error">
          <span>{errorMessage || 'Không tìm thấy phiên thi yêu cầu.'}</span>
        </div>
        <Link to="/lecturer/exams" className="btn btn-secondary">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="exams-page-container">
      {/* Header */}
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>{session.sessionName}</h1>
          <p className="exams-page-subtitle">
            Mã phiên (ID): <code>{session.sessionId}</code>
          </p>
        </div>
        <div className="exams-header-actions">
          <Link to="/lecturer/exams" className="btn btn-secondary">
            ← Danh sách
          </Link>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            Chỉnh sửa cấu hình
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAssignModalOpen(true)}
            id="btn-open-assign-student"
          >
            + Gán thí sinh & Chia slot
          </button>
        </div>
      </div>

      {/* Success alert */}
      {successMessage && (
        <div className="alert-toast alert-success" role="status">
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert-toast-close"
            onClick={() => setSuccessMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="alert-toast alert-error" role="alert">
          <span>{errorMessage}</span>
          <button
            type="button"
            className="alert-toast-close"
            onClick={() => setErrorMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Session Overview Card */}
      <div className="detail-card">
        <div className="detail-header">
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
            Thông Số Cấu Hình Phiên Vấn Đáp
          </h2>
          <span className="status-badge badge-scheduled">{session.status}</span>
        </div>

        <div className="detail-grid">
          <div>
            <div className="detail-item-label">Thời gian bắt đầu ca thi</div>
            <div className="detail-item-value">{formatDateTime(session.startTime)}</div>
          </div>
          <div>
            <div className="detail-item-label">Thời lượng mỗi thí sinh</div>
            <div className="detail-item-value">
              <span className="pill-metric">⏱️ {session.timeLimitMinutes} phút</span>
            </div>
          </div>
          <div>
            <div className="detail-item-label">Quy chế câu hỏi chính</div>
            <div className="detail-item-value">
              <strong>{session.maxMainQuestions}</strong> câu hỏi bốc từ ngân hàng
            </div>
          </div>
          <div>
            <div className="detail-item-label">Hỏi xoáy AI tối đa</div>
            <div className="detail-item-value">
              Tối đa <strong>{session.maxFollowupPerQuestion}</strong> câu hỏi đào sâu/câu
            </div>
          </div>
          <div>
            <div className="detail-item-label">Giảng viên phụ trách</div>
            <div className="detail-item-value">{session.createdByName || 'Giảng viên'}</div>
          </div>
          <div>
            <div className="detail-item-label">Tổng số thí sinh đã gán</div>
            <div className="detail-item-value">
              <span className="pill-metric" style={{ background: '#dbeafe', color: '#1e40af' }}>
                👥 {participants.length} sinh viên
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Participants & Slot Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              Danh Sách Thí Sinh & Khung Giờ Thi Cá Nhân
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Mỗi sinh viên được ấn định một khung giờ thi riêng biệt. AI sẽ kích hoạt phỏng vấn theo đúng lịch trình.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => setIsAssignModalOpen(true)}
          >
            + Thêm sinh viên vào ca thi
          </button>
        </div>

        <ParticipantTable participants={participants} isLoading={isLoading} />
      </div>

      {/* Modals */}
      {isAssignModalOpen && (
        <AssignStudentModal
          session={session}
          isOpen={true}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={handleOperationSuccess}
          suggestedTime={getNextSuggestedTime()}
        />
      )}

      {isEditModalOpen && (
        <EditExamSessionModal
          session={session}
          isOpen={true}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleOperationSuccess}
        />
      )}
    </div>
  );
}
