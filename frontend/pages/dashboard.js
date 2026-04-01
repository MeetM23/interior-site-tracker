import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingDashboard(true);
      try {
        const [p, a] = await Promise.all([
          api.get('/projects'), api.get('/projects/meta/alerts')
        ]);
        setProjects(p.data?.data || []);
        setAlerts(a.data?.data || []);
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load dashboard';
        setError(msg);
      } finally {
        setLoadingDashboard(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <p>Loading...</p>;

  if (loadingDashboard) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  const total = projects.length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const delayed = projects.filter(p => p.status === 'delayed').length;
  const onTrack = projects.filter(p => p.status === 'on_track').length;
  const atRisk = projects.filter(p => p.status === 'at_risk').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'on_track': return 'var(--primary-orange)';
      case 'at_risk': return 'var(--warning-yellow)';
      case 'delayed': return 'var(--danger-red)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const StatCard = ({ label, value }) => (
    <div style={{
      backgroundColor: 'var(--bg-white)',
      borderRadius: '8px',
      padding: '2rem 1.5rem',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}>
      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
        {label}
      </p>
      <div style={{ margin: 0, fontSize: '3rem', fontWeight: 700, color: 'var(--text-dark)', fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Welcome back, {user.name}. Here's your project overview.</p>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FFF5F5',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          border: '1px solid #FFEBEB',
          marginBottom: '2rem',
          color: 'var(--danger-red)',
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}>
        <StatCard label="Total Projects" value={total} />
        <StatCard label="Completed" value={completed} />
        <StatCard label="On Track" value={onTrack} />
        <StatCard label="At Risk" value={atRisk} />
        <StatCard label="Delayed" value={delayed} />
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Active Alerts
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {alerts
              .filter(a => !dismissedAlerts.includes(`${a.id}-${a.type}`))
              .map(a => (
                <div key={`${a.id}-${a.type}`} style={{
                  backgroundColor: 'var(--bg-white)',
                  borderLeft: `4px solid ${a.type === 'delay' ? 'var(--danger-red)' : a.type === 'deadline' ? 'var(--warning-yellow)' : 'var(--text-muted)'}`,
                  padding: '1.5rem',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {a.type?.toUpperCase()}
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-dark)' }}>
                      {a.project}
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {a.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setDismissedAlerts(prev => [...prev, `${a.id}-${a.type}`])}
                    style={{
                      padding: '0.6rem 1.2rem',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                      marginLeft: '1rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--danger-red)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'var(--danger-red)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                    }}>
                    Dismiss
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {projects.some(p => p.updates && p.updates.length > 0) && (
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Recent Updates
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {projects
              .flatMap(p => (p.updates || []).map(u => ({ projectId: p._id, projectName: p.name, ...u })))
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((u, idx) => (
                <div key={`${u._id || idx}`} style={{
                  backgroundColor: 'var(--bg-white)',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {u.projectName}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-dark)', lineHeight: 1.5 }}>
                        {u.notes}
                      </p>
                    </div>
                    <time style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '1rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </time>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Project List */}
      <div>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Projects
        </h2>
        {projects.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--bg-white)',
            padding: '3rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', margin: 0 }}>
              No projects yet. Start by creating a new interior site project.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {projects.map(p => (
              <div
                key={p._id}
                onClick={() => router.push(`/projects/${p._id}`)}
                style={{
                  backgroundColor: 'var(--bg-white)',
                  borderRadius: '8px',
                  padding: '2rem 1.5rem',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{p.name}</h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {p.clientName} — {p.location}
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontWeight: 600, color: getStatusColor(p.status) }}>{p.completionPercent || 0}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    backgroundColor: 'var(--border-light)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${p.completionPercent || 0}%`,
                      backgroundColor: getStatusColor(p.status),
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(p.status) }} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      {getStatusLabel(p.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
