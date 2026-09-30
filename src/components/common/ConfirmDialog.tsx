type ConfirmDialogProps = {
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
}
