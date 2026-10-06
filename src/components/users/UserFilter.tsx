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
        {/* Name input */}
        <div className="filter-field">
          <label htmlFor="filter-name" className="filter-label">
            Name
          </label>
          <input
            id="filter-name"
            type="text"
            className="filter-input"
            placeholder="Search by name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Email input */}
        <div className="filter-field">
          <label htmlFor="filter-email" className="filter-label">
            Email
          </label>
          <input
            id="filter-email"
            type="text"
            className="filter-input"
            placeholder="Search by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Role select */}
        <div className="filter-field">
          <label htmlFor="filter-role" className="filter-label">
            Role
          </label>
          <select
            id="filter-role"
            className="filter-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={isLoading}
          >
            <option value="">All</option>
            <option value="AD">AD</option>
            <option value="LE">LE</option>
            <option value="ST">ST</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="filter-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            id="btn-filter-search"
          >
            Search
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isLoading}
            id="btn-filter-reset"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
