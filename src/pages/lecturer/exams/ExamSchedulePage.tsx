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
import AssignStudentModal from '../../../components/exams/AssignStudentModal';
import './ExamsPage.css';

export default function ExamSchedulePage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ExamSessionResponse | null>(null);
  const [participants, setParticipants] = useState<StudentSessionAssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [sess, list] = await Promise.all([
        getExamSessionById(id),
        getStudentsBySessionId(id),
      ]);
      setSession(sess);
      setParticipants(list || []);
    } catch {
      setParticipants([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatTimeSlot = (isoString?: string, durationMinutes = 15) => {
    if (!isoString) return 'Chưa có lịch';
    try {
      const start = new Date(isoString);
      const end = new Date(start.getTime() + durationMinutes * 60000);
      const startStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const endStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = start.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${startStr} - ${endStr} (${dateStr})`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="exams-page-container">
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>Lịch Trình Vấn Đáp & Phân Ca (Timeline)</h1>
          <p className="exams-page-subtitle">
            Phiên thi: <strong>{session?.sessionName || id}</strong>
          </p>
        </div>
        <div className="exams-header-actions">
          <Link to={`/lecturer/exams/${id}`} className="btn btn-secondary">
            ← Chi tiết phiên
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAssignModalOpen(true)}
          >
            + Thêm Thí Sinh Mới
          </button>
        </div>
      </div>

      <div className="detail-card">
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
          Khung giờ phỏng vấn AI từng thí sinh
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            Đang tải lịch trình...
          </div>
        ) : participants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
            Chưa có thí sinh nào trong lịch trình này. Hãy nhấn &quot;Thêm Thí Sinh Mới&quot; để gán khung giờ.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {participants.map((p, idx) => (
              <div
                key={p.assignmentId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {p.studentName || 'Thí sinh'} ({p.studentCode})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {p.studentEmail}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.9rem' }}>
                      ⏱️ {formatTimeSlot(p.scheduledTime, session?.timeLimitMinutes || 15)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Thời lượng: {session?.timeLimitMinutes || 15} phút
                    </div>
                  </div>
                  <span className="status-badge badge-scheduled">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {session && isAssignModalOpen && (
        <AssignStudentModal
          session={session}
          isOpen={true}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
