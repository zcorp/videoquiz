import React, { useEffect, useMemo, useState } from 'react';
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

export default function DemoApp() {
  const [localQuizzes, setLocalQuizzes] = useState(getLocalQuizzes);
  const [attempts, setAttempts] = useState(getAttempts);
  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('videoquiz-demo:welcome-seen:v1') !== '1');
  const location = useLocation();
  const quizzes = useMemo(() => [...localQuizzes, ...demoQuizzes], [localQuizzes]);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

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
        <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">Vidéos hébergées par YouTube ↗</a>
      </CFooter>
      {showWelcome && <WelcomeGuide onClose={closeWelcome} />}
    </div>
  );
}