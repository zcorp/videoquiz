import React from 'react';
import { Link } from 'react-router-dom';

export default function WelcomeGuide({ onClose }) {
  return (
    <div className="welcome-guide-backdrop" role="presentation">
      <section className="welcome-guide" role="dialog" aria-modal="true" aria-labelledby="welcome-guide-title">
        <button type="button" className="welcome-guide-close icon-action" onClick={onClose} aria-label="Fermer le guide" title="Fermer">×</button>
        <span className="eyebrow">PREMIÈRE VISITE</span>
        <h2 id="welcome-guide-title">Bienvenue dans votre espace d’entraînement.</h2>
        <p className="welcome-guide-intro">Trois repères pour commencer rapidement, tout reste local dans ce navigateur.</p>
        <ol className="welcome-guide-steps">
          <li><strong>Choisissez un quiz</strong><span>Filtrez par thème, type ou recherche depuis la bibliothèque.</span></li>
          <li><strong>Répondez au fil de la vidéo</strong><span>Sélectionnez votre réponse, puis la correction déclarée, sans interrompre la lecture.</span></li>
          <li><strong>Suivez vos progrès</strong><span>Le dashboard et la courbe d’évolution conservent vos résultats sur cet appareil.</span></li>
        </ol>
        <div className="welcome-guide-actions"><Link className="button button-dark" to="/dashboard" onClick={onClose}>Voir mon dashboard <span aria-hidden="true">→</span></Link><button type="button" className="button button-quiet" onClick={onClose}>Commencer</button></div>
      </section>
    </div>
  );
}
