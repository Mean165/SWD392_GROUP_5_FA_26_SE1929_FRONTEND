import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createExamSession } from '../../../services/exam/examService';
import './ExamsPage.css';

interface FormErrors {
  sessionName?: string;
  maxMainQuestions?: string;
  maxFollowupPerQuestion?: string;
  timeLimitMinutes?: string;
  general?: string;
}

export default function CreateExamPage() {
  const navigate = useNavigate();

  const [sessionName, setSessionName] = useState('');
  const [subjectTopic, setSubjectTopic] = useState('SWD392 - Software Architecture & Design');
  const [selectionStrategy, setSelectionStrategy] = useState('ADAPTIVE');
  const [maxMainQuestions, setMaxMainQuestions] = useState<number>(3);
  const [maxFollowupPerQuestion, setMaxFollowupPerQuestion] = useState<number>(2);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [startTime, setStartTime] = useState<string>('');
  const [status, setStatus] = useState<string>('SCHEDULED');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!sessionName.trim()) {
      errs.sessionName = 'Vui lòng nhập tên phiên thi vấn đáp';
    }

    if (!maxMainQuestions || maxMainQuestions < 1) {
      errs.maxMainQuestions = 'Số câu hỏi chính phải từ 1 trở lên';
    }

    if (maxFollowupPerQuestion < 0) {
      errs.maxFollowupPerQuestion = 'Số câu hỏi đào sâu không được nhỏ hơn 0';
    }

    if (!timeLimitMinutes || timeLimitMinutes < 1) {
      errs.timeLimitMinutes = 'Thời lượng phỏng vấn mỗi thí sinh phải từ 1 phút';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      let formattedStartTime: string | undefined = undefined;
      if (startTime) {
        formattedStartTime = new Date(startTime).toISOString();
      }

      const session = await createExamSession({
        sessionName: sessionName.trim(),
        maxMainQuestions: Number(maxMainQuestions),
        maxFollowupPerQuestion: Number(maxFollowupPerQuestion),
        timeLimitMinutes: Number(timeLimitMinutes),
        status: (status || 'DRAFT') as any,
        startTime: formattedStartTime || new Date().toISOString(),
      });

      // Điều hướng đến trang chi tiết để giảng viên bắt đầu gán sinh viên
      navigate(`/lecturer/exams/${session.sessionId}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo phiên thi. Vui lòng kiểm tra lại.';
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="exams-page-container">
      {/* Header */}
      <div className="exams-page-header">
        <div className="exams-page-title-group">
          <h1>Tạo Phiên Thi Vấn Đáp Mới</h1>
          <p className="exams-page-subtitle">
            Thiết lập môn học, quy chế hỏi xoáy của AI và khung thời gian thi vấn đáp
          </p>
        </div>
        <Link to="/lecturer/exams" className="btn btn-secondary">
          Quay lại danh sách
        </Link>
      </div>

      {errors.general && (
        <div className="alert-toast alert-error">
          <span>{errors.general}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="detail-card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Section 1: Thông tin cơ bản */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                1. Thông tin chung phiên thi
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="create-session-name">Tên phiên thi vấn đáp *</label>
                  <input
                    id="create-session-name"
                    type="text"
                    className="form-control"
                    placeholder="VD: Bảo vệ đồ án môn SWD392 - Lớp SE1929 - Hội đồng 1"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.sessionName && (
                    <span className="field-error">{errors.sessionName}</span>
                  )}
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="create-subject">Môn học / Chủ đề đề thi *</label>
                    <select
                      id="create-subject"
                      className="form-control"
                      value={subjectTopic}
                      onChange={(e) => setSubjectTopic(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="SWD392 - Software Architecture & Design">SWD392 - Software Architecture & Design</option>
                      <option value="PRN231 - Building Cross-Platform Back-End Applications">PRN231 - Building Cross-Platform Back-End Applications</option>
                      <option value="PRM392 - Mobile Programming">PRM392 - Mobile Programming</option>
                      <option value="DBI202 - Database Systems">DBI202 - Database Systems</option>
                    </select>
                    <span className="form-hint">Ngân hàng câu hỏi sẽ được bốc từ môn học này</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="create-strategy">Chiến lược lựa chọn câu hỏi</label>
                    <select
                      id="create-strategy"
                      className="form-control"
                      value={selectionStrategy}
                      onChange={(e) => setSelectionStrategy(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="ADAPTIVE">Thích ứng theo Bloom Level & Không trùng thí sinh trước</option>
                      <option value="RANDOM">Ngẫu nhiên cân bằng độ khó</option>
                    </select>
                    <span className="form-hint">AI tự động xoay vòng câu hỏi để tránh trùng lặp giữa 2 thí sinh thi liên tiếp</span>
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />

            {/* Section 2: Cấu hình quy chế vấn đáp AI */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                2. Quy chế hỏi vấn đáp & Giới hạn AI
              </h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="create-max-main">Số câu hỏi chính mỗi thí sinh *</label>
                  <input
                    id="create-max-main"
                    type="number"
                    min="1"
                    max="50"
                    className="form-control"
                    value={maxMainQuestions}
                    onChange={(e) => setMaxMainQuestions(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                  <span className="form-hint">Số lượng câu hỏi chính thức được lấy từ ngân hàng</span>
                  {errors.maxMainQuestions && (
                    <span className="field-error">{errors.maxMainQuestions}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="create-max-followup">Số câu hỏi đào sâu tối đa mỗi câu chính *</label>
                  <input
                    id="create-max-followup"
                    type="number"
                    min="0"
                    max="10"
                    className="form-control"
                    value={maxFollowupPerQuestion}
                    onChange={(e) => setMaxFollowupPerQuestion(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                  <span className="form-hint">AI sẽ hỏi xoáy theo câu trả lời của thí sinh (tối đa N câu)</span>
                  {errors.maxFollowupPerQuestion && (
                    <span className="field-error">{errors.maxFollowupPerQuestion}</span>
                  )}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />

            {/* Section 3: Thời gian thi */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                3. Thời gian & Khung giờ
              </h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="create-time-limit">Thời lượng thi mỗi thí sinh (phút) *</label>
                  <input
                    id="create-time-limit"
                    type="number"
                    min="1"
                    max="180"
                    className="form-control"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                  <span className="form-hint">Bộ đếm giờ của phòng thi AI cho mỗi sinh viên</span>
                  {errors.timeLimitMinutes && (
                    <span className="field-error">{errors.timeLimitMinutes}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="create-start-time">Thời gian bắt đầu ca thi</label>
                  <input
                    id="create-start-time"
                    type="datetime-local"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className="form-hint">Mốc giờ mở phòng thi cho thí sinh đầu tiên</span>
                </div>
              </div>
            </div>

            {/* Footer action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Link to="/lecturer/exams" className="btn btn-secondary">
                Hủy bỏ
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                id="btn-submit-page-create"
              >
                {isSubmitting ? 'Đang khởi tạo...' : 'Tạo phiên & Tiếp tục gán thí sinh'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
