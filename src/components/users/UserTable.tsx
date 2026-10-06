import React from 'react';
import type { UserResponse } from '../../types/user';

interface UserTableProps {
  users: UserResponse[];
  onEdit: (user: UserResponse) => void;
  onDelete: (user: UserResponse) => void;
  isLoading?: boolean;
}

export default function UserTable({ users, onEdit, onDelete, isLoading = false }: UserTableProps) {
  // Helper định dạng role code và hiển thị text chuẩn
  const getRoleInfo = (user: UserResponse): { label: string; className: string } => {
    const code = (user.role?.roleCode || user.roleName || '').toUpperCase();
    if (code === 'AD' || code === 'ADMIN') {
      return { label: 'Admin', className: 'role-badge badge-admin' };
    }
    if (code === 'LE' || code === 'LECTURER') {
      return { label: 'Lecturer', className: 'role-badge badge-lecturer' };
    }
    if (code === 'ST' || code === 'STUDENT') {
      return { label: 'Student', className: 'role-badge badge-student' };
    }
    return { label: code || 'User', className: 'role-badge badge-default' };
  };

  return (
    <div className="user-table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            <th style={{ width: '15%' }}>ID</th>
            <th style={{ width: '10%' }}>Code</th>
            <th style={{ width: '19%' }}>Name</th>
            <th style={{ width: '22%' }}>Email</th>
            <th style={{ width: '11%' }}>Role</th>
            <th style={{ width: '10%' }}>Status</th>
            <th style={{ width: '13%', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const roleInfo = getRoleInfo(user);
            return (
              <tr key={user.userId} className="user-table-row">
                <td className="cell-id" title={user.userId}>
                  <span className="id-code">{user.userId}</span>
                </td>
                <td className="cell-code">
                  {user.studentOrStaffCode ? (
                    <span className="code-badge">{user.studentOrStaffCode}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="cell-name font-medium">{user.fullName || '—'}</td>
                <td className="cell-email">{user.email}</td>
                <td className="cell-role">
                  <span className={roleInfo.className}>{roleInfo.label}</span>
                </td>
                <td className="cell-status">
                  <span
                    className={
                      user.isActive === false
                        ? 'status-badge status-inactive'
                        : 'status-badge status-active'
                    }
                  >
                    <span className="status-dot" />
                    {user.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="cell-actions">
                  <div className="action-buttons">
                    <button
                      type="button"
                      className="btn-action btn-action-edit"
                      onClick={() => onEdit(user)}
                      disabled={isLoading}
                      title="Chỉnh sửa người dùng"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-action btn-action-delete"
                      onClick={() => onDelete(user)}
                      disabled={isLoading}
                      title="Xóa người dùng"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
