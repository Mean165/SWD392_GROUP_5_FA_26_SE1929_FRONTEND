import React from 'react';
import type { BloomLevel, QuestionStatus, Topic } from '../../types/question';

export interface QuestionFilterState {
  topicId: string;
  bloomLevel: string;
  status: string;
  keyword: string;
}

interface QuestionFilterProps {
  filters: QuestionFilterState;
  topics: Topic[];
  onChange: (filters: QuestionFilterState) => void;
  onReset: () => void;
  isLoading?: boolean;
  totalCount: number;
}

const BLOOM_LEVELS: { value: BloomLevel; label: string }[] = [
  { value: 'REMEMBER', label: 'Nhận biết (Remember)' },
  { value: 'UNDERSTAND', label: 'Thông hiểu (Understand)' },
  { value: 'APPLY', label: 'Vận dụng (Apply)' },
  { value: 'ANALYZE', label: 'Phân tích (Analyze)' },
];

const STATUSES: { value: QuestionStatus; label: string }[] = [
  { value: 'APPROVED', label: 'Đã duyệt (Approved)' },
  { value: 'PENDING', label: 'Chờ duyệt (Pending)' },
  { value: 'REJECTED', label: 'Từ chối (Rejected)' },
];

export default function QuestionFilter({
  filters,
  topics,
  onChange,
  onReset,
  isLoading = false,
  totalCount,
}: QuestionFilterProps) {
  const handleChange = (key: keyof QuestionFilterState, val: string) => {
    onChange({
      ...filters,
      [key]: val,
    });
  };

  const hasActiveFilters =
    filters.topicId !== 'ALL' ||
    filters.bloomLevel !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.keyword.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Tìm kiếm & Bộ lọc nâng cao</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            {totalCount} câu hỏi
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 transition-colors"
              onClick={onReset}
              disabled={isLoading}
              title="Đặt lại tất cả bộ lọc"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* Search by keyword */}
        <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
          <label htmlFor="qb-filter-keyword" className="block text-xs font-medium text-slate-600">
            Tìm kiếm nội dung câu hỏi
          </label>
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="qb-filter-keyword"
              type="text"
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Nhập nội dung, tác giả, phạm trù..."
              value={filters.keyword}
              onChange={(e) => handleChange('keyword', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filter by Topic / Chapter */}
        <div className="sm:col-span-1 lg:col-span-3 space-y-1.5">
          <label htmlFor="qb-filter-topic" className="block text-xs font-medium text-slate-600">
            Chương / Chủ đề
          </label>
          <select
            id="qb-filter-topic"
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={filters.topicId}
            onChange={(e) => handleChange('topicId', e.target.value)}
            disabled={isLoading}
          >
            <option value="ALL">Tất cả các chương</option>
            {topics.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Bloom level */}
        <div className="sm:col-span-1 lg:col-span-3 space-y-1.5">
          <label htmlFor="qb-filter-bloom" className="block text-xs font-medium text-slate-600">
            Mức độ nhận thức (Bloom)
          </label>
          <select
            id="qb-filter-bloom"
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={filters.bloomLevel}
            onChange={(e) => handleChange('bloomLevel', e.target.value)}
            disabled={isLoading}
          >
            <option value="ALL">Tất cả mức độ</option>
            {BLOOM_LEVELS.map((bl) => (
              <option key={bl.value} value={bl.value}>
                {bl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
          <label htmlFor="qb-filter-status" className="block text-xs font-medium text-slate-600">
            Trạng thái
          </label>
          <select
            id="qb-filter-status"
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            disabled={isLoading}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
