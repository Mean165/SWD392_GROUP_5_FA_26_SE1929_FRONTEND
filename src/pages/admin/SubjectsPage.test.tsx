import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import type { AdminSubject } from '../../types/system';
import SubjectsPage from './SubjectsPage';

const mocks = vi.hoisted(() => ({
  getAdminSubjects: vi.fn(),
  getAdminSubjectById: vi.fn(),
  createAdminSubject: vi.fn(),
  addAdminSubjectTopics: vi.fn(),
  updateAdminSubject: vi.fn(),
  handleUnauthorized: vi.fn(),
}));

vi.mock('../../services/system/systemService', () => ({
  getAdminSubjects: mocks.getAdminSubjects,
  getAdminSubjectById: mocks.getAdminSubjectById,
  createAdminSubject: mocks.createAdminSubject,
  addAdminSubjectTopics: mocks.addAdminSubjectTopics,
  updateAdminSubject: mocks.updateAdminSubject,
}));
vi.mock('./useAdminSession', () => ({ default: () => mocks.handleUnauthorized }));

const subject: AdminSubject = {
  subjectId: 'subject-uuid',
  subjectCode: 'SWD392',
  subjectName: 'Software Development Project',
  description: 'Project-based software course',
  lecturerIds: ['lecturer-uuid'],
  lecturers: [{
    userId: 'lecturer-uuid',
    fullName: 'Lecturer One',
    email: 'lecturer@example.test',
    studentOrStaffCode: 'LE1',
    isActive: true,
  }],
  topicCount: 4,
  topics: [{ topicId: 'topic-1', topicCode: 'SWD392-INTRO', topicName: 'Introduction', description: 'Course introduction' }],
};

function renderPage() {
  return render(<MemoryRouter><LanguageProvider><SubjectsPage /></LanguageProvider></MemoryRouter>);
}

describe('SubjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('aiviva-language', 'vi');
    mocks.getAdminSubjects.mockResolvedValue([subject]);
    mocks.getAdminSubjectById.mockResolvedValue(subject);
    mocks.addAdminSubjectTopics.mockResolvedValue({
      ...subject,
      topicCount: 6,
      topics: [
        ...subject.topics,
        { topicId: 'topic-2', topicCode: 'SWD392-DESIGN', topicName: 'Software Design', description: 'Design principles' },
        { topicId: 'topic-3', topicCode: 'SWD392-TEST', topicName: 'Software Testing', description: 'Quality assurance' },
      ],
    });
    mocks.createAdminSubject.mockResolvedValue({
      ...subject,
      subjectId: 'created-uuid',
      subjectCode: 'NEW101',
      subjectName: 'New Subject',
      description: null,
      lecturers: [],
      lecturerIds: [],
      topicCount: 0,
      topics: [],
    });
    mocks.updateAdminSubject.mockResolvedValue({ ...subject, subjectCode: 'SWD393', subjectName: 'Updated Project' });
  });

  it('loads real subject metadata and opens details by the returned UUID', async () => {
    renderPage();
    expect(await screen.findByText('SWD392')).toBeInTheDocument();
    expect(screen.getByText('Project-based software course')).toBeInTheDocument();
    expect(screen.getByText('Lecturer One')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Software Development Project' }));
    expect(await screen.findByRole('heading', { name: 'Software Development Project' })).toBeInTheDocument();
    expect(mocks.getAdminSubjectById).toHaveBeenCalledWith('subject-uuid', expect.any(AbortSignal));
    expect(screen.getByText(/lecturer@example\.test/)).toBeInTheDocument();
    expect(screen.getByText('SWD392-INTRO')).toBeInTheDocument();
    expect(screen.getByText('Course introduction')).toBeInTheDocument();
  });

  it('debounces keyword changes and sends the search to the backend', async () => {
    mocks.getAdminSubjects.mockImplementation(async (search: string) => search ? [] : [subject]);
    renderPage();
    await screen.findByText('SWD392');

    const search = screen.getByRole('searchbox');
    fireEvent.change(search, { target: { value: 'S' } });
    fireEvent.change(search, { target: { value: 'SWD' } });
    await waitFor(() => expect(mocks.getAdminSubjects).toHaveBeenLastCalledWith('SWD', expect.any(AbortSignal)), { timeout: 1200 });
    expect(mocks.getAdminSubjects).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Không tìm thấy môn học phù hợp.')).toBeInTheDocument();
  });

  it('creates a subject with all fields and uses the returned record in the list', async () => {
    mocks.getAdminSubjects.mockResolvedValueOnce([]);
    renderPage();
    await screen.findByText('Chưa có môn học nào.');
    fireEvent.click(screen.getAllByRole('button', { name: 'Thêm môn học' })[0]);
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo môn học' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mã môn học là bắt buộc');
    expect(mocks.createAdminSubject).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Mã môn'), { target: { value: 'NEW101' } });
    fireEvent.change(within(dialog).getByLabelText('Tên môn'), { target: { value: 'New Subject' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo môn học' }));
    await waitFor(() => expect(mocks.createAdminSubject).toHaveBeenCalledWith({ subjectCode: 'NEW101', subjectName: 'New Subject', description: null, topics: [] }));
    expect(await screen.findByText('NEW101')).toBeInTheDocument();
    expect(screen.getByText('New Subject')).toBeInTheDocument();
  });

  it('creates a subject and multiple topics in one request', async () => {
    renderPage();
    await screen.findByText('SWD392');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm môn học' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Mã môn'), { target: { value: 'NEW101' } });
    fireEvent.change(within(dialog).getByLabelText('Tên môn'), { target: { value: 'New Subject' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm chủ đề' }));
    fireEvent.change(within(dialog).getAllByLabelText('Mã chủ đề')[0], { target: { value: 'NEW101-ONE' } });
    fireEvent.change(within(dialog).getAllByLabelText('Tên chủ đề')[0], { target: { value: 'First topic' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm chủ đề' }));
    fireEvent.change(within(dialog).getAllByLabelText('Mã chủ đề')[1], { target: { value: 'NEW101-TWO' } });
    fireEvent.change(within(dialog).getAllByLabelText('Tên chủ đề')[1], { target: { value: 'Second topic' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo môn học' }));

    await waitFor(() => expect(mocks.createAdminSubject).toHaveBeenCalledWith({
      subjectCode: 'NEW101',
      subjectName: 'New Subject',
      description: null,
      topics: [
        { topicCode: 'NEW101-ONE', topicName: 'First topic', description: '' },
        { topicCode: 'NEW101-TWO', topicName: 'Second topic', description: '' },
      ],
    }));
    expect(mocks.createAdminSubject).toHaveBeenCalledTimes(1);
  });

  it('validates each topic before creating the subject', async () => {
    renderPage();
    await screen.findByText('SWD392');
    fireEvent.click(screen.getByRole('button', { name: 'Thêm môn học' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Mã môn'), { target: { value: 'NEW102' } });
    fireEvent.change(within(dialog).getByLabelText('Tên môn'), { target: { value: 'New Subject' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm chủ đề' }));
    fireEvent.change(within(dialog).getByLabelText('Mã chủ đề'), { target: { value: 'NEW102-ONE' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo môn học' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mã và tên chủ đề là bắt buộc');
    expect(mocks.createAdminSubject).not.toHaveBeenCalled();
  });

  it('adds multiple topics to the existing subject and refreshes returned details', async () => {
    renderPage();
    await screen.findByText('SWD392');
    fireEvent.click(screen.getByRole('button', { name: 'Software Development Project' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(await within(dialog).findByRole('button', { name: 'Thêm chủ đề' }));
    fireEvent.change(within(dialog).getAllByLabelText('Mã chủ đề')[0], { target: { value: 'SWD392-DESIGN' } });
    fireEvent.change(within(dialog).getAllByLabelText('Tên chủ đề')[0], { target: { value: 'Software Design' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm dòng chủ đề' }));
    fireEvent.change(within(dialog).getAllByLabelText('Mã chủ đề')[1], { target: { value: 'SWD392-TEST' } });
    fireEvent.change(within(dialog).getAllByLabelText('Tên chủ đề')[1], { target: { value: 'Software Testing' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu chủ đề' }));

    await waitFor(() => expect(mocks.addAdminSubjectTopics).toHaveBeenCalledWith('subject-uuid', [
      { topicCode: 'SWD392-DESIGN', topicName: 'Software Design', description: '' },
      { topicCode: 'SWD392-TEST', topicName: 'Software Testing', description: '' },
    ]));
    expect(await within(dialog).findByText('Software Testing')).toBeInTheDocument();
    expect(within(dialog).getByText('6')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Lưu chủ đề' })).not.toBeInTheDocument();
  });

  it('loads edit details, submits all fields, and updates the row from the server response', async () => {
    renderPage();
    await screen.findByText('SWD392');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa' }));
    const dialog = screen.getByRole('dialog');
    await within(dialog).findByDisplayValue('Software Development Project');
    fireEvent.change(within(dialog).getByLabelText('Mã môn'), { target: { value: 'SWD393' } });
    fireEvent.change(within(dialog).getByLabelText('Tên môn'), { target: { value: 'Updated Project' } });
    fireEvent.change(within(dialog).getByLabelText('Mô tả'), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));

    await waitFor(() => expect(mocks.updateAdminSubject).toHaveBeenCalledWith('subject-uuid', {
      subjectCode: 'SWD393',
      subjectName: 'Updated Project',
      description: null,
    }));
    expect(await screen.findByText('SWD393')).toBeInTheDocument();
    expect(screen.getByText('Updated Project')).toBeInTheDocument();
    expect(screen.queryByText('SWD392')).not.toBeInTheDocument();
    expect(mocks.getAdminSubjects).toHaveBeenCalledTimes(1);
  });

  it('distinguishes list request errors from an empty result and retries', async () => {
    mocks.getAdminSubjects.mockRejectedValueOnce({ response: { status: 403, data: { message: 'Forbidden' } } });
    renderPage();
    expect(await screen.findByText('Chỉ tài khoản Admin được phép sử dụng chức năng này.')).toBeInTheDocument();
    expect(screen.queryByText('Chưa có môn học nào.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('SWD392')).toBeInTheDocument();
    expect(mocks.getAdminSubjects).toHaveBeenCalledTimes(2);
  });
});
