import React, { useState } from 'react';
import { createUser } from '../../services/userService';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  roleCode?: string;
  general?: string;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('LE'); // Mặc định Lecturer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await createUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        roleCode,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setRoleCode('LE');

      // Thông báo thành công và đóng modal
      onSuccess('Tạo người dùng thành công!');
      onClose();
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tạo người dùng. Vui lòng thử lại.';
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
        aria-labelledby="create-user-modal-title"
      >
        <div className="modal-header">
          <h3 id="create-user-modal-title" className="modal-title">
            Create User
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

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="create-full-name" className="form-label">
              Full Name <span className="text-required">*</span>
            </label>
            <input
              id="create-full-name"
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
            <label htmlFor="create-email" className="form-label">
              Email <span className="text-required">*</span>
            </label>
            <input
              id="create-email"
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
            <label htmlFor="create-role" className="form-label">
              Role <span className="text-required">*</span>
            </label>
            <select
              id="create-role"
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
              id="btn-submit-create-user"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
