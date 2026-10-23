import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

const steps = [
  {
    number: '01',
    label: 'Le support',
    title: 'Choisis une vidéo pour commencer.',
    description: 'Parcours les vidéos proposées pour trouver l’inspiration, ou colle le lien d’une vidéo YouTube de ton choix.',
    visual: 'video',
  },
  {
    number: '02',
    label: 'Ton quiz',
    title: 'Donne une forme à ton quiz.',
    description: 'Ajoute un titre, puis choisis comment tu veux réviser : quiz préparé, révision progressive ou QCM express.',
    visual: 'setup',
  },
  {
    number: '03',
    label: 'Ta grille',
    title: 'Prépare les questions à ton rythme.',
    description: 'Rédige tes questions et leurs choix de réponse. Avec la révision progressive, tu peux aussi compléter la grille pendant le visionnage.',
    visual: 'questions',
  },
  {
    number: '04',
    label: 'Ta progression',
    title: 'Regarde, réponds, puis progresse.',
    description: 'Lance la vidéo et réponds aux questions. Retrouve tes résultats et ta progression dans le suivi, enregistrés dans ce navigateur.',
    visual: 'progress',
  },
];

function StepVisual({ type, t }) {
  return (
    <div className={`tutorial-visual tutorial-visual-${type}`} aria-hidden="true">
      <div className="tutorial-window-bar"><span /><span /><span /><div>videoquiz.fr</div></div>
      {type === 'video' && (
        <div className="tutorial-video-mock">
          <div className="tutorial-video-preview"><DemoIcon name="mediaPlay" /><span>{t('VIDÉO D’EXEMPLE')}</span></div>
          <div className="tutorial-video-details"><span className="tutorial-mock-label">{t('CODE DE LA ROUTE')}</span><strong>{t('Une vidéo pour apprendre, un quiz pour s’entraîner')}</strong><span>{t('Choisis un exemple ou colle un lien YouTube.')}</span></div>
          <div className="tutorial-video-timeline"><i /></div>
        </div>
      )}
      {type === 'setup' && (
        <div className="tutorial-setup-mock">
          <span className="tutorial-mock-label">{t('NOUVEAU QUIZ')}</span>
          <div className="tutorial-mock-field"><small>{t('TITRE DU QUIZ')}</small><strong>{t('Les bases de la conduite')}</strong></div>
          <div className="tutorial-mock-field"><small>{t('VIDÉO YOUTUBE')}</small><span><DemoIcon name="mediaPlay" /> youtube.com/watch…</span></div>
          <small className="tutorial-mode-label">{t('CHOISIS TON MODE')}</small>
          <div className="tutorial-mode-options"><span>{t('Quiz préparé')}</span><span className="is-selected">{t('Progressif')}</span><span>{t('QCM express')}</span></div>
        </div>
      )}
      {type === 'questions' && (
        <div className="tutorial-questions-mock">
          <div className="tutorial-question-top"><span className="tutorial-mock-label">QUESTION 01</span><span>00:42</span></div>
          <strong>{t('Quel détail as-tu repéré dans la vidéo ?')}</strong>
          <div className="tutorial-answer-option"><i>A</i><span>{t('Le panneau sur le bord de la route')}</span></div>
          <div className="tutorial-answer-option is-correct"><i>B</i><span>{t('Le passage piéton')}</span><DemoIcon name="check" /></div>
          <div className="tutorial-answer-option"><i>C</i><span>{t('Le feu à l’intersection')}</span></div>
          <div className="tutorial-question-foot"><span>{t('Ta question, tes choix')}</span><span>01 / 10</span></div>
        </div>
      )}
      {type === 'progress' && (
        <div className="tutorial-progress-mock">
          <div className="tutorial-training-mock">
            <span className="tutorial-mock-label">{t('ENTRAÎNEMENT · QUESTION 07')}</span>
            <div className="tutorial-progress-bar"><i /></div>
            <strong>{t('À toi de choisir la bonne réponse.')}</strong>
            <div className="tutorial-training-option is-selected"><i>B</i><span>{t('Je prends le temps d’observer')}</span><DemoIcon name="check" /></div>
            <div className="tutorial-training-option"><i>C</i><span>{t('Je réponds au hasard')}</span></div>
          </div>
          <div className="tutorial-score-mock">
            <span className="tutorial-mock-label">{t('TON BILAN')}</span>
            <strong>8<span> / 10</span></strong>
            <div className="tutorial-score-line"><span>{t('Réussite')}</span><b>80 %</b></div>
            <div className="tutorial-score-line"><span>{t('À revoir')}</span><b>{t('2 questions')}</b></div>
            <span className="tutorial-score-saved"><DemoIcon name="check" /> {t('Enregistré ici')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorialPage() {
  const { hash } = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const stepId = hash.slice(1);
    if (!/^tutorial-step-\d{2}$/.test(stepId)) return;
    document.getElementById(stepId)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [hash]);

  return (
    <main className="demo-page tutorial-page">
      <header className="tutorial-hero">
        <div>
          <span className="eyebrow">{t('LE PRINCIPE EN 4 ÉTAPES')}</span>
          <h1>{t('Une vidéo. Ton quiz. Ta progression.')}</h1>
          <p>{t('VideoQuiz transforme le visionnage en entraînement actif. Voici le parcours, de la vidéo jusqu’au suivi de tes résultats.')}</p>
        </div>
        <Link className="tutorial-hero-link" to="/create">{t('Créer mon quiz')} <DemoIcon name="arrowRight" /></Link>
      </header>

      <nav className="tutorial-flow" aria-label={t('Les étapes du parcours')}>
        {steps.map((step, index) => (
          <Link className="tutorial-flow-step" to={`/tutoriel#tutorial-step-${step.number}`} key={step.number}>
            <span>{step.number}</span><strong>{t(step.label)}</strong>
            {index < steps.length - 1 && <DemoIcon className="tutorial-flow-arrow" name="arrowRight" />}
          </Link>
        ))}
      </nav>

      <section className="tutorial-steps" aria-label={t('Comment fonctionne VideoQuiz')}>
        {steps.map((step, index) => (
          <article className={`tutorial-step${index % 2 ? ' tutorial-step-reverse' : ''}`} id={`tutorial-step-${step.number}`} key={step.number}>
            <div className="tutorial-step-copy">
              <span className="tutorial-step-number">{step.number}<i> / 04</i></span>
              <span className="eyebrow">{t(step.label)}</span>
              <h2>{t(step.title)}</h2>
              <p>{t(step.description)}</p>
            </div>
            <StepVisual type={step.visual} t={t} />
          </article>
        ))}
      </section>

      <section className="tutorial-transfer" aria-labelledby="tutorial-transfer-title">
        <div className="tutorial-transfer-heading">
          <span className="eyebrow">{t('CHANGER D’APPAREIL')}</span>
          <h2 id="tutorial-transfer-title">{t('Continuez votre quiz sur un autre appareil.')}</h2>
          <p>{t('Votre progression est enregistrée ici. Un fichier vous permet de la transférer, sans synchronisation automatique.')}</p>
        </div>
        <ol className="tutorial-transfer-steps">
          <li><span>01</span><strong>{t('Téléchargez vos données')}</strong></li>
          <li><span>02</span><strong>{t('Transférez le fichier')}</strong></li>
          <li><span>03</span><strong>{t('Importez-le sur l’autre appareil')}</strong></li>
        </ol>
        <Link className="button button-dark" to="/dashboard?section=backup">{t('Préparer un transfert')} <DemoIcon name="arrowRight" /></Link>
      </section>

      <aside className="tutorial-examples">
        <div>
          <span className="eyebrow">{t('À TOI DE JOUER')}</span>
          <h2>{t('Une vidéo d’exemple pour te lancer ?')}</h2>
          <p>{t('Les vidéos de la collection sont là pour t’inspirer. Tu peux aussi créer un quiz à partir d’un lien YouTube.')}</p>
        </div>
        <div className="tutorial-actions">
          <Link className="button button-quiet" to="/videos">{t('Parcourir les exemples')} <DemoIcon name="mediaPlay" /></Link>
          <Link className="button button-dark" to="/create">{t('Créer mon quiz')} <DemoIcon name="arrowRight" /></Link>
        </div>
      </aside>

      <p className="tutorial-local-note"><DemoIcon name="check" /> {t('Tes quiz et résultats restent enregistrés dans ce navigateur.')}</p>
    </main>
  );
}
