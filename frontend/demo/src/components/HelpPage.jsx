import React from 'react';
import { Link } from 'react-router-dom';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

export default function HelpPage({ onOpenAnalyticsPreferences }) {
  const { t } = useLanguage();
  return (
    <main className="demo-page help-page">
      <header className="help-hero">
        <div className="help-hero-copy">
          <span className="eyebrow">{t('À PROPOS & AIDE')}</span>
          <h1>{t('Regarder, répondre, retenir.')}</h1>
          <p>{t('Video Quiz transforme une vidéo en expérience active : faites une pause, testez ce que vous avez compris, puis revenez au bon passage.')}</p>
          <div className="help-actions">
            <Link className="button button-dark" to="/">{t('Trouver un quiz')} <DemoIcon name="arrowRight" /></Link>
            <Link className="button button-quiet" to="/videos">{t('Choisir une vidéo')} <DemoIcon name="mediaPlay" /></Link>
          </div>
        </div>
        <div className="help-hero-visual" role="img" aria-label={t('Un parcours en trois étapes : regarder, répondre, retenir')}>
          <span className="help-visual-kicker">{t('APPRENDRE À SON RYTHME')}</span>
          <div className="help-visual-play"><DemoIcon name="mediaPlay" /></div>
          <div className="help-visual-steps"><span><b>01</b> {t('Regarder')}</span><span><b>02</b> {t('Répondre')}</span><span><b>03</b> {t('Retenir')}</span></div>
          <span className="help-visual-orbit help-visual-orbit-one" aria-hidden="true" />
          <span className="help-visual-orbit help-visual-orbit-two" aria-hidden="true" />
        </div>
      </header>

      <section className="help-start" aria-labelledby="help-start-title">
        <div className="help-section-heading">
          <span className="eyebrow">{t('POUR BIEN COMMENCER')}</span>
          <h2 id="help-start-title">{t('Que souhaitez-vous faire ?')}</h2>
        </div>
        <div className="help-start-grid">
          <Link to="/" className="help-start-card">
            <span className="help-start-number">01 / {t('EXPLORER')}</span>
            <strong>{t('Faire un quiz')}</strong>
            <span>{t('Choisissez un sujet et lancez-vous avec un quiz prêt à jouer.')}</span>
            <span className="help-start-link">{t('Voir la bibliothèque')} <DemoIcon name="arrowRight" /></span>
          </Link>
          <Link to="/videos" className="help-start-card">
            <span className="help-start-number">02 / {t('CHOISIR')}</span>
            <strong>{t('Parcourir les vidéos')}</strong>
            <span>{t('Trouvez un thème, sélectionnez une vidéo et apprenez à votre rythme.')}</span>
            <span className="help-start-link">{t('Découvrir les vidéos')} <DemoIcon name="arrowRight" /></span>
          </Link>
          <Link to="/dashboard" className="help-start-card">
            <span className="help-start-number">03 / {t('CONTINUER')}</span>
            <strong>{t('Reprendre mon parcours')}</strong>
            <span>{t('Retrouvez vos résultats, vos reprises et vos données sauvegardées.')}</span>
            <span className="help-start-link">{t('Ouvrir mon suivi')} <DemoIcon name="arrowRight" /></span>
          </Link>
        </div>
      </section>

      <section className="help-section" aria-labelledby="help-principles-title">
        <div className="help-section-heading">
          <span className="eyebrow">{t('UNE MÉTHODE SIMPLE')}</span>
          <h2 id="help-principles-title">{t('La vidéo devient votre terrain d’entraînement.')}</h2>
          <p>{t('Pas besoin de tout retenir d’un coup : avancez étape par étape, avec des questions liées aux moments importants.')}</p>
        </div>
        <div className="help-principle-grid">
          <article>
            <span className="help-principle-number">01</span>
            <h3>{t('Regardez')}</h3>
            <p>{t('Choisissez un quiz ou une vidéo et avancez à votre rythme. Chaque question est associée à un passage précis.')}</p>
          </article>
          <article>
            <span className="help-principle-number">02</span>
            <h3>{t('Répondez')}</h3>
            <p>{t('Faites appel à votre mémoire avant de revoir la réponse. Une pause active aide à mieux repérer ce que vous avez compris.')}</p>
          </article>
          <article>
            <span className="help-principle-number">03</span>
            <h3>{t('Progressez')}</h3>
            <p>{t('Relisez l’explication, revoyez le passage utile et retrouvez vos résultats dans votre tableau de bord.')}</p>
          </article>
        </div>
        <Link className="help-inline-cta" to="/">{t('Un quiz vous attend')} <span>{t('Commencer à explorer')} <DemoIcon name="arrowRight" /></span></Link>
      </section>

      <section className="help-info-grid" aria-label={t('Données et vidéos')}>
        <article>
          <span className="eyebrow">{t('VOTRE ESPACE')}</span>
          <h2>{t('Vous gardez la main.')}</h2>
          <p>{t('Dans cette démo, vos quiz créés, résultats et reprises sont conservés dans le stockage local de ce navigateur. Ils ne sont pas synchronisés entre appareils et aucun compte n’est nécessaire.')}</p>
          <p>{t('Pour transférer ou conserver vos données, utilisez la sauvegarde et la restauration depuis le dashboard. Effacer les données du navigateur peut supprimer les éléments enregistrés ici.')}</p>
          <Link to="/dashboard">{t('Sauvegarder ou retrouver mes données')} <DemoIcon name="arrowRight" /></Link>
        </article>
        <article>
          <span className="eyebrow">{t('TRANSPARENCE')}</span>
          <h2>{t('La vidéo reste chez sa plateforme.')}</h2>
          <p>{t('Les vidéos YouTube, Vimeo, Dailymotion, RUTUBE et TikTok sont intégrées depuis leur plateforme. Leur disponibilité et leur lecture dépendent de celle-ci et des réglages de la personne qui les a publiées.')}</p>
          <p>{t('La mesure d’audience est soumise à votre choix. Les réponses aux quiz et les contenus que vous saisissez ne sont pas envoyés à Google Analytics.')}</p>
          <button type="button" onClick={onOpenAnalyticsPreferences}>{t('Préférences Analytics')}</button>
          <p className="help-contact">{t('Une question ?')} <a href="mailto:contact@videoquiz.fr">{t('Écrivez-nous à contact@videoquiz.fr')}</a></p>
        </article>
      </section>

      <section className="help-faq" aria-labelledby="help-faq-title">
        <div className="help-section-heading">
          <span className="eyebrow">{t('QUESTIONS FRÉQUENTES')}</span>
          <h2 id="help-faq-title">{t('Les réponses aux questions courantes.')}</h2>
        </div>
        <details>
          <summary>{t('Mes données seront-elles disponibles sur un autre appareil ?')}</summary>
          <p>{t('Non, elles restent dans le navigateur où vous les avez créées. Téléchargez une sauvegarde depuis le dashboard, puis importez-la dans l’autre navigateur.')}</p>
        </details>
        <details>
          <summary>{t('Comment fonctionne la révision progressive ?')}</summary>
          <p>{t('Vous donnez d’abord votre réponse, puis votre auto-correction d’après la vidéo. Le résultat indique la concordance entre ces deux grilles ; ce n’est pas une validation automatique de la justesse du contenu.')}</p>
        </details>
        <details>
          <summary>{t('Les quiz sur le code de la route sont-ils officiels ?')}</summary>
          <p>{t('Non. Ce sont des supports d’entraînement de la démo, pas des contenus officiels ni une garantie de réussite à l’examen.')}</p>
        </details>
      </section>
    </main>
  );
}
