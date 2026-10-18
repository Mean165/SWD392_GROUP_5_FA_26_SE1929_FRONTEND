import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';
import './WorkflowPage.css';

export type WorkflowLink = {
  label: string;
  to: string;
};

type WorkflowPageProps = {
  title: string;
  description: string;
  category: string;
  capabilities: string[];
  related?: WorkflowLink[];
  note?: string;
};

export default function WorkflowPage({
  title,
  description,
  category,
  capabilities,
  related = [],
  note = 'Chức năng này chưa được kết nối với một API backend đã xác nhận. Dữ liệu, thao tác ghi và trạng thái sẽ không được mô phỏng.',
}: WorkflowPageProps) {
  return (
    <div className="workflow-page">
      <PageHeader title={title} description={description} />

      <section className="workflow-status-panel" role="status">
        <span className="workflow-status-icon" aria-hidden="true">i</span>
        <div>
          <span className="workflow-eyebrow">{category}</span>
          <h2>Tích hợp dữ liệu chưa khả dụng</h2>
          <p>{note}</p>
        </div>
        <span className="workflow-status-badge">Chưa kết nối</span>
      </section>

      <div className="workflow-content-grid">
        <section className="workflow-card">
          <span className="workflow-eyebrow">PHẠM VI CHỨC NĂNG</span>
          <h2>Không gian làm việc</h2>
          <ul className="workflow-capabilities">
            {capabilities.map((capability) => (
              <li key={capability}><span aria-hidden="true">✓</span>{capability}</li>
            ))}
          </ul>
        </section>

        <aside className="workflow-card workflow-next-steps">
          <span className="workflow-eyebrow">TIẾP TỤC</span>
          <h2>Liên kết liên quan</h2>
          {related.length ? (
            <nav aria-label="Các trang liên quan">
              {related.map((item) => (
                <Link key={`${item.to}-${item.label}`} to={item.to}>
                  <span>{item.label}</span><span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          ) : (
            <p className="workflow-muted">Chưa có trang liên quan.</p>
          )}
          <p className="workflow-footnote">
            Chỉ thông tin được xác nhận từ dịch vụ mới được trình bày là dữ liệu chính thức.
          </p>
        </aside>
      </div>
    </div>
  );
}
