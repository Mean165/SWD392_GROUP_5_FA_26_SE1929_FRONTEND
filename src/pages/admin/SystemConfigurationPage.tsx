import WorkflowPage from '../../components/common/WorkflowPage';
import { LanguageSetting } from '../../components/common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import '../../pages/student/StudentDashboard.css';

export default function SystemConfigurationPage() {
  const { t } = useLanguage();
  return (
    <div className="student-page">
      <WorkflowPage
        title="Cấu hình hệ thống"
        description="Thiết lập mặc định của nền tảng và các tích hợp dùng chung."
        category="QUẢN TRỊ NỀN TẢNG"
        capabilities={[
          'Frontend chưa kết nối service đọc hoặc cập nhật cấu hình hệ thống.',
          'Tùy chọn Vietnamese/English STT/TTS chỉ khả dụng khi backend cung cấp cấu hình và API tương ứng.',
          'Không có cấu hình được lưu hoặc giả lập từ giao diện hiện tại.',
        ]}
      />
      <section className="student-settings-list">
        <LanguageSetting />
      </section>
      <p className="muted">{t('Ngôn ngữ giao diện được lưu cho trình duyệt này và dùng chung cho mọi vai trò.')}</p>
    </div>
  );
}
