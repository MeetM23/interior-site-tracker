import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import logo from '../moodofwood.webp';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      addToast('success', 'Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-beige)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
      }}>
        {/* Brand Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <img src={logo.src} alt="Mood of Wood Logo" style={{ maxWidth: '180px', marginBottom: '1.5rem', objectFit: 'contain' }} />
          <h1 style={{
            fontSize: '1.8rem',
            marginBottom: '0.5rem',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
          }}>
            Interior Site Tracker
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            margin: 0,
          }}>
            Elegant project management for interior design professionals
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          borderRadius: '8px',
          padding: '2.5rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                fontSize: '0.95rem',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg-white)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                fontSize: '0.95rem',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg-white)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: '#FFF5F5',
                border: '1px solid var(--danger-red)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: 'var(--danger-red)',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'var(--text-dark)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
          }}>
            Don't have an account?{' '}
            <a href="/register" style={{
              color: 'var(--primary-orange)',
              fontWeight: 600,
            }}>
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
