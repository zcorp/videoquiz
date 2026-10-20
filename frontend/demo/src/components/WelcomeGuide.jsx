import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CBadge, CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';
import DemoIcon from './DemoIcon.jsx';

export default function WelcomeGuide({ onClose }) {
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
      <CModalHeader>
        <div>
          <CBadge className="welcome-guide-kicker">PREMIÈRE VISITE</CBadge>
          <CModalTitle id="welcome-guide-title">Bienvenue dans votre espace</CModalTitle>
        </div>
        <CButton className="welcome-guide-close" color="secondary" variant="ghost" aria-label="Fermer le guide" onClick={onClose}>
          <DemoIcon name="x" />
        </CButton>
      </CModalHeader>
      <CModalBody>
        <p id="welcome-guide-description" className="welcome-guide-intro">Trois étapes pour vous lancer. Vos quiz et résultats restent dans ce navigateur.</p>
        <ol className="list-group welcome-guide-steps">
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">01</CBadge><strong>Choisissez un quiz</strong><span>Par thème, type ou recherche dans la bibliothèque.</span></li>
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">02</CBadge><strong>Répondez dans la vidéo</strong><span>Sélectionnez une réponse, puis consultez la correction.</span></li>
          <li className="list-group-item"><CBadge className="welcome-guide-step-number">03</CBadge><strong>Suivez vos progrès</strong><span>Vos résultats sont enregistrés ici. Téléchargez une sauvegarde depuis le dashboard.</span></li>
        </ol>
      </CModalBody>
      <CModalFooter className="welcome-guide-actions">
        <CButton color="success" onClick={openDashboard}>
          Voir mon dashboard <DemoIcon name="arrowRight" />
        </CButton>
        <CButton color="secondary" variant="outline" onClick={onClose}>Commencer</CButton>
      </CModalFooter>
    </CModal>
  );
}
