import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllExamSessions } from '../../../services/exam/examService';
import type { ExamSessionResponse, ExamSessionFilterValues } from '../../../types/exam';
import ExamSessionFilter from '../../../components/exams/ExamSessionFilter';
import ExamSessionTable from '../../../components/exams/ExamSessionTable';
import CreateExamSessionModal from '../../../components/exams/CreateExamSessionModal';
import EditExamSessionModal from '../../../components/exams/EditExamSessionModal';
import AssignStudentModal from '../../../components/exams/AssignStudentModal';
import './ExamsPage.css';

export default function ExamListPage() {
  const [sessions, setSessions] = useState<ExamSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter state
  const [filterValues, setFilterValues] = useState<ExamSessionFilterValues>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ExamSessionResponse | null>(null);
  const [assigningSession, setAssigningSession] = useState<ExamSessionResponse | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getAllExamSessions();
      setSessions(data || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải danh sách phiên thi từ máy chủ.';
      setErrorMessage(msg);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleOperationSuccess = (msg: string) => {
    setSuccessMessage(msg);
    loadSessions();
  };

  // Filter sessions locally by keyword & status
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterValues.keyword) {
        const kw = filterValues.keyword.toLowerCase();
        const matchName = s.sessionName.toLowerCase().includes(kw);
        const matchCreator = (s.createdByName || '').toLowerCase().includes(kw);
        if (!matchName && !matchCreator) return false;
      }
      if (filterValues.status) {
        if ((s.status || '').toUpperCase() !== filterValues.status.toUpperCase()) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, filterValues]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter((s) => (s.status || '').toUpperCase() === 'SCHEDULED').length;
    const inProgress = sessions.filter((s) => (s.status || '').toUpperCase() === 'IN_PROGRESS').length;
    const completed = sessions.filter((s) => (s.status || '').toUpperCase() === 'COMPLETED').length;
    return { total, scheduled, inProgress, completed };
  }, [sessions]);

  return (
    <div className="exams-page-container">
      {/* Page Header */}
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>Quản Lý Kỳ Thi & Lịch Thi Vấn Đáp</h1>
          <p className="exams-page-subtitle">
            Tạo ca thi, cấu hình số câu hỏi chính & hỏi xoáy, phân bổ khung thời gian cho thí sinh
          </p>
        </div>
        <div className="exams-header-actions">
          <Link to="/lecturer/exams/create" className="btn btn-secondary">
            Mở Form Tạo Đầy Đủ
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
            id="btn-open-create-session"
          >
            <span>+</span> Tạo Phiên Thi
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">Tổng phiên thi</span>
          <span className="stat-card-value">{stats.total}</span>
          <span className="stat-card-desc">Tất cả các ca vấn đáp</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Đã lên lịch</span>
          <span className="stat-card-value" style={{ color: '#0369a1' }}>
            {stats.scheduled}
          </span>
          <span className="stat-card-desc">Sẵn sàng phân công thí sinh</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Đang diễn ra</span>
          <span className="stat-card-value" style={{ color: '#d97706' }}>
            {stats.inProgress}
          </span>
          <span className="stat-card-desc">Phòng thi AI đang hoạt động</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Đã kết thúc</span>
          <span className="stat-card-value" style={{ color: '#16a34a' }}>
            {stats.completed}
          </span>
          <span className="stat-card-desc">Đã có biên bản & điểm số</span>
        </div>
      </div>

      {/* Filter Section */}
      <ExamSessionFilter
        onSearch={(vals) => setFilterValues(vals)}
        onReset={() => setFilterValues({})}
        isLoading={isLoading}
      />

      {/* Sessions Table */}
      <ExamSessionTable
        sessions={filteredSessions}
        onEdit={(session) => setEditingSession(session)}
        onAssignStudent={(session) => setAssigningSession(session)}
        isLoading={isLoading}
      />

      {/* Modal: Tạo phiên thi mới */}
      <CreateExamSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />

      {/* Modal: Chỉnh sửa phiên thi */}
      {editingSession && (
        <EditExamSessionModal
          session={editingSession}
          isOpen={true}
          onClose={() => setEditingSession(null)}
          onSuccess={handleOperationSuccess}
        />
      )}

      {/* Modal: Gán thí sinh & chia khung giờ */}
      {assigningSession && (
        <AssignStudentModal
          session={assigningSession}
          isOpen={true}
          onClose={() => setAssigningSession(null)}
          onSuccess={handleOperationSuccess}
        />
      )}
    </div>
  );
}
