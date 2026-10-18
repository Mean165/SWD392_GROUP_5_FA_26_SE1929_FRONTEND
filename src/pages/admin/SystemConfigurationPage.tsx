import WorkflowPage from '../../components/common/WorkflowPage';

export default function SystemConfigurationPage() {
  return <WorkflowPage
    title="Cấu hình hệ thống"
    description="Thiết lập mặc định của nền tảng và các tích hợp dùng chung."
    category="QUẢN TRỊ NỀN TẢNG"
    capabilities={[
      'Frontend chưa kết nối service đọc hoặc cập nhật cấu hình hệ thống.',
      'Tùy chọn Vietnamese/English STT/TTS chỉ khả dụng khi backend cung cấp cấu hình và API tương ứng.',
      'Không có cấu hình được lưu hoặc giả lập từ giao diện hiện tại.',
    ]}
  />;
}
