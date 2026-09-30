type FormSelectProps = {
  label?: string;
  value?: string;
  options?: Array<{ label: string; value: string }>;
  onChange?: (value: string) => void;
};

export default function FormSelect({ label, value, options = [], onChange }: FormSelectProps) {
  return (
    <label style={{ display: 'block' }}>
      {label ? <div>{label}</div> : null}
      <select className="select" value={value ?? ''} onChange={(event) => onChange?.(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
