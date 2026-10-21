import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import type { AdminLecturer, AdminSubjectAssignment } from '../../types/system';
import SubjectAssignmentsPage from './SubjectAssignmentsPage';

const mocks = vi.hoisted(() => ({
  getAdminLecturers: vi.fn(),
  getSubjectAssignments: vi.fn(),
  assignLecturersToSubject: vi.fn(),
  unassignLecturerFromSubject: vi.fn(),
  handleUnauthorized: vi.fn(),
}));

vi.mock('../../services/system/systemService', () => ({
  getAdminLecturers: mocks.getAdminLecturers,
  getSubjectAssignments: mocks.getSubjectAssignments,
  assignLecturersToSubject: mocks.assignLecturersToSubject,
  unassignLecturerFromSubject: mocks.unassignLecturerFromSubject,
}));
vi.mock('./useAdminSession', () => ({ default: () => mocks.handleUnauthorized }));

const le1: AdminLecturer = { userId: 'le-1', fullName: 'Lecturer One', email: 'one@example.test', studentOrStaffCode: 'LE1', isActive: true };
const le2: AdminLecturer = { userId: 'le-2', fullName: 'Lecturer Two', email: 'two@example.test', studentOrStaffCode: 'LE2', isActive: false };
const assignment = (lecturers: AdminLecturer[]): AdminSubjectAssignment => ({
  subjectId: 'subject-uuid',
  subjectCode: 'SUB101',
  subjectName: 'Software Design',
  lecturerIds: lecturers.map((lecturer) => lecturer.userId),
  lecturers,
});

function renderPage() {
  return render(<MemoryRouter><LanguageProvider><SubjectAssignmentsPage /></LanguageProvider></MemoryRouter>);
}

describe('SubjectAssignmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminLecturers.mockResolvedValue([le1, le2]);
    mocks.getSubjectAssignments.mockResolvedValue([assignment([le1])]);
    mocks.assignLecturersToSubject.mockResolvedValue(assignment([le1, le2]));
    mocks.unassignLecturerFromSubject.mockResolvedValue(assignment([le2]));
  });

  it('loads actual subjects and lecturers, batches selected IDs, then applies delete response', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Software Design' })).toBeInTheDocument();
    expect(mocks.getAdminLecturers).toHaveBeenCalledTimes(1);
    expect(mocks.getSubjectAssignments).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Lecturer One')).toBeInTheDocument();
    expect(screen.getByText('Đã khóa')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Lecturer Two/));
    fireEvent.click(screen.getByRole('button', { name: 'Gán giảng viên' }));
    await waitFor(() => expect(mocks.assignLecturersToSubject).toHaveBeenCalledWith('subject-uuid', ['le-2']));
    expect(await screen.findByText('Lecturer Two')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Hủy phân công' })[0]);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy phân công' }));
    await waitFor(() => expect(mocks.unassignLecturerFromSubject).toHaveBeenCalledWith('subject-uuid', 'le-1'));
    const subjectPanel = screen.getByRole('heading', { name: 'Software Design' }).closest('section');
    const assignedList = subjectPanel?.querySelector('.admin-assigned-list');
    await waitFor(() => expect(within(assignedList as HTMLElement).queryByText('Lecturer One')).not.toBeInTheDocument());
    expect(screen.getByLabelText(/Lecturer One/)).toBeInTheDocument();
    expect(screen.getByText('Lecturer Two')).toBeInTheDocument();
  });

  it('keeps request errors distinct from empty subjects and offers retry', async () => {
    mocks.getSubjectAssignments.mockRejectedValueOnce({ response: { status: 403, data: { message: 'Forbidden' } } });
    renderPage();
    expect(await screen.findByText('Không thể tải dữ liệu phân công.')).toBeInTheDocument();
    expect(screen.queryByText('Chưa có môn học.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await screen.findByRole('heading', { name: 'Software Design' });
    expect(mocks.getSubjectAssignments).toHaveBeenCalledTimes(2);
  });
});
