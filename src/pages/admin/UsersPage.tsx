import PageHeader from '../../components/common/PageHeader';

export default function UsersPage() {
  return (
    <div className="page-container">
      <PageHeader title="User Management" description="Manage admin, lecturer, and student accounts." actions={<button className="btn">Create User</button>} />
      <div className="card">User table placeholder</div>
    </div>
  );
}
