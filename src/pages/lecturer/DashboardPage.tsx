import PageHeader from '../../components/common/PageHeader';

export default function LecturerDashboardPage() {
  return (
    <div className="page-container">
      <PageHeader title="Lecturer Dashboard" description="Question bank, exams, and evaluation performance." />
      <div className="grid">
        <div className="card">Question metrics placeholder</div>
        <div className="card">Exam overview placeholder</div>
      </div>
    </div>
  );
}
