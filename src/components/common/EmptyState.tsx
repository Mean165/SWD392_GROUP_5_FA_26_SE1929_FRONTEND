type EmptyStateProps = {
  title?: string;
  description?: string;
};

export default function EmptyState({ title = 'No data', description = 'Nothing to display yet.' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
