import React, { useState, useEffect } from 'react';
import { getUserById, updateUser } from '../../services/userService';
import type { UserResponse } from '../../types/user';

interface EditUserModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  roleCode?: string;
  general?: string;
}

export default function EditUserModal({ isOpen, userId, onClose, onSuccess }: EditUserModalProps) {
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('LE');
  const [studentOrStaffCode, setStudentOrStaffCode] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errors, setErrors] = useState<FormErrors>({});

  // Tải thông tin chi tiết User từ API GET /api/users/{id} khi mở modal
  useEffect(() => {
    if (!isOpen || !userId) {
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);
    setErrors({});

    getUserById(userId)
      .then((data: UserResponse) => {
        if (!isMounted) return;
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setStudentOrStaffCode(data.studentOrStaffCode || '');

        const rawRole = (data.role?.roleCode || data.roleName || 'ST').toUpperCase();
        if (rawRole === 'AD' || rawRole === 'ADMIN') {
          setRoleCode('AD');
        } else if (rawRole === 'LE' || rawRole === 'LECTURER') {
          setRoleCode('LE');
        } else {
          setRoleCode('ST');
        }

        setIsActive(data.isActive !== undefined ? data.isActive : true);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải thông tin chi tiết người dùng.';
        setErrors({ general: msg });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập Họ và tên';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập Email';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Email không đúng định dạng';
      }
    }

    if (!roleCode) {
      newErrors.roleCode = 'Vui lòng chọn vai trò (Role)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateUser(userId, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        roleCode,
        isActive,
      });

      onSuccess('Cập nhật người dùng thành công!');
      onClose();
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể cập nhật người dùng. Vui lòng thử lại.';
      setErrors({ general: serverMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-modal-title"
      >
        <div className="modal-header">
          <h3 id="edit-user-modal-title" className="modal-title">
            Edit User
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {errors.general && (
          <div className="alert-message alert-error" role="alert">
            {errors.general}
          </div>
        )}

        {isLoadingDetails ? (
          <div className="modal-loading-state">
            <span className="loading-spinner" />
            <p className="loading-text">Đang tải thông tin người dùng...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form" noValidate>
            {/* User ID & Staff/Student Code */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label text-muted">User ID</label>
                <input
                  type="text"
                  className="form-input input-readonly"
                  value={userId || ''}
                  readOnly
                  disabled
                />
              </div>
              {studentOrStaffCode && (
                <div className="form-group" style={{ width: '130px' }}>
                  <label className="form-label text-muted">Code</label>
                  <input
                    type="text"
                    className="form-input input-readonly font-medium"
                    value={studentOrStaffCode}
                    readOnly
                    disabled
                  />
                </div>
              )}
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="edit-full-name" className="form-label">
                Full Name <span className="text-required">*</span>
              </label>
              <input
                id="edit-full-name"
                type="text"
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.fullName && <p className="field-error-text">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="edit-email" className="form-label">
                Email <span className="text-required">*</span>
              </label>
              <input
                id="edit-email"
                type="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="example@aives.edu.vn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={isSubmitting}
              />
              {errors.email && <p className="field-error-text">{errors.email}</p>}
            </div>

            {/* Role */}
            <div className="form-group">
              <label htmlFor="edit-role" className="form-label">
                Role <span className="text-required">*</span>
              </label>
              <select
                id="edit-role"
                className={`form-select ${errors.roleCode ? 'input-error' : ''}`}
                value={roleCode}
                onChange={(e) => {
                  setRoleCode(e.target.value);
                  if (errors.roleCode) setErrors((prev) => ({ ...prev, roleCode: undefined }));
                }}
                disabled={isSubmitting}
              >
                <option value="AD">Admin (AD)</option>
                <option value="LE">Lecturer (LE)</option>
                <option value="ST">Student (ST)</option>
              </select>
              {errors.roleCode && <p className="field-error-text">{errors.roleCode}</p>}
            </div>

            {/* Status (isActive) */}
            <div className="form-group">
              <label htmlFor="edit-status" className="form-label">
                Status
              </label>
              <select
                id="edit-status"
                className="form-select"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                disabled={isSubmitting}
              >
                <option value="active">Active (Hoạt động)</option>
                <option value="inactive">Inactive (Khóa)</option>
              </select>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                id="btn-submit-edit-user"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
