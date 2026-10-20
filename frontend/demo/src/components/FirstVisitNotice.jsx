import React, { useEffect, useState } from 'react';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

const shownNoticeKeys = new Set();
const NOTICE_DURATION = 5000;

export default function FirstVisitNotice({ storageKey, message }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shownNoticeKeys.has(storageKey)) return;
    shownNoticeKeys.add(storageKey);

    let shouldShow = true;
    try {
      if (sessionStorage.getItem(storageKey) === 'shown') {
        shouldShow = false;
      } else {
        sessionStorage.setItem(storageKey, 'shown');
      }
    } catch (error) {
      console.warn('La préférence d’affichage du message temporaire n’a pas pu être mémorisée.', error);
    }

    if (shouldShow) setVisible(true);
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return undefined;
    const timeout = window.setTimeout(() => setVisible(false), NOTICE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="local-data-toast" role="status" aria-live="polite">
      <span className="local-data-toast-icon"><DemoIcon name="check" /></span>
      <span className="local-data-toast-message">{t(message)}</span>
      <button type="button" className="icon-action" onClick={() => setVisible(false)} aria-label={t('Fermer le message')} title={t('Fermer')}>
        <DemoIcon name="x" />
      </button>
    </div>
  );
}
