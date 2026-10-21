import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import PageHeader from '../../components/common/PageHeader';
import WorkflowPage from '../../components/common/WorkflowPage';
import { useLanguage } from '../../context/LanguageContext';
import './DashboardPage.css';

export default function LecturerDashboardPage() {
  const { t } = useLanguage();
  return (
    <div className="lecturer-dashboard">
      <div className="lecturer-dashboard-intro">
        <span>{t('AI ORAL EXAM PLATFORM')}</span>
        <PageHeader title="Không gian giảng viên" description="Chuẩn bị kỳ thi, quản lý câu hỏi và duyệt kết quả trong một nơi." />
        <p className="lecturer-dashboard-notice">
          {t('Các dịch vụ kỳ thi, câu hỏi, đánh giá và báo cáo chưa được kết nối trong frontend. Không có số liệu mẫu hoặc điểm giả được hiển thị.')}
        </p>
      </div>
      <div className="lecturer-dashboard-grid">
        <Link to={APP_ROUTES.lecturer.courses}><span>▣</span><strong>{t('Môn học')}</strong><small>{t('Xem các môn học và lớp được phân công.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.exams}><span>▦</span><strong>{t('Kỳ thi & lịch thi')}</strong><small>{t('Tạo phiên thi, quản lý lịch và danh sách thí sinh.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.questions}><span>▤</span><strong>{t('Ngân hàng câu hỏi')}</strong><small>{t('Quản lý câu hỏi, duyệt bản nháp và tạo câu hỏi AI theo tài liệu môn học.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.evaluations}><span>✓</span><strong>{t('Chấm điểm')}</strong><small>{t('Rà soát gợi ý AI và xác nhận điểm cuối cùng.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.monitoring}><span>◉</span><strong>{t('Giám sát thi')}</strong><small>{t('Kiểm tra trạng thái phiên, nhật ký và bản ghi khi khả dụng.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.reports}><span>↗</span><strong>{t('Báo cáo')}</strong><small>{t('Xem báo cáo lớp, thống kê câu hỏi và xuất điểm.')}</small></Link>
        <Link to={APP_ROUTES.lecturer.rubrics}><span>☷</span><strong>{t('Thang điểm')}</strong><small>{t('Quản lý tiêu chí đánh giá cho câu hỏi vấn đáp.')}</small></Link>
      </div>
      <WorkflowPage
        title="Tình trạng tích hợp"
        description="Thông tin kết nối thực tế của các chức năng giảng viên."
        category="TRẠNG THÁI DỊCH VỤ"
        capabilities={[
          'Các tuyến trang cho câu hỏi, rubric, kỳ thi, giám sát, đánh giá và báo cáo đã có trong ứng dụng.',
          'Service frontend hiện chưa gọi API cho các nghiệp vụ này; các thao tác ghi và kết quả được giữ ở trạng thái chưa khả dụng.',
          'Điểm AI (nếu được cung cấp sau này) phải được phân biệt với điểm cuối cùng do giảng viên phê duyệt.',
        ]}
      />
    </div>
  );
}
