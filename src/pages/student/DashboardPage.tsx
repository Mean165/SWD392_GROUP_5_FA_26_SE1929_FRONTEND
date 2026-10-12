import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';

export default function StudentDashboardPage() {
  return (
    <div className="page-container">
      <PageHeader
        title="Bảng Điều Khiển Sinh Viên (Student Dashboard)"
        description="Theo dõi lịch thi vấn đáp AI, quy chế thi và báo cáo đánh giá năng lực."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📅</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Lịch Thi Vấn Đáp</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Xem ca thi và khung giờ cá nhân</p>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Kiểm tra ca thi sắp diễn ra, số câu hỏi chính và giới hạn hỏi xoáy AI được thiết lập bởi giảng viên.
          </p>
          <Link to="/student/exams" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
            Xem Lịch Thi Của Tôi →
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🎙️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Phòng Thi Vấn Đáp AI</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>AIVES Oral Interview Room</p>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Môi trường thi trực tuyến có AI giám khảo đặt câu hỏi ngẫu nhiên/thích ứng và hỏi sâu theo câu trả lời.
          </p>
          <Link to="/student/exams" className="btn btn-secondary" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
            Kiểm Tra Thiết Bị & Chuẩn Bị
          </Link>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Kết Quả & Báo Cáo</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Transcript và Rubric điểm</p>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Tra cứu nhận xét chi tiết của AI và điểm số cuối cùng được giảng viên bộ môn phê duyệt.
          </p>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
            (Sẽ khả dụng sau khi hoàn thành ca thi)
          </div>
        </div>
      </div>
    </div>
  );
}
