type ToastProps = {
  message?: string;
  type?: 'success' | 'error' | 'info';
};

export default function Toast({ message = 'Operation completed.', type = 'info' }: ToastProps) {
  return <div className="card">[{type.toUpperCase()}] {message}</div>;
}
