type FormTextareaProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  onChange?: (value: string) => void;
};

export default function FormTextarea({ label, value, placeholder, rows = 4, onChange }: FormTextareaProps) {
  return (
    <label style={{ display: 'block' }}>
      {label ? <div>{label}</div> : null}
      <textarea
        className="textarea"
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
