import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import logo from '../moodofwood.webp';

export default function Layout({ children }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path) => router.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Calendar', path: '/calendar' },
  ];

  if (user?.role === 'owner') {
    navItems.push({ label: 'Team', path: '/team' });
  }
  if (user) {
    navItems.push({ label: 'Profile', path: '/profile' });
  }

  const isPublicPage = router.pathname === '/';
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-beige)' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-beige)',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '80px',
        backgroundColor: 'var(--text-dark)', // Strict dark neutral
        color: 'white',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Scrollable inner container */}
        <div style={{
          flex: 1,
          padding: '2rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {/* Logo/Brand */}
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            alignItems: 'center',
            height: '60px',
          }}>
            {sidebarOpen ? (
              <img src={logo.src} alt="Mood of Wood Logo" style={{ maxWidth: '140px', objectFit: 'contain' }} />
            ) : (
               <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: "'Playfair Display', serif",
              }}>
                M
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav style={{ marginBottom: '3rem' }}>
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.25rem',
                  marginBottom: '0.5rem',
                  position: 'relative',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive(item.path) ? 500 : 400,
                  color: isActive(item.path) ? 'white' : 'rgba(255,255,255,0.6)',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}>
                  {isActive(item.path) && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: '24px',
                      width: '3px',
                      backgroundColor: 'var(--primary-orange)',
                      borderRadius: '0 4px 4px 0',
                    }} />
                  )}
                  {sidebarOpen ? (
                    <span>{item.label}</span>
                  ) : (
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>{item.label.charAt(0)}</span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* User & Logout - Pushed to bottom via flex */}
          {user && (
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '1.5rem',
              marginTop: 'auto',
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                textAlign: sidebarOpen ? 'left' : 'center',
              }}>
                {sidebarOpen ? 'Account' : 'US'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {sidebarOpen && (
                  <p style={{
                    fontSize: '0.9rem',
                    margin: 0,
                    fontWeight: 500,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}>
                {sidebarOpen ? 'Sign Out' : 'Out'}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Toggle - Absolute positioned directly inside aside so it is not clipped by overflow container */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '2rem',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-orange)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            zIndex: 1001,
          }}>
          {sidebarOpen ? '‹' : '›'}
        </button>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? '260px' : '80px',
        transition: 'margin-left 0.3s ease',
        padding: '2.5rem 3rem',
        maxWidth: '100%',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
