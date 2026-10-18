import React, { useState } from 'react';
import { deleteUser } from '../../services/userService';
import type { UserResponse } from '../../types/user';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  user: UserResponse | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function DeleteConfirmModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteUser(user.userId);
      onSuccess(`Đã xóa người dùng "${user.fullName || user.email}" thành công!`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể xóa người dùng. Vui lòng thử lại sau.';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-container modal-container-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="modal-header">
          <h3 id="delete-dialog-title" className="modal-title text-danger">
            Xóa tài khoản
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isDeleting}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert-message alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="modal-body-confirm">
          <p className="confirm-prompt">Bạn có chắc chắn muốn xóa tài khoản này không?</p>

          <div className="confirm-user-info-box">
            <div className="info-row">
              <span className="info-label">Họ và tên:</span>
              <span className="info-value font-medium">{user.fullName || '—'}</span>
            </div>
            {user.studentOrStaffCode && (
              <div className="info-row">
                <span className="info-label">Mã cán bộ/SV:</span>
                <span className="info-value font-medium">{user.studentOrStaffCode}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Vai trò:</span>
              <span className="info-value">
                {user.role?.roleCode === 'AD'
                  ? 'Quản trị viên'
                  : user.role?.roleCode === 'LE'
                  ? 'Giảng viên'
                  : user.role?.roleCode === 'ST'
                  ? 'Sinh viên'
                  : user.role?.roleName || 'Tài khoản'}
              </span>
            </div>
          </div>

          <p className="confirm-warning-note">
            Hành động này không thể hoàn tác sau khi xác nhận.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            id="btn-confirm-delete-user"
          >
            {isDeleting ? 'Đang xóa…' : 'Xóa tài khoản'}
          </button>
        </div>
      </div>
    </div>
  );
}
