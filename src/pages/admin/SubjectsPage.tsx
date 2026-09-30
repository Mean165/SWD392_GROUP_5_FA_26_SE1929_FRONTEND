import PageHeader from '../../components/common/PageHeader';

export default function SubjectsPage() {
  return (
    <div className="page-container">
      <PageHeader title="Subjects" description="Manage subjects and academic categories." actions={<button className="btn">Add Subject</button>} />
      <div className="card">Subject listing placeholder</div>
    </div>
  );
}
