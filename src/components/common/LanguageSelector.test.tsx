import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

function TranslationProbe() {
  const { t } = useLanguage();
  return <p>{t('Kiểm tra thiết bị')}</p>;
}

describe('LanguageSelector', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('changes the shared interface language and persists the selection', async () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
        <TranslationProbe />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ngôn ngữ giao diện' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'English' }));

    expect(await screen.findByText('Device Check')).toBeInTheDocument();
    expect(localStorage.getItem('aiviva-language')).toBe('en');
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });

  it('closes the menu with Escape and returns focus to the trigger', () => {
    render(
      <LanguageProvider>
        <LanguageSelector />
      </LanguageProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Ngôn ngữ giao diện' });

    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
