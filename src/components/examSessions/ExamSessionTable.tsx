import React, { useState } from 'react';
import type { ExamSession, ExamSessionStatus } from '../../types/examSession';

interface ExamSessionTableProps {
  sessions: ExamSession[];
  onAssignStudents: (session: ExamSession) => void;
  onStatusChange: (id: string | number, status: ExamSessionStatus) => Promise<void>;
  isLoading?: boolean;
}

export default function ExamSessionTable({
  sessions,
  onAssignStudents,
  onStatusChange,
  isLoading = false,
}: ExamSessionTableProps) {
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const handleStatusChange = async (id: string | number, status: ExamSessionStatus) => {
    try {
      setUpdatingId(id);
      await onStatusChange(id, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: ExamSessionStatus) => {
    switch (status) {
      case 'READY':
        return (
          <span className="ses-badge ses-badge-ready">
            <span className="ses-dot" /> Ready
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="ses-badge ses-badge-inprogress">
            <span className="ses-dot pulse" /> In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="ses-badge ses-badge-completed">
            <span className="ses-dot" /> Completed
          </span>
        );
      case 'DRAFT':
      default:
        return (
          <span className="ses-badge ses-badge-draft">
            <span className="ses-dot" /> Draft
          </span>
        );
    }
  };

  const formatDateTime = (isoString: string): string => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="ses-table-container">
      <table className="ses-table">
        <thead>
          <tr>
            <th style={{ width: '30%' }}>Session Name</th>
            <th style={{ width: '12%' }}>Time Limit</th>
            <th style={{ width: '12%' }}>Main Qs</th>
            <th style={{ width: '12%' }}>Follow-ups</th>
            <th style={{ width: '16%' }}>Start Time</th>
            <th style={{ width: '10%' }}>Status</th>
            <th style={{ width: '18%', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => {
            const isUpdating = updatingId === session.id;

            return (
              <tr key={session.id} className="ses-table-row">
                {/* Session Name */}
                <td className="cell-session-name">
                  <div className="ses-name-text">{session.sessionName}</div>
                  <div className="ses-meta-line">
                    <span className="ses-id-tag">ID: {session.id}</span>
                    {session.createdAt && (
                      <span className="ses-date-tag">
                        Created: {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>

                {/* Time Limit */}
                <td className="cell-time">
                  <span className="ses-metric-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {session.timeLimitMinutes} mins
                  </span>
                </td>

                {/* Max Main Questions */}
                <td className="cell-main-q">
                  <span className="ses-count-badge" title="Max main questions per interview">
                    {session.maxMainQuestions} questions
                  </span>
                </td>

                {/* Max Follow-ups */}
                <td className="cell-followup">
                  <span className="ses-count-badge badge-sub" title="Max follow-up questions">
                    {session.maxFollowupPerQuestion} follow-ups
                  </span>
                </td>

                {/* Start Time */}
                <td className="cell-start-time">
                  <div className="ses-time-wrapper">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>{formatDateTime(session.startTime)}</span>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="cell-status">{getStatusBadge(session.status)}</td>

                {/* Actions: Assign Students + Quick Status Toggle */}
                <td className="cell-actions">
                  <div className="ses-action-buttons">
                    <button
                      type="button"
                      className="btn-action btn-assign-students"
                      onClick={() => onAssignStudents(session)}
                      title="View and assign students to this exam session"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      <span>Assign</span>
                    </button>

                    {/* Quick status dropdown selector */}
                    <select
                      className="ses-status-select"
                      value={session.status}
                      onChange={(e) =>
                        handleStatusChange(session.id, e.target.value as ExamSessionStatus)
                      }
                      disabled={isLoading || isUpdating}
                      title="Update session status"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="READY">Ready</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
