import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CBadge, CFooter } from '@coreui/react';
import DemoHeader from './components/DemoHeader.jsx';
import DemoHome from './components/DemoHome.jsx';
import DemoPlayer from './components/DemoPlayer.jsx';
import DemoEditor from './components/DemoEditor.jsx';
import ProgressionPage from './components/ProgressionPage.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import WelcomeGuide from './components/WelcomeGuide.jsx';
import RoadCodeVideosPage from './components/RoadCodeVideosPage.jsx';
import HelpPage from './components/HelpPage.jsx';
import TrackingPage from './components/TrackingPage.jsx';
import TutorialPage from './components/TutorialPage.jsx';
import MobileBottomNavigation from './components/MobileBottomNavigation.jsx';
import { demoQuizzes } from './data/demoQuizzes.js';
import { createRoadCodeQuickReview, deleteLocalQuiz, getAttempts, getLocalQuizzes, saveAttempt, saveLocalQuiz } from './services/localStore.js';
import { LanguageProvider, localizeQuiz, useLanguage } from './i18n.jsx';

const ANALYTICS_CONSENT_KEY = 'videoquiz-demo:analytics-consent:v1';
const GA_MEASUREMENT_ID = 'G-8WSJCE0XQM';

function readAnalyticsConsent() {
  try {
    const consent = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return consent === 'accepted' || consent === 'rejected' ? consent : null;
  } catch {
    return null;
  }
}

function DemoAppContent() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [localQuizzes, setLocalQuizzes] = useState(getLocalQuizzes);
  const [attempts, setAttempts] = useState(getAttempts);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem(`videoquiz-demo:welcome-seen:v1:${language}`) !== '1');
  const [analyticsConsent, setAnalyticsConsent] = useState(readAnalyticsConsent);
  const [showAnalyticsChoices, setShowAnalyticsChoices] = useState(() => readAnalyticsConsent() === null);
  const [analyticsStorageWarning, setAnalyticsStorageWarning] = useState(false);
  const lastTrackedLocation = useRef(null);
  const analyticsConsentRef = useRef(analyticsConsent);
  const location = useLocation();
  useEffect(() => {
    document.documentElement.lang = language;
    const pageMetadata = {
      '/': {
        title: t('Video Quiz — Créer un quiz vidéo interactif'),
        description: t('Créez un quiz vidéo interactif : associez une vidéo de votre choix à un QCM, entraînez-vous à votre rythme et retrouvez votre progression dans ce navigateur.'),
        canonical: 'https://www.videoquiz.fr/',
      },
      '/tutoriel': {
        title: t('Tutoriel Video Quiz — Créer un quiz à partir d’une vidéo'),
        description: t('Découvrez comment choisir une vidéo, préparer un quiz, répondre aux questions et suivre votre progression avec Video Quiz.'),
        canonical: 'https://www.videoquiz.fr/tutoriel/',
      },
    };
    const metadata = pageMetadata[location.pathname] ?? {
      title: t('Video Quiz — Démo interactive'),
      description: t('Explorez la démo Video Quiz et créez des quiz vidéo conservés dans votre navigateur.'),
      canonical: 'https://www.videoquiz.fr/',
    };

    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', metadata.canonical);
  }, [language, location.pathname, t]);

  const immersiveRoute = location.pathname.startsWith('/quiz/')
    || location.pathname === '/create'
    || location.pathname.startsWith('/edit/');
  const quizzes = useMemo(() => [
    ...localQuizzes,
    ...demoQuizzes.map(quiz => localizeQuiz(quiz, t, language)),
  ], [language, localQuizzes, t]);
  const trackInteraction = useCallback(eventName => {
    if (analyticsConsentRef.current === 'accepted' && window.gtag) window.gtag('event', eventName);
  }, []);

  analyticsConsentRef.current = analyticsConsent;

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  useEffect(() => {
    if (analyticsConsent === 'rejected') {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      return;
    }
    if (analyticsConsent !== 'accepted') return;
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
    if (window.videoQuizAnalyticsInitialized) {
      window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
    window.videoQuizAnalyticsInitialized = true;

    if (!document.getElementById('videoquiz-google-analytics')) {
      const script = document.createElement('script');
      script.id = 'videoquiz-google-analytics';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }
  }, [analyticsConsent]);

  useEffect(() => {
    if (analyticsConsent !== 'accepted' || !window.gtag) return;
    if (lastTrackedLocation.current === location.pathname) return;
    lastTrackedLocation.current = location.pathname;
    const section = location.pathname.split('/').filter(Boolean)[0] || 'accueil';
    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_path: `${window.location.pathname}#/${section}`,
    });
  }, [analyticsConsent, location.pathname]);

  const addQuiz = quiz => {
    const saved = saveLocalQuiz(quiz);
    if (saved.saved) setLocalQuizzes(getLocalQuizzes());
    return saved;
  };
  const startRoadCodeQuickReview = video => {
    const quiz = createRoadCodeQuickReview(
      video,
      video.title,
      t('Grille de 40 questions à compléter en suivant la vidéo. Choisissez vos réponses, puis auto-corrigez-vous.'),
    );
    const result = addQuiz(quiz);
    if (result?.saved) navigate(`/quiz/${quiz.id}`);
    return result;
  };
  const addAttempt = attempt => {
    if (saveAttempt(attempt)) setAttempts(getAttempts());
  };
  const refreshLocalData = () => {
    setLocalQuizzes(getLocalQuizzes());
    setAttempts(getAttempts());
  };
  const closeWelcome = () => {
    localStorage.setItem(`videoquiz-demo:welcome-seen:v1:${language}`, '1');
    setShowWelcome(false);
  };
  const chooseAnalyticsConsent = consent => {
    try {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
      setAnalyticsStorageWarning(false);
    } catch {
      setAnalyticsStorageWarning(true);
    }
    if (consent === 'accepted') lastTrackedLocation.current = null;
    setAnalyticsConsent(consent);
    setShowAnalyticsChoices(false);
  };

  return (
    <div className={`demo-shell${immersiveRoute ? ' is-immersive' : ''}`}>
      <DemoHeader />
      <Routes>
        <Route path="/" element={<DemoHome quizzes={quizzes} attempts={attempts} onDelete={id => { deleteLocalQuiz(id); setLocalQuizzes(getLocalQuizzes()); }} />} />
        <Route path="/dashboard" element={<DashboardPage quizzes={quizzes} attempts={attempts} onDataChanged={refreshLocalData} onTrack={trackInteraction} />} />
        <Route path="/suivi" element={<TrackingPage quizzes={quizzes} attempts={attempts} />} />
        <Route path="/help" element={<HelpPage onOpenAnalyticsPreferences={() => setShowAnalyticsChoices(true)} />} />
        <Route path="/tutoriel" element={<TutorialPage />} />
        <Route path="/videos" element={<RoadCodeVideosPage quizzes={quizzes} onQuickReview={startRoadCodeQuickReview} />} />
        <Route path="/videos/code-route" element={<RoadCodeVideosPage quizzes={quizzes} onQuickReview={startRoadCodeQuickReview} />} />
        <Route path="/quiz/:quizId" element={<DemoPlayer quizzes={quizzes} onAttempt={addAttempt} onTrack={trackInteraction} />} />
        <Route path="/progression/:quizId" element={<ProgressionPage quizzes={quizzes} />} />
        <Route path="/create" element={<DemoEditor quizzes={quizzes} onSave={addQuiz} />} />
        <Route path="/edit/:quizId" element={<DemoEditor quiz={localQuizzes.find(quiz => quiz.id === location.pathname.split('/').pop())} quizzes={quizzes} onSave={addQuiz} />} />
        <Route path="*" element={<DemoHome quizzes={quizzes} attempts={attempts} />} />
      </Routes>
      <MobileBottomNavigation />
      <CFooter className="demo-footer">
        <span className="demo-footer-brand"><img src={`${import.meta.env.BASE_URL}brand/videoquiz-horizontal.png`} alt="Video Quiz" /><CBadge color="secondary">{t('DÉMO')}</CBadge></span>
        <Link to="/help">{t('À propos & aide')}</Link>
        <a href="mailto:contact@videoquiz.fr">contact@videoquiz.fr</a>
        <span>© {new Date().getFullYear()} ZCOORE. {t('Tous droits réservés.')}</span>
        <button className="analytics-preferences-link" type="button" onClick={() => setShowAnalyticsChoices(true)}>{t('Préférences Analytics')}</button>
      </CFooter>
      {showWelcome && !showAnalyticsChoices && <WelcomeGuide onClose={closeWelcome} />}
      {showAnalyticsChoices && <section className="analytics-consent" role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title">
        <div className="analytics-consent-copy">
          <h2 id="analytics-consent-title">{t('Mesure d’audience')}</h2>
          <p>{t('Pour améliorer l’expérience utilisateur, nous mesurons avec Google Analytics la consultation des différentes sections de cette démo. Aucune réponse au quiz ni aucun contenu saisi n’est envoyé.')}</p>
          {analyticsStorageWarning && <p className="analytics-consent-warning" role="alert">{t('Votre choix ne peut pas être mémorisé dans ce navigateur. Il s’appliquera uniquement jusqu’à la fermeture de cette page.')}</p>}
        </div>
        <div className="analytics-consent-actions">
          <button className="analytics-consent-reject" type="button" onClick={() => chooseAnalyticsConsent('rejected')}>{t('Refuser')}</button>
          <button className="analytics-consent-accept" type="button" onClick={() => chooseAnalyticsConsent('accepted')}>{t('Accepter')}</button>
        </div>
      </section>}
    </div>
  );
}

export default function DemoApp() {
  return <LanguageProvider><DemoAppContent /></LanguageProvider>;
}