import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CContainer, CHeader, CNavbar } from '@coreui/react';
import DemoIcon from './DemoIcon.jsx';

export default function DemoHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    if (menuOpen && window.matchMedia('(max-width: 680px)').matches) {
      menuToggleRef.current?.focus();
    }
  };

  return (
    <CHeader className="demo-header">
      <CNavbar className="demo-navbar">
        <CContainer fluid className="demo-header-inner">
          <Link className="demo-wordmark" to="/" aria-label="Video Quiz, accueil" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">V</span>
            <span>video<span className="brand-quiz">quiz</span></span>
            <span className="demo-label">DÉMO</span>
          </Link>
          <button
            ref={menuToggleRef}
            type="button"
            className="demo-menu-toggle"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(open => !open)}
          >
            <DemoIcon name={menuOpen ? 'x' : 'menu'} />
          </button>
          <nav id="primary-navigation" className={`demo-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navigation principale">
            <NavLink to="/" end onClick={closeMenu}>Découvrir</NavLink>
            <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
            <NavLink to="/help" onClick={closeMenu}>Aide</NavLink>
            <NavLink className="btn btn-outline-success nav-create" to="/create" onClick={closeMenu}><DemoIcon name="plus" /> Créer un quiz</NavLink>
          </nav>
        </CContainer>
      </CNavbar>
    </CHeader>
  );
}