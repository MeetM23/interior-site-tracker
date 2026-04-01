import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const days = [];
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
  return days;
}

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      setLoadingCalendar(true);
      try {
        const resp = await api.get('/projects');
        setProjects(resp.data?.data || []);
      } catch {
        setProjects([]);
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchProjects();
  }, [user]);

  const eventsByDate = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      if (p.endDate) {
        const key = new Date(p.endDate).toLocaleDateString();
        map[key] = map[key] || [];
        map[key].push({ type: 'project', name: p.name, status: p.status, id: p._id });
      }
      (p.tasks || []).forEach(t => {
        if (t.deadline) {
          const key = new Date(t.deadline).toLocaleDateString();
          map[key] = map[key] || [];
          map[key].push({ type: 'task', name: t.name, status: t.status, projectId: p._id });
        }
      });
    });
    return map;
  }, [projects]);

  if (!user) return <p>Loading...</p>;
  if (loadingCalendar) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading calendar...</p>
      </div>
    );
  }

  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const today = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventColor = (type, status) => {
    if (type === 'task') {
      switch (status) {
        case 'completed': return 'var(--success-green)';
        case 'in_progress': return 'var(--primary-orange)';
        case 'delayed': return 'var(--danger-red)';
        default: return 'var(--text-muted)';
      }
    }
    // project
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'on_track': return 'var(--primary-orange)';
      case 'at_risk': return 'var(--warning-yellow)';
      case 'delayed': return 'var(--danger-red)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Calendar</h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
          Track project milestones and task deadlines
        </p>
      </div>

      {/* Controls */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={handlePrevMonth}
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-beige)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
          Previous
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>
            {monthName} {year}
          </h2>
          <button
            onClick={handleToday}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--text-dark)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              fontSize: '0.9rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-dark)';
            }}>
            Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          style={{
            padding: '0.6rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-beige)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}>
          Next
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}>
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
            <div
              key={d}
              style={{
                fontWeight: 700,
                textAlign: 'center',
                padding: '0.75rem',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
              {d.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
        }}>
          {days.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    minHeight: '120px',
                    backgroundColor: 'var(--bg-beige)',
                    borderRadius: '8px',
                  }}
                />
              );
            }
            const key = day.toLocaleDateString();
            const events = eventsByDate[key] || [];
            const isToday = day.toDateString() === today.toDateString();
            const dayNum = day.getDate();

            return (
              <div
                key={key}
                style={{
                  border: isToday ? '1px solid var(--primary-orange)' : '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  backgroundColor: isToday ? 'var(--bg-beige)' : 'var(--bg-white)',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Day Number */}
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: isToday ? 'var(--primary-orange)' : 'var(--text-dark)',
                  marginBottom: '0.6rem',
                }}>
                  {dayNum}
                </div>

                {/* Events */}
                {events.length === 0 ? (
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                  }}>
                    —
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {events.slice(0, 3).map((event, i) => (
                      <div
                        key={`${key}-${i}`}
                        onClick={() => {
                          if (event.type === 'project') {
                            router.push(`/projects/${event.id}`);
                          } else if (event.projectId) {
                            router.push(`/projects/${event.projectId}`);
                          }
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.5rem',
                          backgroundColor: getEventColor(event.type, event.status) + '20',
                          color: getEventColor(event.type, event.status),
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s ease',
                        }}
                        title={event.name}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}>
                          {event.name}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}>
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {projects.length === 0 && (
        <div style={{
          marginTop: '2rem',
          backgroundColor: 'var(--bg-white)',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
            No projects yet. Create your first project to see deadlines on the calendar.
          </p>
        </div>
      )}
    </div>
  );
}
