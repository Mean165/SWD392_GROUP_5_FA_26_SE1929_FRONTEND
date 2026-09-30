import PageHeader from '../../components/common/PageHeader';

export default function SubjectAssignmentsPage() {
  return (
    <div className="page-container">
      <PageHeader title="Subject Assignments" description="Assign lecturers to subjects." actions={<button className="btn">New Assignment</button>} />
      <div className="card">Assignment matrix placeholder</div>
    </div>
  );
}
