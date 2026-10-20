import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CContainer, CHeader, CNavbar } from '@coreui/react';
import DemoIcon from './DemoIcon.jsx';
import { useLanguage } from '../i18n.jsx';

export default function DemoHeader() {
  const { language, setLanguage, t } = useLanguage();
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
          <Link className="demo-wordmark" to="/" aria-label={t('Video Quiz, accueil')} onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">V</span>
            <span>video<span className="brand-quiz">quiz</span></span>
            <span className="demo-label">{t('DÉMO')}</span>
          </Link>
          <button
            ref={menuToggleRef}
            type="button"
            className="demo-menu-toggle"
            aria-label={t(menuOpen ? 'Fermer le menu' : 'Ouvrir le menu')}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen(open => !open)}
          >
            <DemoIcon name={menuOpen ? 'x' : 'menu'} />
          </button>
          <nav id="primary-navigation" className={`demo-nav${menuOpen ? ' is-open' : ''}`} aria-label={t('Navigation principale')}>
            <NavLink to="/" end onClick={closeMenu}>{t('Découvrir')}</NavLink>
            <NavLink to="/dashboard" onClick={closeMenu}>{t('Dashboard')}</NavLink>
            <NavLink to="/help" onClick={closeMenu}>{t('Aide')}</NavLink>
            <NavLink className="btn btn-outline-success nav-create" to="/create" onClick={closeMenu}><DemoIcon name="plus" /> {t('Créer un quiz')}</NavLink>
          </nav>
          <label className="language-switcher">
            <span className="visually-hidden">{t('Choisir la langue')}</span>
            <select aria-label={t('Choisir la langue')} value={language} onChange={event => setLanguage(event.target.value)}>
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </label>
        </CContainer>
      </CNavbar>
    </CHeader>
  );
}