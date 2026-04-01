import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingProjects(true);
      try {
        const r = await api.get('/projects');
        setProjects(r.data?.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed');
      } finally {
        setLoadingProjects(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <p>Loading...</p>;

  if (loadingProjects) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading your projects...</p>
      </div>
    );
  }

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

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
      }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Projects</h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
            {user.role === 'owner' ? 'Manage all your interior design projects' : 'View your assigned projects'}
          </p>
        </div>
        {user.role === 'owner' && (
          <Link href="/projects/new">
            <button style={{
              padding: '0.8rem 1.6rem',
              backgroundColor: 'var(--text-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-dark)';
            }}>
              Create Project
            </button>
          </Link>
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: '#FFF5F5',
          border: '1px solid #FFEBEB',
          padding: '1rem 1.5rem',
          borderRadius: '6px',
          marginBottom: '2rem',
          color: 'var(--danger-red)',
          fontWeight: 500,
        }}>
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-white)',
          padding: '3rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {user.role === 'owner' ? 'No projects yet. Create your first interior site project to get started.' : 'No projects assigned to you yet. Hang tight.'}
          </p>
          {user.role === 'owner' && (
            <Link href="/projects/new">
              <button style={{
                padding: '0.8rem 1.6rem',
                backgroundColor: 'var(--text-dark)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              }}>
                Create Your First Project
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
              {/* Project Header */}
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.2rem' }}>{p.name}</h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {p.clientName} • {p.location}
              </p>

              {/* Project Dates */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span>{p.startDate ? new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                <span>—</span>
                <span>{p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
              </div>

              {/* Progress Bar */}
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

              {/* Status Badge & Actions */}
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
                
                {user?.role === 'owner' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/projects/edit/${p._id}`);
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'transparent',
                        color: 'var(--text-dark)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--text-dark)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-dark)';
                      }}>
                      Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this project forever?')) {
                          try {
                            await api.delete(`/projects/${p._id}`);
                            setProjects(projects.filter(proj => proj._id !== p._id));
                          } catch (err) {
                            setError(err.response?.data?.message || 'Delete failed');
                          }
                        }
                      }}
                      style={{
                        padding: '0.4rem 0.8rem',
                        backgroundColor: 'transparent',
                        color: 'var(--danger-red)',
                        border: '1px solid #FFEBEB',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--danger-red)';
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--danger-red)';
                      }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
