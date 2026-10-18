import WorkflowPage from '../../components/common/WorkflowPage';

export default function AuditLogsPage() {
  return <WorkflowPage
    title="Nhật ký hệ thống"
    description="Tra cứu các hoạt động quản trị được ghi nhận bởi backend."
    category="AUDIT & COMPLIANCE"
    capabilities={[
      'Nhật ký cần có actor, hành động, đối tượng, thời điểm và kết quả được xác nhận.',
      'Frontend chưa kết nối dịch vụ audit log; không tạo hoạt động mẫu.',
      'Thông tin nhạy cảm cần được ẩn theo chính sách phân quyền backend.',
    ]}
  />;
}
