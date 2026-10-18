import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useTheme from '../hooks/useTheme';
import SearchBox from './SearchBox';

const COMMIT_HASH = typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev';
const COMMIT_SHORT = typeof __COMMIT_SHORT__ !== 'undefined' ? __COMMIT_SHORT__ : 'dev';
const API_URL = 'https://git.rthak.com/rthak/kingfisher-api';
const WEB_REPO_URL = 'https://git.rthak.com/rthak/kingfisher-web';

function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="SiteHeader">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', minHeight: '72px', gap: '1.5rem' }}>
            <Link to="/" className="logo" style={{ color: '#fff', textDecoration: 'none', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
              Kingfisher
            </Link>

            <div style={{ flex: 1, margin: '0 1.5rem' }}>
              <SearchBox />
            </div>

            <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <Link to="/search" className={isActive('/search') || isActive('/courses') ? 'active' : ''} style={{ padding: '0.5rem 1rem', color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontWeight: '500', borderRadius: '6px' }}>
                Courses
              </Link>
              <Link to="/explore" className={isActive('/explore') ? 'active' : ''} style={{ padding: '0.5rem 1rem', color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontWeight: '500', borderRadius: '6px' }}>
                Explore
              </Link>
              <a onClick={toggleTheme} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}
                 title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </a>
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem 0' }}>
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="SiteFooter" style={{
        backgroundColor: 'var(--bg-footer)',
        padding: '3rem 0',
        marginTop: 'auto',
        borderTop: '1px solid var(--border-color)'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ color: 'var(--text-footer)', fontSize: '0.9em', fontWeight: '500' }}>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <a
              href={API_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                background: '#00b5ad', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                padding: '0.35rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: '400',
                fontSize: '11px',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.02em'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              API
            </a>
            <a
              href={`${WEB_REPO_URL}/commit/${COMMIT_HASH}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                backgroundColor: theme === 'dark' ? '#333' : '#1b1c1d', 
                color: 'white', 
                border: theme === 'dark' ? '1px solid #444' : 'none',
                borderRadius: '4px',
                padding: '0.35rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: '400',
                fontSize: '11px',
                textDecoration: 'none',
                textTransform: 'lowercase',
                letterSpacing: '0.02em'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
              rev {COMMIT_SHORT}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
