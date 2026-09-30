type BaseModalProps = {
  title?: string;
  isOpen?: boolean;
  children?: React.ReactNode;
  onClose?: () => void;
};

export default function BaseModal({ title, isOpen = false, children, onClose }: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center' }}>
      <div className="card" style={{ minWidth: 320, maxWidth: 520, width: '90%' }}>
        <div className="page-header">
          <h3>{title ?? 'Modal'}</h3>
          <button type="button" className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
