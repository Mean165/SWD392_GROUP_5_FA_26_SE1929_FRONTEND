import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExamSessionById } from '../../services/exam/examService';
import type { ExamSessionResponse } from '../../types/exam';
import '../lecturer/exams/ExamsPage.css';

export default function StudentExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<ExamSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;
    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const data = await getExamSessionById(id);
        setSession(data);
      } catch {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (isLoading) {
    return (
      <div className="exams-page-container">
        <div className="detail-card" style={{ textAlign: 'center', padding: '3rem' }}>
          Đang tải quy chế ca thi...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="exams-page-container">
        <div className="alert-toast alert-error">Không tìm thấy ca thi yêu cầu.</div>
        <Link to="/student/exams" className="btn btn-secondary">
          Quay lại lịch thi
        </Link>
      </div>
    );
  }

  return (
    <div className="exams-page-container">
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>{session.sessionName}</h1>
          <p className="exams-page-subtitle">Quy chế thi vấn đáp AI và hướng dẫn thí sinh</p>
        </div>
        <Link to="/student/exams" className="btn btn-secondary">
          Quay lại danh sách
        </Link>
      </div>

      <div className="detail-card">
        <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Hướng dẫn làm bài thi vấn đáp</h3>
        <ul style={{ lineHeight: '1.8', color: '#334155', paddingLeft: '1.25rem' }}>
          <li>
            Thí sinh sẽ thi vấn đáp trực tiếp với <strong>AI Giám khảo ảo</strong> thông qua micro và tai nghe.
          </li>
          <li>
            Phiên thi bao gồm <strong>{session.maxMainQuestions} câu hỏi chính</strong>.
          </li>
          <li>
            Với mỗi câu trả lời của bạn, AI có thể đặt thêm tối đa{' '}
            <strong>{session.maxFollowupPerQuestion} câu hỏi đào sâu/hỏi xoáy</strong> để kiểm tra độ hiểu sâu.
          </li>
          <li>
            Thời lượng thi tối đa của bạn là <strong>{session.timeLimitMinutes} phút</strong>. Đồng hồ đếm ngược sẽ tự động hiển thị trong phòng thi.
          </li>
          <li>
            Toàn bộ transcript cuộc hội thoại và âm thanh sẽ được lưu vết để giảng viên hậu kiểm và xác nhận điểm cuối cùng.
          </li>
        </ul>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            to={`/student/interview/${session.sessionId}`}
            className="btn btn-primary"
            style={{ fontSize: '1rem', padding: '0.65rem 1.5rem' }}
          >
            🎙️ Sẵn Sàng & Vào Phòng Thi
          </Link>
        </div>
      </div>
    </div>
  );
}
