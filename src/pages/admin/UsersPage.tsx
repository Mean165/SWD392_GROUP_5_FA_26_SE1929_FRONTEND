import { useState, useEffect, useCallback } from 'react';
import { getUsers, filterUsers } from '../../services/userService';
import type { UserResponse } from '../../types/user';
import UserFilter, { type UserFilterValues } from '../../components/users/UserFilter';
import UserTable from '../../components/users/UserTable';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import DeleteConfirmModal from '../../components/users/DeleteConfirmModal';
import './UsersPage.css';

export default function UsersPage() {
  // State danh sách người dùng và trạng thái nạp dữ liệu
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State lưu điều kiện filter hiện tại để có thể reload đúng ngữ cảnh
  const [currentFilter, setCurrentFilter] = useState<UserFilterValues | null>(null);

  // State thông báo thành công (Toast notification)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State quản lý Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);

  // Hàm tải dữ liệu người dùng (toàn bộ hoặc theo filter)
  const loadUsers = useCallback(async (filters?: UserFilterValues | null) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let data: UserResponse[];

      // Nếu có điều kiện tìm kiếm thì gọi API filter
      if (filters && (filters.name || filters.email || filters.role)) {
        data = await filterUsers({
          fullName: filters.name || undefined,
          email: filters.email || undefined,
          roleCode: filters.role || undefined,
        });
      } else {
        // Mặc định gọi GET /api/users
        data = await getUsers();
      }

      setUsers(data || []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load users.';
      setErrorMessage(msg);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tải danh sách người dùng lần đầu khi mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Tự động ẩn thông báo thành công sau 4 giây
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // Xử lý khi Admin nhấn nút Search trên Filter
  const handleSearch = (filterValues: UserFilterValues) => {
    setCurrentFilter(filterValues);
    loadUsers(filterValues);
  };

  // Xử lý khi Admin nhấn nút Reset trên Filter
  const handleReset = () => {
    setCurrentFilter(null);
    loadUsers(null);
  };

  // Callback khi tạo, sửa hoặc xóa User thành công
  const handleOperationSuccess = (msg: string) => {
    setSuccessMessage(msg);
    // Reload lại danh sách theo filter hiện tại
    loadUsers(currentFilter);
  };

  return (
    <div className="users-page-container">
      {/* Page Header */}
      <div className="users-page-header">
        <div className="users-page-title-group">
          <h1>User Management</h1>
          <p className="users-page-subtitle">
            Quản lý tài khoản Admin, Giảng viên và Sinh viên trong hệ thống AIVES
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          id="btn-open-create-user"
        >
          <span>+</span> Create User
        </button>
      </div>

      {/* Thông báo thành công nếu có */}
      {successMessage && (
        <div className="alert-toast alert-success" role="status">
          <span>{successMessage}</span>
          <button
            type="button"
            className="alert-toast-close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Khu vực Filter tìm kiếm */}
      <UserFilter
        onSearch={handleSearch}
        onReset={handleReset}
        isLoading={isLoading}
      />

      {/* Khu vực Bảng danh sách User & Trạng thái Loading / Error / Empty */}
      <div className="card-panel table-panel">
        {isLoading ? (
          <div className="state-container">
            <div className="loading-spinner" />
            <p className="state-title">Loading users...</p>
            <p className="state-desc">Đang tải danh sách người dùng từ hệ thống</p>
          </div>
        ) : errorMessage ? (
          <div className="state-container">
            <p className="state-title text-danger">{errorMessage}</p>
            <p className="state-desc">Không thể nạp dữ liệu từ máy chủ.</p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadUsers(currentFilter)}
            >
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="state-container">
            <p className="state-title">No users found.</p>
            <p className="state-desc">
              {currentFilter
                ? 'Không có người dùng nào khớp với điều kiện lọc.'
                : 'Chưa có tài khoản người dùng nào trong hệ thống.'}
            </p>
            {currentFilter && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <UserTable
            users={users}
            onEdit={(user) => setEditingUserId(user.userId)}
            onDelete={(user) => setDeletingUser(user)}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modal Tạo User mới */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />

      {/* Modal Chỉnh sửa User */}
      <EditUserModal
        isOpen={Boolean(editingUserId)}
        userId={editingUserId}
        onClose={() => setEditingUserId(null)}
        onSuccess={handleOperationSuccess}
      />

      {/* Modal Xác nhận Xóa User */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingUser)}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onSuccess={handleOperationSuccess}
      />
    </div>
  );
}
