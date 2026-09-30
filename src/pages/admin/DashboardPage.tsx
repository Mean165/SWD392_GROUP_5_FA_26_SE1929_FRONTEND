import PageHeader from '../../components/common/PageHeader';

export default function DashboardPage() {
  return (
    <div className="page-container">
      <PageHeader title="Admin Dashboard" description="System overview and monitoring." />
      <div className="grid">
        <div className="card">Overview stats placeholder</div>
        <div className="card">Recent system activity placeholder</div>
      </div>
    </div>
  );
}
