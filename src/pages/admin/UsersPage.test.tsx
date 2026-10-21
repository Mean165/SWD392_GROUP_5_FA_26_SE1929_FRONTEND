import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '../../context/LanguageContext';
import type { AdminUser, PageResponse } from '../../types/user';
import UsersPage from './UsersPage';

const mocks = vi.hoisted(() => ({
  getAdminUsers: vi.fn(),
  lockUser: vi.fn(),
  unlockUser: vi.fn(),
  resetUserPassword: vi.fn(),
  deleteStudentAccount: vi.fn(),
  createUser: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../services/userService', () => ({
  getAdminUsers: mocks.getAdminUsers,
  lockUser: mocks.lockUser,
  unlockUser: mocks.unlockUser,
  resetUserPassword: mocks.resetUserPassword,
  deleteStudentAccount: mocks.deleteStudentAccount,
  createUser: mocks.createUser,
  getUserById: mocks.getUserById,
  updateUser: mocks.updateUser,
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'admin-id', userId: 'admin-id', role: 'ADMIN' }, logout: mocks.logout }),
}));

const lecturer: AdminUser = {
  userId: 'lecturer-id',
  fullName: 'Linh Nguyen',
  email: 'linh@example.test',
  studentOrStaffCode: 'LE1',
  isActive: true,
  createdAt: null,
  roleName: 'Lecturer',
  role: { roleId: 'role-le', roleCode: 'LE', roleName: 'Lecturer', description: null, createdAt: null },
};

const page = (content: AdminUser[] = [lecturer], pageIndex = 0, totalPages = 1): PageResponse<AdminUser> => ({
  content,
  page: pageIndex,
  size: 20,
  totalElements: content.length,
  totalPages,
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <LanguageProvider><UsersPage /></LanguageProvider>
      <CurrentLocation />
    </MemoryRouter>,
  );
}

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('Admin UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminUsers.mockResolvedValue(page());
    mocks.lockUser.mockResolvedValue({ ...lecturer, isActive: false });
    mocks.unlockUser.mockResolvedValue({ ...lecturer, isActive: true });
    mocks.resetUserPassword.mockResolvedValue(null);
    mocks.deleteStudentAccount.mockResolvedValue(undefined);
    mocks.createUser.mockResolvedValue(lecturer);
    mocks.getUserById.mockResolvedValue(lecturer);
    mocks.updateUser.mockResolvedValue(lecturer);
    mocks.logout.mockResolvedValue(undefined);
  });

  it('loads paginated data, filters on the server, and moves through server pages', async () => {
    mocks.getAdminUsers
      .mockResolvedValueOnce(page([lecturer], 0, 2))
      .mockResolvedValueOnce(page([lecturer], 0, 2))
      .mockResolvedValueOnce(page([lecturer], 1, 2));
    renderPage();
    expect(await screen.findByText('linh@example.test')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đặt lại mật khẩu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Mã tài khoản' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', 'Tìm theo tên hoặc email');
    expect(within(screen.getByRole('row', { name: /linh@example\.test/ })).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'linh' } });
    fireEvent.change(screen.getByLabelText('Vai trò'), { target: { value: 'LE' } });
    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'false' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    await waitFor(() => expect(mocks.getAdminUsers).toHaveBeenLastCalledWith({ page: 0, size: 20, keyword: 'linh', roleCode: 'LE', isActive: false }));

    fireEvent.click(screen.getByRole('button', { name: 'Sau' }));
    await waitFor(() => expect(mocks.getAdminUsers).toHaveBeenLastCalledWith({ page: 1, size: 20, keyword: 'linh', roleCode: 'LE', isActive: false }));
  });

  it('creates only Lecturer or Student accounts without asking for a password', async () => {
    renderPage();
    await screen.findByText('linh@example.test');
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Họ và tên'), { target: { value: 'New Lecturer' } });
    fireEvent.change(within(dialog).getByLabelText('Email'), { target: { value: 'new@example.test' } });
    expect(within(dialog).queryByLabelText('Mật khẩu ban đầu')).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Vai trò'), { target: { value: 'ST' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo tài khoản' }));
    await waitFor(() => expect(mocks.createUser).toHaveBeenCalledWith({ fullName: 'New Lecturer', email: 'new@example.test', roleCode: 'ST' }));
  });

  it('keeps account name and email read-only and sends only the role update', async () => {
    mocks.updateUser.mockResolvedValue(lecturer);
    renderPage();
    await screen.findByText('linh@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Sửa' }));
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByDisplayValue('Linh Nguyen');
    const fullNameInput = within(dialog).getByDisplayValue('Linh Nguyen');
    const emailInput = within(dialog).getByDisplayValue('linh@example.test');
    expect(fullNameInput).toHaveAttribute('readonly');
    expect(emailInput).toHaveAttribute('readonly');
    expect(within(dialog).queryByText('Mã tài khoản')).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Họ và tên'), { target: { value: 'Linh Updated' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith('lecturer-id', { roleCode: 'LE' }));
    expect(await screen.findByText('Linh Nguyen')).toBeInTheDocument();
    expect(mocks.getAdminUsers).toHaveBeenCalledTimes(1);
  });

  it('confirms lock and unlock through dedicated actions and blocks self-locking', async () => {
    const activeAccount = { ...lecturer, userId: 'admin-id', role: { ...lecturer.role, roleCode: 'LE' } };
    mocks.getAdminUsers.mockResolvedValue(page([activeAccount]));
    const selfView = renderPage();
    await screen.findByText('linh@example.test');
    expect(screen.getByRole('button', { name: 'Khóa' })).toBeDisabled();
    expect(mocks.lockUser).not.toHaveBeenCalled();
    selfView.unmount();

    mocks.getAdminUsers.mockResolvedValue(page());
    const activeView = renderPage();
    await screen.findByText('linh@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Khóa' }));
    await waitFor(() => expect(mocks.lockUser).toHaveBeenCalledWith('lecturer-id'));
    activeView.unmount();

    const locked = { ...lecturer, isActive: false };
    mocks.getAdminUsers.mockResolvedValue(page([locked]));
    renderPage();
    await screen.findByText('linh@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }));
    const unlockDialog = screen.getByRole('dialog');
    fireEvent.click(within(unlockDialog).getByRole('button', { name: 'Mở khóa' }));
    await waitFor(() => expect(mocks.unlockUser).toHaveBeenCalledWith('lecturer-id'));
  });

  it('requires locking a Student before deletion and confirms before calling the API', async () => {
    const student: AdminUser = {
      ...lecturer,
      userId: 'student-id',
      fullName: 'Student One',
      email: 'student@example.test',
      studentOrStaffCode: 'ST1',
      roleName: 'Student',
      role: { ...lecturer.role, roleId: 'role-st', roleCode: 'ST', roleName: 'Student' },
    };
    mocks.getAdminUsers.mockResolvedValueOnce(page([student])).mockResolvedValueOnce(page([]));
    mocks.lockUser.mockResolvedValue({ ...student, isActive: false });
    renderPage();
    await screen.findByText('student@example.test');
    expect(screen.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
    expect(mocks.deleteStudentAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }));
    const lockDialog = screen.getByRole('dialog');
    fireEvent.click(within(lockDialog).getByRole('button', { name: 'Khóa' }));
    await waitFor(() => expect(mocks.lockUser).toHaveBeenCalledWith('student-id'));
    expect(await screen.findByRole('button', { name: 'Xóa' })).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /student@example\.test/ })).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual(['Sửa', 'Mở khóa', 'Xóa']);

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
    expect(mocks.deleteStudentAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Xóa tài khoản' }));
    await waitFor(() => expect(mocks.deleteStudentAccount).toHaveBeenCalledWith('student-id'));
    expect(await screen.findByText('Tài khoản Sinh viên đã được xóa.')).toBeInTheDocument();
  });

  it.each([
    [400, 'Email đã tồn tại.'],
    [403, 'Chỉ tài khoản Admin được phép sử dụng chức năng này.'],
    [404, 'Không tìm thấy tài khoản được yêu cầu.'],
  ])('shows the expected safe message for HTTP %s', async (status, expected) => {
    const responseMessage = status === 400 ? 'Email đã tồn tại.' : 'Không tìm thấy tài khoản được yêu cầu.';
    mocks.getAdminUsers.mockRejectedValue({ response: { status, data: { message: responseMessage } } });
    renderPage();
    expect(await screen.findByText(expected)).toBeInTheDocument();
    expect(screen.getByText('Không thể tải danh sách tài khoản.')).toBeInTheDocument();
  });

  it('ends an expired session and navigates to login on HTTP 401', async () => {
    mocks.getAdminUsers.mockRejectedValue({ response: { status: 401 } });
    renderPage();
    await waitFor(() => expect(mocks.logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
  });
});
