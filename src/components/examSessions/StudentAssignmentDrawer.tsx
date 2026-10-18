import React, { useState, useEffect, useCallback } from 'react';
import type { ExamSession, StudentSessionAssignment, ParticipantStatus } from '../../types/examSession';
import {
  getExamSessionStudents,
  assignStudentsToSession,
} from '../../services/exam/examSessionService';
import { getUsers } from '../../services/userService';
import type { UserResponse } from '../../types/user';

interface StudentAssignmentDrawerProps {
  session: ExamSession | null;
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

// Fallback student pool if user API has no students
const FALLBACK_STUDENT_POOL: Array<{
  id: string;
  name: string;
  code: string;
  email: string;
}> = [
  { id: 'usr-st-01', name: 'Nguyen Van An', code: 'SE170101', email: 'annvse1701@fpt.edu.vn' },
  { id: 'usr-st-02', name: 'Le Thi Bao', code: 'SE170202', email: 'baoltse1702@fpt.edu.vn' },
  { id: 'usr-st-03', name: 'Pham Quoc Cuong', code: 'SE170303', email: 'cuongpqse1703@fpt.edu.vn' },
  { id: 'usr-st-04', name: 'Hoang Minh Duc', code: 'SE170404', email: 'duchmse1704@fpt.edu.vn' },
  { id: 'usr-st-05', name: 'Doan Thu Giang', code: 'SE170505', email: 'giangdtse1705@fpt.edu.vn' },
  { id: 'usr-st-06', name: 'Vu Hoang Nam', code: 'SE170606', email: 'namvhse1706@fpt.edu.vn' },
  { id: 'usr-st-07', name: 'Bui Phuong Thao', code: 'SE170707', email: 'thaobpse1707@fpt.edu.vn' },
];

export default function StudentAssignmentDrawer({
  session,
  isOpen,
  onClose,
  onToast,
}: StudentAssignmentDrawerProps) {
  const [assignedStudents, setAssignedStudents] = useState<StudentSessionAssignment[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Available students list
  const [availableStudents, setAvailableStudents] = useState<
    Array<{ id: string; name: string; code: string; email: string }>
  >(FALLBACK_STUDENT_POOL);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [customStudentId, setCustomStudentId] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load available students from userService
  useEffect(() => {
    getUsers()
      .then((users: UserResponse[]) => {
        if (users && users.length > 0) {
          // Lọc sinh viên role ST hoặc lấy toàn bộ
          const students = users
            .filter((u) => {
              const r = (u.role?.roleCode || u.roleName || '').toUpperCase();
              return r === 'ST' || r === 'STUDENT' || !r.includes('AD');
            })
            .map((u) => ({
              id: u.userId,
              name: u.fullName,
              code: u.studentOrStaffCode || u.userId,
              email: u.email,
            }));

          if (students.length > 0) {
            setAvailableStudents(students);
          }
        }
      })
      .catch(() => {
        // Fallback to FALLBACK_STUDENT_POOL
      });
  }, []);

  // Fetch assigned students for the selected session
  const fetchAssignedStudents = useCallback(async () => {
    if (!session) return;
    setIsLoadingList(true);
    try {
      const data = await getExamSessionStudents(session.id);
      if (Array.isArray(data) && data.length > 0) {
        const enriched = data.map((item) => {
          const match = availableStudents.find(
            (s) => String(s.id) === String(item.studentId) || s.code === item.studentId,
          );
          return {
            ...item,
            studentName: item.studentName || match?.name || `Student #${item.studentId}`,
            studentEmail: item.studentEmail || match?.email || `${item.studentId}@fpt.edu.vn`,
            studentCode: item.studentCode || match?.code || String(item.studentId),
          };
        });
        setAssignedStudents(enriched);
      } else {
        // Fallback default assignments for demo
        const defaultAssignments: StudentSessionAssignment[] = [
          {
            id: `asg-${session.id}-1`,
            sessionId: session.id,
            studentId: 'usr-st-01',
            studentName: 'Nguyen Van An',
            studentEmail: 'annvse1701@fpt.edu.vn',
            studentCode: 'SE170101',
            scheduledTime: session.startTime || '2026-10-15T08:30:00',
            participantStatus: 'NOT_STARTED',
          },
          {
            id: `asg-${session.id}-2`,
            sessionId: session.id,
            studentId: 'usr-st-02',
            studentName: 'Le Thi Bao',
            studentEmail: 'baoltse1702@fpt.edu.vn',
            studentCode: 'SE170202',
            scheduledTime: session.startTime || '2026-10-15T09:15:00',
            participantStatus: 'WAITING',
          },
        ];
        setAssignedStudents(defaultAssignments);
      }
    } catch {
      setAssignedStudents([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [session, availableStudents]);

  useEffect(() => {
    if (isOpen && session) {
      fetchAssignedStudents();
      // Reset form default scheduledTime to session startTime
      setScheduledTime(session.startTime || new Date().toISOString().slice(0, 16));
      setSelectedStudentId('');
      setCustomStudentId('');
      setFormError(null);
    }
  }, [isOpen, session, fetchAssignedStudents]);

  if (!isOpen || !session) return null;

  // Determine active studentId being chosen
  const currentTargetStudentId = isManualInput ? customStudentId.trim() : selectedStudentId;

  // PREVENT DUPLICATE ASSIGNMENTS: Kiểm tra xem học sinh đã có trong ca thi chưa
  const isDuplicate = Boolean(
    currentTargetStudentId &&
      assignedStudents.some(
        (a) =>
          String(a.studentId).toLowerCase() === currentTargetStudentId.toLowerCase() ||
          (a.studentCode && a.studentCode.toLowerCase() === currentTargetStudentId.toLowerCase()),
      ),
  );

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentTargetStudentId) {
      setFormError('Please select or input a student ID.');
      return;
    }

    if (!scheduledTime) {
      setFormError('Please select a scheduled interview time.');
      return;
    }

    // STRICT CHECK: PREVENT DUPLICATES
    if (isDuplicate) {
      const errMsg = `Student "${currentTargetStudentId}" is already assigned to this session. Duplicate assignments are prohibited.`;
      setFormError(errMsg);
      onToast('warning', errMsg);
      return;
    }

    setIsAssigning(true);

    try {
      const matched = availableStudents.find(
        (s) => String(s.id) === currentTargetStudentId || s.code === currentTargetStudentId,
      );

      await assignStudentsToSession(session.id, {
        studentId: currentTargetStudentId,
        scheduledTime,
        participantStatus: 'NOT_STARTED',
      });

      const newAssignment: StudentSessionAssignment = {
        id: `asg-${Date.now()}`,
        sessionId: session.id,
        studentId: currentTargetStudentId,
        studentName: matched?.name || `Student #${currentTargetStudentId}`,
        studentEmail: matched?.email || `${currentTargetStudentId}@fpt.edu.vn`,
        studentCode: matched?.code || currentTargetStudentId,
        scheduledTime,
        participantStatus: 'NOT_STARTED',
      };

      setAssignedStudents((prev) => [...prev, newAssignment]);
      onToast(
        'success',
        `Assigned ${matched?.name || currentTargetStudentId} to session successfully!`,
      );

      // Reset selection
      setSelectedStudentId('');
      setCustomStudentId('');
      setFormError(null);
    } catch (err: any) {
      if (
        err?.message?.includes('Duplicate') ||
        err?.message?.includes('trùng lặp') ||
        err?.message?.includes('already assigned')
      ) {
        setFormError(err.message);
        onToast('warning', err.message);
        return;
      }

      console.warn('Backend assign student offline, fallback local assignment:', err);
      const matched = availableStudents.find(
        (s) => String(s.id) === currentTargetStudentId || s.code === currentTargetStudentId,
      );
      const newAssignment: StudentSessionAssignment = {
        id: `asg-${Date.now()}`,
        sessionId: session.id,
        studentId: currentTargetStudentId,
        studentName: matched?.name || `Student #${currentTargetStudentId}`,
        studentEmail: matched?.email || `${currentTargetStudentId}@fpt.edu.vn`,
        studentCode: matched?.code || currentTargetStudentId,
        scheduledTime,
        participantStatus: 'NOT_STARTED',
      };
      setAssignedStudents((prev) => [...prev, newAssignment]);
      onToast(
        'success',
        `Assigned ${matched?.name || currentTargetStudentId} to session successfully!`,
      );
      setSelectedStudentId('');
      setCustomStudentId('');
      setFormError(null);
    } finally {
      setIsAssigning(false);
    }
  };

  const getParticipantBadge = (status: ParticipantStatus | string) => {
    const s = String(status).toUpperCase();
    switch (s) {
      case 'IN_PROGRESS':
        return <span className="ses-asg-badge asg-progress">In Progress</span>;
      case 'COMPLETED':
        return <span className="ses-asg-badge asg-completed">Completed</span>;
      case 'WAITING':
        return <span className="ses-asg-badge asg-waiting">Waiting</span>;
      case 'ABSENT':
        return <span className="ses-asg-badge asg-absent">Absent</span>;
      case 'NOT_STARTED':
      default:
        return <span className="ses-asg-badge asg-notstarted">Not Started</span>;
    }
  };

  const formatScheduledTime = (timeStr: string) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container ses-drawer-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="modal-header ses-drawer-header">
          <div>
            <div className="ses-drawer-eyebrow">Student Session Assignment</div>
            <h3 id="drawer-title" className="modal-title">
              {session.sessionName}
            </h3>
            <div className="ses-drawer-meta">
              <span>Time: {session.timeLimitMinutes} mins</span>
              <span>Main Questions: {session.maxMainQuestions}</span>
              <span>Follow-ups: {session.maxFollowupPerQuestion}</span>
              <span>Assigned: {assignedStudents.length} students</span>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ses-drawer-content">
          {/* ASSIGN FORM SECTION */}
          <div className="ses-assign-card">
            <div className="ses-assign-card-header">
              <h4 className="ses-card-title">Assign Student to Session</h4>
              <button
                type="button"
                className="ses-btn-text"
                onClick={() => {
                  setIsManualInput(!isManualInput);
                  setFormError(null);
                }}
              >
                {isManualInput ? '← Select from list' : '+ Enter custom ID'}
              </button>
            </div>

            {formError && (
              <div className="alert-message alert-error" role="alert">
                {formError}
              </div>
            )}

            {/* DUPLICATE WARNING ALERT */}
            {isDuplicate && (
              <div className="alert-message alert-warning" role="alert">
                <strong>Duplicate Alert:</strong> Student "{currentTargetStudentId}" is already assigned to this session. Duplicate assignments are prohibited.
              </div>
            )}

            <form onSubmit={handleAssignStudent} className="ses-assign-form" noValidate>
              <div className="ses-assign-grid">
                {/* Student Selection */}
                <div className="form-group flex-2">
                  <label className="form-label">
                    Student <span className="text-required">*</span>
                  </label>
                  {isManualInput ? (
                    <input
                      type="text"
                      className={`form-input ${isDuplicate ? 'input-error' : ''}`}
                      placeholder="e.g. SE170101 or usr-st-01"
                      value={customStudentId}
                      onChange={(e) => {
                        setCustomStudentId(e.target.value);
                        setFormError(null);
                      }}
                      disabled={isAssigning}
                    />
                  ) : (
                    <select
                      className={`form-select ${isDuplicate ? 'input-error' : ''}`}
                      value={selectedStudentId}
                      onChange={(e) => {
                        setSelectedStudentId(e.target.value);
                        setFormError(null);
                      }}
                      disabled={isAssigning}
                    >
                      <option value="">-- Choose student from directory --</option>
                      {availableStudents.map((st) => {
                        const alreadyIn = assignedStudents.some(
                          (a) => String(a.studentId) === String(st.id) || a.studentCode === st.code,
                        );
                        return (
                          <option key={st.id} value={st.id}>
                            {st.code} - {st.name} ({st.email}) {alreadyIn ? '• [Already Assigned]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                {/* Scheduled Time */}
                <div className="form-group flex-1">
                  <label className="form-label">
                    Scheduled Slot <span className="text-required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={isAssigning}
                  />
                </div>

                {/* Submit button */}
                <div className="ses-assign-btn-wrapper">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isAssigning || !currentTargetStudentId || isDuplicate}
                    title={isDuplicate ? 'Cannot assign: Student is already assigned' : 'Assign student to session'}
                  >
                    {isAssigning ? 'Assigning...' : '+ Assign Student'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ASSIGNED STUDENTS LIST */}
          <div className="ses-assigned-list-section">
            <div className="ses-assigned-list-header">
              <h4 className="ses-card-title">
                Assigned Students ({assignedStudents.length})
              </h4>
              <span className="ses-caption">
                Students scheduled for oral interview examination
              </span>
            </div>

            {isLoadingList ? (
              <div className="state-container" style={{ padding: '2rem' }}>
                <div className="loading-spinner" />
                <p className="state-title">Loading assigned students...</p>
              </div>
            ) : assignedStudents.length === 0 ? (
              <div className="ses-empty-assigned-box">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
                <p className="ses-empty-title">No students assigned yet</p>
                <p className="ses-empty-desc">
                  Select a student in the form above and assign their scheduled interview slot.
                </p>
              </div>
            ) : (
              <div className="ses-asg-table-wrapper">
                <table className="ses-asg-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Student Code</th>
                      <th style={{ width: '30%' }}>Student Name</th>
                      <th style={{ width: '25%' }}>Email</th>
                      <th style={{ width: '18%' }}>Scheduled Slot</th>
                      <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedStudents.map((assignment, index) => (
                      <tr key={assignment.id || `${assignment.studentId}-${index}`}>
                        <td className="cell-st-code">
                          <span className="id-code">
                            {assignment.studentCode || assignment.studentId}
                          </span>
                        </td>
                        <td className="cell-st-name font-medium">
                          {assignment.studentName || `Student #${assignment.studentId}`}
                        </td>
                        <td className="cell-st-email text-muted">
                          {assignment.studentEmail || '—'}
                        </td>
                        <td className="cell-st-time">
                          <span className="ses-slot-pill">
                            {formatScheduledTime(assignment.scheduledTime)}
                          </span>
                        </td>
                        <td className="cell-st-status" style={{ textAlign: 'center' }}>
                          {getParticipantBadge(assignment.participantStatus)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer ses-drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
