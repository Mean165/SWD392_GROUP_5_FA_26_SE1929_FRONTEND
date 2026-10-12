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
import './ExamsPage.css';

export default function ExamParticipantsPage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<ExamSessionResponse | null>(null);
  const [participants, setParticipants] = useState<StudentSessionAssignmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  return (
    <div className="exams-page-container">
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>Danh Sách Thí Sinh Tham Gia</h1>
          <p className="exams-page-subtitle">
            Phiên thi: <strong>{session?.sessionName || id}</strong>
          </p>
        </div>
        <div className="exams-header-actions">
          <Link to={`/lecturer/exams/${id}`} className="btn btn-secondary">
            ← Quay lại chi tiết
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAssignModalOpen(true)}
          >
            + Gán Thí Sinh
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert-toast alert-success">
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

      <ParticipantTable participants={participants} isLoading={isLoading} />

      {session && isAssignModalOpen && (
        <AssignStudentModal
          session={session}
          isOpen={true}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            loadData();
          }}
        />
      )}
    </div>
  );
}
