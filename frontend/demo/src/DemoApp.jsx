import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CBadge, CFooter } from '@coreui/react';
import DemoHeader from './components/DemoHeader.jsx';
import DemoHome from './components/DemoHome.jsx';
import DemoPlayer from './components/DemoPlayer.jsx';
import DemoEditor from './components/DemoEditor.jsx';
import ProgressionPage from './components/ProgressionPage.jsx';
import DashboardPage from './components/DashboardPage.jsx';
import WelcomeGuide from './components/WelcomeGuide.jsx';
import RoadCodeVideosPage from './components/RoadCodeVideosPage.jsx';
import { demoQuizzes } from './data/demoQuizzes.js';
import { deleteLocalQuiz, getAttempts, getLocalQuizzes, saveAttempt, saveLocalQuiz } from './services/localStore.js';

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

export default function DemoApp() {
  const [localQuizzes, setLocalQuizzes] = useState(getLocalQuizzes);
  const [attempts, setAttempts] = useState(getAttempts);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('videoquiz-demo:welcome-seen:v1') !== '1');
  const [analyticsConsent, setAnalyticsConsent] = useState(readAnalyticsConsent);
  const [showAnalyticsChoices, setShowAnalyticsChoices] = useState(() => readAnalyticsConsent() === null);
  const [analyticsStorageWarning, setAnalyticsStorageWarning] = useState(false);
  const lastTrackedLocation = useRef(null);
  const location = useLocation();
  const quizzes = useMemo(() => [...localQuizzes, ...demoQuizzes], [localQuizzes]);

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
  const addAttempt = attempt => {
    if (saveAttempt(attempt)) setAttempts(getAttempts());
  };
  const closeWelcome = () => {
    localStorage.setItem('videoquiz-demo:welcome-seen:v1', '1');
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
    <div className="demo-shell">
      <DemoHeader />
      <Routes>
        <Route path="/" element={<DemoHome quizzes={quizzes} attempts={attempts} onDelete={id => { deleteLocalQuiz(id); setLocalQuizzes(getLocalQuizzes()); }} />} />
        <Route path="/dashboard" element={<DashboardPage quizzes={quizzes} attempts={attempts} />} />
        <Route path="/videos" element={<RoadCodeVideosPage quizzes={quizzes} />} />
        <Route path="/videos/code-route" element={<RoadCodeVideosPage quizzes={quizzes} />} />
        <Route path="/quiz/:quizId" element={<DemoPlayer quizzes={quizzes} onAttempt={addAttempt} />} />
        <Route path="/progression/:quizId" element={<ProgressionPage quizzes={quizzes} />} />
        <Route path="/create" element={<DemoEditor quizzes={quizzes} onSave={addQuiz} />} />
        <Route path="/edit/:quizId" element={<DemoEditor quiz={localQuizzes.find(quiz => quiz.id === location.pathname.split('/').pop())} quizzes={quizzes} onSave={addQuiz} />} />
        <Route path="*" element={<DemoHome quizzes={quizzes} attempts={attempts} />} />
      </Routes>
      <CFooter className="demo-footer">
        <span>VIDEO QUIZ <CBadge color="secondary">DÉMO</CBadge></span>
        <span>Quiz et scores enregistrés sur cet appareil.</span>
        <span>© {new Date().getFullYear()} ZCOORE. Tous droits réservés.</span>
        <button className="analytics-preferences-link" type="button" onClick={() => setShowAnalyticsChoices(true)}>Préférences Analytics</button>
      </CFooter>
      {showWelcome && <WelcomeGuide onClose={closeWelcome} />}
      {showAnalyticsChoices && <section className="analytics-consent" role="dialog" aria-labelledby="analytics-consent-title">
        <div className="analytics-consent-copy">
          <h2 id="analytics-consent-title">Mesure d’audience</h2>
          <p>Pour améliorer l’expérience utilisateur, nous mesurons avec Google Analytics la consultation des différentes sections de cette démo. Aucune réponse au quiz ni aucun contenu saisi n’est envoyé. Vous pouvez refuser ou modifier votre choix à tout moment dans le pied de page.</p>
          {analyticsStorageWarning && <p className="analytics-consent-warning" role="alert">Votre choix ne peut pas être mémorisé dans ce navigateur. Il s’appliquera uniquement jusqu’à la fermeture de cette page.</p>}
        </div>
        <div className="analytics-consent-actions">
          <button className="analytics-consent-reject" type="button" onClick={() => chooseAnalyticsConsent('rejected')}>Refuser</button>
          <button className="analytics-consent-accept" type="button" onClick={() => chooseAnalyticsConsent('accepted')}>Accepter</button>
        </div>
      </section>}
    </div>
  );
}