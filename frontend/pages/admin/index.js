import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  header: { marginBottom: '3rem' },
  title: { fontSize: '2.5rem', fontWeight: 700, color: '#1d1d1f', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', fontFamily: "'Playfair Display', serif" },
  subtitle: { fontSize: '1.1rem', color: '#86868b', margin: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginTop: '2rem'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)',
    border: '1px solid rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#86868b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '1rem'
  },
  cardValue: {
    fontSize: '3.5rem',
    fontWeight: 700,
    color: '#1d1d1f',
    letterSpacing: '-0.02em',
    lineHeight: 1
  }
};

export default function SuperAdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ totalCompanies: 0, totalUsers: 0, totalProjects: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.get('/admin/stats')
        .then(r => {
          setStats(r.data.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [user]);

  if (loading || !user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Controller Operations</h1>
        <p style={styles.subtitle}>High-level platform metrics. You have strictly decoupled visibility.</p>
      </div>

      {isLoading ? (
        <div style={{ color: '#86868b' }}>Loading metrics...</div>
      ) : (
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Total Active Companies</div>
            <div style={styles.cardValue}>{stats.totalCompanies}</div>
          </div>
          
          <div style={styles.card}>
            <div style={styles.cardTitle}>Registered Users</div>
            <div style={styles.cardValue}>{stats.totalUsers}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Total Workspaces</div>
            <div style={styles.cardValue}>{stats.totalProjects}</div>
          </div>
        </div>
      )}
    </div>
  );
}
