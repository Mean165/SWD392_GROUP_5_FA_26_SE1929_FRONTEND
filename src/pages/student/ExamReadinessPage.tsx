import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';
import { StudentNotice, StudentPageHeader } from './StudentPages';

type MicrophoneStatus = 'not-checked' | 'checking' | 'granted' | 'unavailable' | 'denied';

export default function ExamReadinessPage() {
  const { id } = useParams<{ id: string }>();
  const validId = Boolean(id && /^[\w-]+$/.test(id));
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>('not-checked');
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);
  const canRequestMicrophone = typeof window !== 'undefined'
    && window.isSecureContext
    && Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const checkMicrophone = async () => {
    if (!canRequestMicrophone) {
      setMicrophoneStatus('unavailable');
      return;
    }
    setMicrophoneStatus('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStatus('granted');
    } catch (error) {
      setMicrophoneStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  };

  const microphoneMessage: Record<MicrophoneStatus, string> = {
    'not-checked': 'Chưa kiểm tra quyền truy cập micro.',
    checking: 'Đang chờ xác nhận quyền truy cập micro trong trình duyệt…',
    granted: 'Trình duyệt đã cấp quyền truy cập micro. Luồng âm thanh đã được dừng ngay sau khi kiểm tra quyền.',
    unavailable: 'Không thể kiểm tra micro trong môi trường hiện tại. Hãy dùng trình duyệt hỗ trợ và kết nối bảo mật.',
    denied: 'Quyền truy cập micro bị từ chối. Bạn có thể thay đổi quyền trong cài đặt của trình duyệt.',
  };

  return (
    <div className="student-page">
      <StudentPageHeader
        title="Kiểm tra sẵn sàng"
        description={validId ? `Chuẩn bị thiết bị cho kỳ thi ${id}.` : 'Mã kỳ thi không hợp lệ.'}
        action={{ label: 'Chi tiết kỳ thi', to: validId ? `/student/exams/${encodeURIComponent(id || '')}` : APP_ROUTES.student.exams }}
      />
      <section className="student-readiness-card">
        <h2>Kiểm tra thiết bị</h2>
        <div className="student-readiness-row">
          <span className={`student-readiness-indicator ${isOnline ? 'ready' : 'blocked'}`} />
          <div><strong>Kết nối mạng</strong><p>{isOnline ? 'Trình duyệt báo đang trực tuyến.' : 'Trình duyệt báo đang ngoại tuyến.'}</p></div>
          <span className="student-readiness-state">{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
        </div>
        <div className="student-readiness-row">
          <span className={`student-readiness-indicator ${microphoneStatus === 'granted' ? 'ready' : microphoneStatus === 'denied' ? 'blocked' : ''}`} />
          <div><strong>Quyền truy cập micro</strong><p>{microphoneMessage[microphoneStatus]}</p></div>
          <button type="button" className="student-primary-button" disabled={microphoneStatus === 'checking'} onClick={checkMicrophone}>
            {microphoneStatus === 'checking' ? 'Đang kiểm tra…' : 'Kiểm tra micro'}
          </button>
        </div>
      </section>
      <StudentNotice title="Chưa thể xác nhận quyền vào phòng thi" kind="warning">
        Kiểm tra thiết bị này không thay thế xác nhận kỳ thi, phân công hoặc khung giờ từ máy chủ. API phiên thi chưa được tích hợp; không thể bắt đầu phỏng vấn hoặc ghi âm từ trang này.
      </StudentNotice>
      <div className="student-inline-links">
        <Link to={APP_ROUTES.student.help}>Hướng dẫn xử lý sự cố</Link>
        <Link to={APP_ROUTES.student.exams}>Quay lại lịch thi</Link>
      </div>
    </div>
  );
}
