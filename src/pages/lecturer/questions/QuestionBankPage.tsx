import PageHeader from '../../../components/common/PageHeader';

export default function QuestionBankPage() {
  return (
    <div className="page-container">
      <PageHeader title="Question Bank" description="Manage questions, subjects, and rubric coverage." actions={<button className="btn">Create Question</button>} />
      <div className="card">Question bank placeholder</div>
    </div>
  );
}
