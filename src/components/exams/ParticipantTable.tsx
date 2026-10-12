import React from 'react';
import type { StudentSessionAssignmentResponse } from '../../types/exam';

interface ParticipantTableProps {
  participants: StudentSessionAssignmentResponse[];
  isLoading?: boolean;
}

export default function ParticipantTable({
  participants,
  isLoading = false,
}: ParticipantTableProps) {
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SCHEDULED') {
      return <span className="status-badge badge-scheduled">Đã lên lịch</span>;
    }
    if (s === 'WAITING') {
      return <span className="status-badge badge-waiting">Đang chờ</span>;
    }
    if (s === 'IN_PROGRESS') {
      return <span className="status-badge badge-in-progress">Đang thi</span>;
    }
    if (s === 'COMPLETED') {
      return <span className="status-badge badge-completed">Đã thi xong</span>;
    }
    if (s === 'ABSENT') {
      return <span className="status-badge badge-cancelled">Vắng thi</span>;
    }
    return <span className="status-badge badge-waiting">{status}</span>;
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
            <th style={{ width: '8%' }}>STT</th>
            <th style={{ width: '15%' }}>Mã sinh viên</th>
            <th style={{ width: '22%' }}>Họ và tên</th>
            <th style={{ width: '25%' }}>Email</th>
            <th style={{ width: '18%' }}>Khung giờ thi</th>
            <th style={{ width: '12%', textAlign: 'center' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {participants.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                {isLoading
                  ? 'Đang tải danh sách thí sinh...'
                  : 'Chưa có sinh viên nào được phân công vào ca thi này.'}
              </td>
            </tr>
          ) : (
            participants.map((p, index) => (
              <tr key={p.assignmentId || index}>
                <td>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>#{index + 1}</span>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  >
                    {p.studentCode}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {p.studentName || 'Sinh viên'}
                  </div>
                </td>
                <td>
                  <span style={{ color: '#475569', fontSize: '0.8125rem' }}>
                    {p.studentEmail || '—'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 500, color: '#2563eb' }}>
                    📅 {formatDateTime(p.scheduledTime)}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>{getStatusBadge(p.status)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
