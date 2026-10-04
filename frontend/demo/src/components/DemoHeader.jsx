import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CContainer, CHeader, CNavbar } from '@coreui/react';

export default function DemoHeader() {
  return (
    <CHeader className="demo-header">
      <CNavbar className="demo-navbar">
        <CContainer fluid className="demo-header-inner">
        <Link className="demo-wordmark" to="/" aria-label="Video Quiz, accueil">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>video<span className="brand-quiz">quiz</span></span>
          <span className="demo-label">DÉMO</span>
        </Link>
        <nav className="demo-nav" aria-label="Navigation principale">
          <NavLink to="/" end>Découvrir</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink className="btn btn-outline-success nav-create" to="/create"><span aria-hidden="true">＋</span> Créer un quiz</NavLink>
        </nav>
        </CContainer>
      </CNavbar>
    </CHeader>
  );
}