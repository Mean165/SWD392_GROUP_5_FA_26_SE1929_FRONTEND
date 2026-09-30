type FormInputProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  type?: string;
  onChange?: (value: string) => void;
};

export default function FormInput({ label, value, placeholder, type = 'text', onChange }: FormInputProps) {
  return (
    <label style={{ display: 'block' }}>
      {label ? <div>{label}</div> : null}
      <input
        className="input"
        type={type}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
