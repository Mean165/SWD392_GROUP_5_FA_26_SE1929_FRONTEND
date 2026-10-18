import React, { useState } from 'react';

export interface UserFilterValues {
  name: string;
  email: string;
  role: string;
}

interface UserFilterProps {
  onSearch: (filters: UserFilterValues) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function UserFilter({ onSearch, onReset, isLoading = false }: UserFilterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ name: name.trim(), email: email.trim(), role });
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setRole('');
    onReset();
  };

  return (
    <div className="user-filter-card">
      <form onSubmit={handleSearch} className="user-filter-form">
        <div className="filter-field">
          <label htmlFor="filter-name" className="filter-label">
            Họ và tên
          </label>
          <input
            id="filter-name"
            type="text"
            className="filter-input"
            placeholder="Tìm theo họ tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="filter-email" className="filter-label">
            Email
          </label>
          <input
            id="filter-email"
            type="text"
            className="filter-input"
            placeholder="Tìm theo email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="filter-role" className="filter-label">
            Vai trò
          </label>
          <select
            id="filter-role"
            className="filter-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Tất cả</option>
            <option value="AD">Quản trị viên</option>
            <option value="LE">Giảng viên</option>
            <option value="ST">Sinh viên</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            id="btn-filter-search"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
            id="btn-filter-reset"
          >
            Xóa lọc
          </button>
        </div>
      </form>
    </div>
  );
}
