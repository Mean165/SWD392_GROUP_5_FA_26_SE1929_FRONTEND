import PageHeader from '../../../components/common/PageHeader';

export default function ExamListPage() {
  return (
    <div className="page-container">
      <PageHeader title="Exam Management" description="Create and manage oral exams." actions={<button className="btn">New Exam</button>} />
      <div className="card">Exam list placeholder</div>
    </div>
  );
}
