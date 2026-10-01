import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function DemoHeader() {
  return (
    <header className="demo-header">
      <div className="demo-header-inner">
        <Link className="demo-wordmark" to="/" aria-label="Video Quiz, accueil">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>video<span className="brand-quiz">quiz</span></span>
          <span className="demo-label">DÉMO</span>
        </Link>
        <nav className="demo-nav" aria-label="Navigation principale">
          <NavLink to="/" end>Découvrir</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink className="nav-create" to="/create"><span aria-hidden="true">＋</span> Créer un quiz</NavLink>
        </nav>
      </div>
    </header>
  );
}