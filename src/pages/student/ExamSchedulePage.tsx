import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllExamSessions } from '../../services/exam/examService';
import type { ExamSessionResponse } from '../../types/exam';
import '../lecturer/exams/ExamsPage.css';

export default function StudentExamSchedulePage() {
  const [sessions, setSessions] = useState<ExamSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStudentSessions = async () => {
      setIsLoading(true);
      try {
        const data = await getAllExamSessions();
        setSessions(data || []);
      } catch {
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentSessions();
  }, []);

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Chưa công bố';
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

  return (
    <div className="exams-page-container">
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>Lịch Thi Vấn Đáp Cá Nhân</h1>
          <p className="exams-page-subtitle">
            Danh sách các ca thi vấn đáp thông minh với AI giám khảo ảo (AIVES)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading ? (
          <div className="detail-card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Đang tải lịch thi vấn đáp...
          </div>
        ) : sessions.length === 0 ? (
          <div className="detail-card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Bạn hiện chưa có lịch thi vấn đáp nào sắp tới.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.sessionId} className="detail-card">
              <div className="detail-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                    {session.sessionName}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Giảng viên phụ trách: {session.createdByName || 'Bộ môn'}
                  </div>
                </div>
                <span className="status-badge badge-scheduled">{session.status}</span>
              </div>

              <div className="detail-grid" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <div className="detail-item-label">Khung giờ bắt đầu</div>
                  <div className="detail-item-value" style={{ color: '#2563eb', fontWeight: 600 }}>
                    📅 {formatDateTime(session.startTime)}
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Thời lượng thi</div>
                  <div className="detail-item-value">
                    <span className="pill-metric">⏱️ {session.timeLimitMinutes} phút</span>
                  </div>
                </div>
                <div>
                  <div className="detail-item-label">Số câu hỏi chính</div>
                  <div className="detail-item-value">{session.maxMainQuestions} câu</div>
                </div>
                <div>
                  <div className="detail-item-label">Hỏi xoáy AI tối đa</div>
                  <div className="detail-item-value">Tối đa {session.maxFollowupPerQuestion} câu/câu hỏi chính</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <Link
                  to={`/student/exams/${session.sessionId}`}
                  className="btn btn-secondary"
                >
                  Xem chi tiết quy chế
                </Link>
                <Link
                  to={`/student/interview/${session.sessionId}`}
                  className="btn btn-primary"
                  id={`btn-enter-room-${session.sessionId}`}
                >
                  🎙️ Vào Phòng Thi Vấn Đáp AI
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
