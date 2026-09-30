type ErrorMessageProps = {
  message?: string;
};

export default function ErrorMessage({ message = 'Something went wrong.' }: ErrorMessageProps) {
  return <div className="error-message">{message}</div>;
}
