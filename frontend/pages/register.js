import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import logo from '../moodofwood.webp';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'owner' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      addToast('success', 'Account created! Welcome aboard.');
      router.push('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const FormField = ({ label, type = 'text', value, onChange, placeholder, required = true }) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.6rem',
        fontWeight: 600,
        color: 'var(--text-dark)',
        fontSize: '0.95rem',
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
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
  );

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
            Join the most elegant project management platform for interior designers
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
            Create Account
          </h2>

          <form onSubmit={handleSubmit}>
            <FormField
              label="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />

            <FormField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />

            <FormField
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />

            {/* Role Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                fontSize: '0.95rem',
              }}>
                Role
              </label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--bg-white)',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <option value="owner">Project Owner</option>
                <option value="designer">Interior Designer</option>
              </select>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '0.4rem',
                margin: '0.4rem 0 0 0',
              }}>
                {form.role === 'owner' ? 'Manage projects and collaborate with designers' : 'Work on assigned projects and submit updates'}
              </p>
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
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-light)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
          }}>
            Already have an account?{' '}
            <a href="/login" style={{
              color: 'var(--primary-orange)',
              fontWeight: 600,
            }}>
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
