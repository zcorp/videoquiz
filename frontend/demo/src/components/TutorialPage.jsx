import React from 'react';
import { Link } from 'react-router-dom';
import DemoIcon from './DemoIcon.jsx';

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

function StepVisual({ type }) {
  return (
    <div className={`tutorial-visual tutorial-visual-${type}`} aria-hidden="true">
      <div className="tutorial-window-bar"><span /><span /><span /><div>videoquiz.fr</div></div>
      {type === 'video' && (
        <div className="tutorial-video-mock">
          <div className="tutorial-video-preview"><DemoIcon name="mediaPlay" /><span>VIDÉO D’EXEMPLE</span></div>
          <div className="tutorial-video-details"><span className="tutorial-mock-label">CODE DE LA ROUTE</span><strong>Une vidéo pour apprendre, un quiz pour s’entraîner</strong><span>Choisis un exemple ou colle un lien YouTube.</span></div>
          <div className="tutorial-video-timeline"><i /></div>
        </div>
      )}
      {type === 'setup' && (
        <div className="tutorial-setup-mock">
          <span className="tutorial-mock-label">NOUVEAU QUIZ</span>
          <div className="tutorial-mock-field"><small>TITRE DU QUIZ</small><strong>Les bases de la conduite</strong></div>
          <div className="tutorial-mock-field"><small>VIDÉO YOUTUBE</small><span><DemoIcon name="mediaPlay" /> youtube.com/watch…</span></div>
          <small className="tutorial-mode-label">CHOISIS TON MODE</small>
          <div className="tutorial-mode-options"><span>Quiz préparé</span><span className="is-selected">Progressif</span><span>QCM express</span></div>
        </div>
      )}
      {type === 'questions' && (
        <div className="tutorial-questions-mock">
          <div className="tutorial-question-top"><span className="tutorial-mock-label">QUESTION 01</span><span>00:42</span></div>
          <strong>Quel détail as-tu repéré dans la vidéo ?</strong>
          <div className="tutorial-answer-option"><i>A</i><span>Le panneau sur le bord de la route</span></div>
          <div className="tutorial-answer-option is-correct"><i>B</i><span>Le passage piéton</span><DemoIcon name="check" /></div>
          <div className="tutorial-answer-option"><i>C</i><span>Le feu à l’intersection</span></div>
          <div className="tutorial-question-foot"><span>Ta question, tes choix</span><span>01 / 10</span></div>
        </div>
      )}
      {type === 'progress' && (
        <div className="tutorial-progress-mock">
          <div className="tutorial-training-mock">
            <span className="tutorial-mock-label">ENTRAÎNEMENT · QUESTION 07</span>
            <div className="tutorial-progress-bar"><i /></div>
            <strong>À toi de choisir la bonne réponse.</strong>
            <div className="tutorial-training-option is-selected"><i>B</i><span>Je prends le temps d’observer</span><DemoIcon name="check" /></div>
            <div className="tutorial-training-option"><i>C</i><span>Je réponds au hasard</span></div>
          </div>
          <div className="tutorial-score-mock">
            <span className="tutorial-mock-label">TON BILAN</span>
            <strong>8<span> / 10</span></strong>
            <div className="tutorial-score-line"><span>Réussite</span><b>80 %</b></div>
            <div className="tutorial-score-line"><span>À revoir</span><b>2 questions</b></div>
            <span className="tutorial-score-saved"><DemoIcon name="check" /> Enregistré ici</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TutorialPage() {
  return (
    <main className="demo-page tutorial-page">
      <header className="tutorial-hero">
        <div>
          <span className="eyebrow">LE PRINCIPE EN 4 ÉTAPES</span>
          <h1>Une vidéo. Ton quiz. Ta progression.</h1>
          <p>VideoQuiz transforme le visionnage en entraînement actif. Voici le parcours, de la vidéo jusqu’au suivi de tes résultats.</p>
        </div>
        <Link className="tutorial-hero-link" to="/create">Créer mon quiz <DemoIcon name="arrowRight" /></Link>
      </header>

      <nav className="tutorial-flow" aria-label="Les étapes du parcours">
        {steps.map((step, index) => (
          <a className="tutorial-flow-step" href={`#tutorial-step-${step.number}`} key={step.number}>
            <span>{step.number}</span><strong>{step.label}</strong>
            {index < steps.length - 1 && <DemoIcon className="tutorial-flow-arrow" name="arrowRight" />}
          </a>
        ))}
      </nav>

      <section className="tutorial-steps" aria-label="Comment fonctionne VideoQuiz">
        {steps.map((step, index) => (
          <article className={`tutorial-step${index % 2 ? ' tutorial-step-reverse' : ''}`} id={`tutorial-step-${step.number}`} key={step.number}>
            <div className="tutorial-step-copy">
              <span className="tutorial-step-number">{step.number}<i> / 04</i></span>
              <span className="eyebrow">{step.label}</span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </div>
            <StepVisual type={step.visual} />
          </article>
        ))}
      </section>

      <aside className="tutorial-examples">
        <div>
          <span className="eyebrow">À TOI DE JOUER</span>
          <h2>Une vidéo d’exemple pour te lancer ?</h2>
          <p>Les vidéos de la collection sont là pour t’inspirer. Tu peux aussi créer un quiz à partir d’un lien YouTube.</p>
        </div>
        <div className="tutorial-actions">
          <Link className="button button-quiet" to="/videos">Parcourir les exemples <DemoIcon name="mediaPlay" /></Link>
          <Link className="button button-dark" to="/create">Créer mon quiz <DemoIcon name="arrowRight" /></Link>
        </div>
      </aside>

      <p className="tutorial-local-note"><DemoIcon name="check" /> Tes quiz et résultats restent enregistrés dans ce navigateur.</p>
    </main>
  );
}
