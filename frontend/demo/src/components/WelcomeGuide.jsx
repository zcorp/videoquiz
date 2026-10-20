import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CBadge, CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

export default function WelcomeGuide({ onClose }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const openDashboard = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <CModal
      alignment="center"
      className="welcome-guide-modal"
      visible
      onClose={onClose}
      aria-labelledby="welcome-guide-title"
      aria-describedby="welcome-guide-description"
    >
      <CModalHeader closeButton={false}>
        <div>
          <CBadge className="welcome-guide-kicker">{t('PREMIÈRE VISITE')}</CBadge>
          <CModalTitle id="welcome-guide-title">{t('Bienvenue dans votre espace')}</CModalTitle>
        </div>
        <CButton className="welcome-guide-close" color="secondary" variant="ghost" aria-label={t('Fermer le guide')} onClick={onClose}>
          <DemoIcon name="x" />
        </CButton>
      </CModalHeader>
      <CModalBody>
        <p id="welcome-guide-description" className="welcome-guide-intro">{t('Trois étapes pour vous lancer. Vos quiz et résultats restent dans ce navigateur.')}</p>
        <ol className="list-group welcome-guide-steps">
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">01</CBadge><strong>{t('Choisissez un quiz')}</strong><span>{t('Par thème, type ou recherche dans la bibliothèque.')}</span></li>
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">02</CBadge><strong>{t('Répondez dans la vidéo')}</strong><span>{t('Sélectionnez une réponse, puis consultez la correction.')}</span></li>
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">03</CBadge><strong>{t('Suivez vos progrès')}</strong><span>{t('Vos résultats sont enregistrés ici. Téléchargez une sauvegarde depuis le dashboard.')}</span></li>
        </ol>
      </CModalBody>
      <CModalFooter className="welcome-guide-actions">
        <CButton color="success" onClick={openDashboard}>
          {t('Voir mon dashboard')} <DemoIcon name="arrowRight" />
        </CButton>
        <CButton color="secondary" variant="outline" onClick={onClose}>{t('Commencer')}</CButton>
      </CModalFooter>
    </CModal>
  );
}
