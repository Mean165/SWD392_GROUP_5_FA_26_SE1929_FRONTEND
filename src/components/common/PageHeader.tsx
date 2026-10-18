import { useLanguage } from '../../context/LanguageContext';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="page-header">
      <div>
        <h2>{t(title)}</h2>
        {description ? <p className="muted">{t(description)}</p> : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
