import React from 'react';
import { Link } from 'react-router-dom';
import type { ExamSessionResponse } from '../../types/exam';
import '../../pages/lecturer/exams/ExamsPage.css';

interface ExamSessionTableProps {
  sessions: ExamSessionResponse[];
  onEdit: (session: ExamSessionResponse) => void;
  onAssignStudent: (session: ExamSessionResponse) => void;
  isLoading?: boolean;
}

export default function ExamSessionTable({
  sessions,
  onEdit,
  onAssignStudent,
  isLoading = false,
}: ExamSessionTableProps) {
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SCHEDULED') {
      return <span className="status-badge badge-scheduled">Đã lên lịch</span>;
    }
    if (s === 'IN_PROGRESS') {
      return <span className="status-badge badge-in-progress">Đang diễn ra</span>;
    }
    if (s === 'COMPLETED') {
      return <span className="status-badge badge-completed">Hoàn thành</span>;
    }
    if (s === 'CANCELLED') {
      return <span className="status-badge badge-cancelled">Đã hủy</span>;
    }
    return <span className="status-badge badge-waiting">{status || 'Chờ'}</span>;
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
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
    <div className="table-wrapper">
      <table className="exam-table">
        <thead>
          <tr>
            <th style={{ width: '22%' }}>Tên phiên thi</th>
            <th style={{ width: '16%' }}>Thời gian bắt đầu</th>
            <th style={{ width: '13%' }}>Thời lượng/SV</th>
            <th style={{ width: '17%' }}>Cấu hình câu hỏi</th>
            <th style={{ width: '12%' }}>Trạng thái</th>
            <th style={{ width: '20%', textAlign: 'center' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                {isLoading ? 'Đang tải danh sách phiên thi...' : 'Không tìm thấy phiên thi nào.'}
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.sessionId}>
                <td>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{session.sessionName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Tạo bởi: {session.createdByName || 'Giảng viên'}
                  </div>
                </td>
                <td>{formatDateTime(session.startTime)}</td>
                <td>
                  <span className="pill-metric">
                    ⏱️ {session.timeLimitMinutes} phút
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>
                      <strong>{session.maxMainQuestions}</strong> câu hỏi chính
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Tối đa <strong>{session.maxFollowupPerQuestion}</strong> hỏi xoáy/câu
                    </span>
                  </div>
                </td>
                <td>{getStatusBadge(session.status)}</td>
                <td>
                  <div className="table-actions-group">
                    <Link
                      to={`/lecturer/exams/${session.sessionId}`}
                      className="btn-action-item btn-action-view"
                      title="Xem chi tiết phiên thi & Danh sách thí sinh"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Chi tiết</span>
                    </Link>
                    <button
                      type="button"
                      className="btn-action-item btn-action-assign"
                      onClick={() => onAssignStudent(session)}
                      title="Gán sinh viên & chia khung giờ thi"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      <span>+ Thí sinh</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-item btn-action-edit"
                      onClick={() => onEdit(session)}
                      title="Chỉnh sửa cấu hình phiên thi"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>Sửa</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
