import React from 'react';
import { Link } from 'react-router-dom';
import DemoIcon from './DemoIcon.jsx';

const steps = [
  {
    number: '01',
    title: 'Choisis ta vidéo',
    description: 'Colle le lien d’une vidéo YouTube que tu veux utiliser. Tu peux choisir n’importe quel sujet.',
  },
  {
    number: '02',
    title: 'Crée ton QCM',
    description: 'Ajoute tes questions, tes réponses et les moments de la vidéo qui les accompagnent. Choisis le format qui te convient.',
  },
  {
    number: '03',
    title: 'Regarde et entraîne-toi',
    description: 'Lance la vidéo, réponds aux questions et retrouve tes résultats dans ton suivi, enregistrés sur cet appareil.',
  },
];

export default function TutorialPage() {
  return (
    <main className="demo-page tutorial-page">
      <header className="tutorial-hero">
        <span className="eyebrow">LE PRINCIPE EN 3 ÉTAPES</span>
        <h1>Une vidéo. Ton QCM. Ton rythme.</h1>
        <p>Transforme une vidéo en moment d’apprentissage actif : prépare quelques questions, regarde, puis vérifie ce que tu as retenu.</p>
      </header>

      <section className="tutorial-steps" aria-label="Comment créer et utiliser un quiz vidéo">
        {steps.map(step => (
          <article className="tutorial-step" key={step.number}>
            <span className="tutorial-step-number">{step.number}</span>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </article>
        ))}
      </section>

      <aside className="tutorial-examples">
        <div>
          <span className="eyebrow">BESOIN D’INSPIRATION ?</span>
          <h2>Les vidéos proposées sont des exemples pour te lancer.</h2>
          <p>Tu peux en choisir une dans la collection, ou utiliser directement le lien d’une autre vidéo YouTube.</p>
        </div>
        <div className="tutorial-actions">
          <Link className="button button-quiet" to="/videos">Parcourir les vidéos d’exemple <DemoIcon name="mediaPlay" /></Link>
          <Link className="button button-dark" to="/create">Créer mon QCM <DemoIcon name="arrowRight" /></Link>
        </div>
      </aside>

      <p className="tutorial-local-note"><DemoIcon name="check" /> Tes quiz et résultats restent dans le stockage de ce navigateur.</p>
    </main>
  );
}
