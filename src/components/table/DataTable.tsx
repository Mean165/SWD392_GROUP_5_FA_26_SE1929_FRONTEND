type DataTableProps<T> = {
  columns: Array<{ key: string; label: string; render?: (row: T) => React.ReactNode }>;
  rows: T[];
};

export default function DataTable<T>({ columns, rows }: DataTableProps<T>) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => {
              const value = (row as Record<string, unknown>)[column.key];
              return <td key={`${String(column.key)}-${index}`}>{column.render ? column.render(row) : (value as React.ReactNode)}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
