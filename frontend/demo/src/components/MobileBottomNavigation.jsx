import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import DemoIcon from './DemoIcon.jsx';

const destinations = [
  { label: 'Découvrir', to: '/', icon: 'home', end: true },
  { label: 'Vidéos', to: '/videos', icon: 'mediaPlay' },
  { label: 'Suivi', to: '/suivi', icon: 'chart', matches: path => path === '/suivi' || path.startsWith('/progression/') },
  { label: 'Créer', to: '/create', icon: 'plus', matches: path => path === '/create' || path.startsWith('/edit/') },
];

export default function MobileBottomNavigation() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/quiz/') || pathname === '/create' || pathname.startsWith('/edit/')) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
      {destinations.map(({ label, to, icon, end, matches }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `mobile-bottom-nav-link${(matches?.(pathname) || isActive) ? ' active' : ''}`}
          aria-label={label}
        >
          <DemoIcon name={icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
