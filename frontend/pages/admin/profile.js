import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useToast } from '../../components/ToastProvider';

const styles = {
  container: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0' },
  subtitle: { fontSize: '1.05rem', color: '#86868b', margin: 0 },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' },
  input: { width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', border: '1px solid #d2d2d7', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#515154', marginBottom: '0.5rem' },
  btnPrimary: { padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 500, color: '#ffffff', backgroundColor: '#1d1d1f', border: 'none', borderRadius: '9px', cursor: 'pointer' },
};

export default function SuperAdminProfile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
    } else if (user) {
      setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', password: '' });
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { name: formData.name, phone: formData.phone };
      if (formData.password) payload.password = formData.password;
      
      await api.put(`/users/${user._id}`, payload);
      addToast('success', 'Profile updated effectively.');
      setFormData({...formData, password: ''});
    } catch (err) {
      addToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Control Identity</h1>
        <p style={styles.subtitle}>Manage your root login credentials and personal details.</p>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          <div>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label style={styles.label}>Email Address (Immutable)</label>
            <input style={styles.input} disabled value={formData.email} />
          </div>
          <div>
            <label style={styles.label}>Phone Number</label>
            <input style={styles.input} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" placeholder="Leave blank to keep current password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} />
          </div>
          
          <div style={{ paddingTop: '1rem' }}>
            <button type="submit" disabled={isSubmitting} style={{...styles.btnPrimary, width: '100%', opacity: isSubmitting ? 0.7 : 1}}>
               {isSubmitting ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
