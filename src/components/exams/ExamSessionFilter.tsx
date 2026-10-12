import React, { useState } from 'react';
import type { ExamSessionFilterValues } from '../../types/exam';

interface ExamSessionFilterProps {
  onSearch: (values: ExamSessionFilterValues) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export default function ExamSessionFilter({
  onSearch,
  onReset,
  isLoading = false,
}: ExamSessionFilterProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword: keyword.trim() || undefined,
      status: status || undefined,
    });
  };

  const handleClear = () => {
    setKeyword('');
    setStatus('');
    onReset();
  };

  return (
    <form className="filter-card" onSubmit={handleSubmit}>
      <div className="filter-row">
        <div className="filter-input-wrap">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo tên phiên thi..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SCHEDULED">Đã lên lịch (Scheduled)</option>
            <option value="IN_PROGRESS">Đang diễn ra (In Progress)</option>
            <option value="COMPLETED">Đã kết thúc (Completed)</option>
            <option value="CANCELLED">Đã hủy (Cancelled)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
            onClick={handleClear}
            disabled={isLoading}
            id="btn-filter-reset"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </form>
  );
}
