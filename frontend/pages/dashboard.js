import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const styles = {
  container: { padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '1.05rem', color: '#86868b', margin: 0 },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' },
  gridSummary: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  gridMain: { display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '1.5rem', alignItems: 'start' },
  summaryVal: { fontSize: '2.5rem', fontWeight: 700, margin: '1rem 0 0.5rem 0', letterSpacing: '-1px' },
  summaryLabel: { fontSize: '0.9rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  listItem: { padding: '1rem', borderBottom: '1px solid #f2f2f7', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tag: { padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' },
  notification: { padding: '1rem', borderBottom: '1px solid #f2f2f7', fontSize: '0.9rem', color: '#1d1d1f' }
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      api.get('/dashboard')
        .then(r => setData(r.data.data))
        .catch(e => setError(e.response?.data?.message || 'Error loading dashboard'))
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div style={styles.container}>
      <Head><title>Dashboard</title></Head>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard Overview</h1>
        <p style={styles.subtitle}>Welcome back, {user.name.split(' ')[0]}. Here is what is happening across your workspace.</p>
      </div>

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#86868b' }}>Loading metrics...</div>
      ) : error ? (
        <div style={{ color: '#ff3b30', backgroundColor: '#fff0f0', padding: '1rem', borderRadius: '8px' }}>{error}</div>
      ) : data ? (
        <>
          {/* Top Summary Cards */}
          <div style={styles.gridSummary}>
            <div style={styles.card}>
              <div style={styles.summaryLabel}>Total Projects</div>
              <div style={{...styles.summaryVal, color: '#1d1d1f'}}>{data.summary.total}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.summaryLabel}>Active</div>
              <div style={{...styles.summaryVal, color: '#0071e3'}}>{data.summary.active}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.summaryLabel}>Completed</div>
              <div style={{...styles.summaryVal, color: '#34c759'}}>{data.summary.completed}</div>
            </div>
            <div style={styles.card}>
              <div style={styles.summaryLabel}>Delayed</div>
              <div style={{...styles.summaryVal, color: '#ff3b30'}}>{data.summary.delayed}</div>
            </div>
          </div>

          {/* 3 Column Grid for Alerts, Today, Notifications */}
          <div style={styles.gridMain}>
            
            {/* L1: Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>
                  Deadline Alerts
                  <span style={{ backgroundColor: '#ffcece', color: '#ff3b30', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>{data.alerts.deadlines.length}</span>
                </h3>
                <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                  {data.alerts.deadlines.length === 0 ? <p style={{color: '#86868b', fontSize: '0.9rem'}}>All clear!</p> : null}
                  {data.alerts.deadlines.map((alert, i) => (
                    <div key={i} style={styles.listItem} onClick={() => router.push(`/projects/${alert.projectId}`)} className="hover-item">
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{alert.title}</span>
                        <span style={{ ...styles.tag, backgroundColor: alert.type === 'overdue' ? '#ffcece' : '#fff5cc', color: alert.type === 'overdue' ? '#ff3b30' : '#d97706' }}>
                          {alert.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#86868b' }}>{alert.project}</div>
                      <div style={{ fontSize: '0.8rem', color: '#1d1d1f' }}>Due: {new Date(alert.date).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Project Status Alerts</h3>
                <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                  {data.alerts.status.length === 0 ? <p style={{color: '#86868b', fontSize: '0.9rem'}}>No project issues.</p> : null}
                  {data.alerts.status.map((alert, i) => (
                    <div key={i} style={styles.listItem} onClick={() => router.push(`/projects/${alert.id}`)} className="hover-item">
                       <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{alert.title}</span>
                       <span style={{ fontSize: '0.8rem', color: '#ff3b30', fontWeight: 500 }}>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* M1: Today's Work */}
            <div style={{...styles.card, minHeight: '600px'}}>
              <h3 style={styles.sectionTitle}>Today's Work <span style={{fontWeight: 400, color: '#86868b', fontSize: '0.9rem'}}>{new Date().toDateString()}</span></h3>
              
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#86868b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Tasks Scheduled</div>
                {data.todayWork.tasks.length === 0 ? <p style={{color: '#86868b', fontSize: '0.9rem', fontStyle: 'italic'}}>No tasks due today.</p> : null}
                {data.todayWork.tasks.map((task, i) => (
                   <div key={Math.random()} style={{...styles.listItem, borderLeft: '4px solid #0071e3', paddingLeft: '1rem', backgroundColor: '#f9f9f9', borderRadius: '0 8px 8px 0', marginBottom: '0.5rem', cursor: 'pointer'}} onClick={() => router.push(`/projects/${task.projectId}`)}>
                     <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{task.title}</div>
                     <div style={{ fontSize: '0.8rem', color: '#86868b' }}>Project: {task.project}</div>
                   </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#86868b', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Milestones Target</div>
                {data.todayWork.milestones.length === 0 ? <p style={{color: '#86868b', fontSize: '0.9rem', fontStyle: 'italic'}}>No milestones hitting target today.</p> : null}
                {data.todayWork.milestones.map((m, i) => (
                   <div key={Math.random()} style={{...styles.listItem, borderLeft: '4px solid #34c759', paddingLeft: '1rem', backgroundColor: '#f9f9f9', borderRadius: '0 8px 8px 0', marginBottom: '0.5rem', cursor: 'pointer'}} onClick={() => router.push(`/projects/${m.projectId}`)}>
                     <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{m.title}</div>
                     <div style={{ fontSize: '0.8rem', color: '#86868b' }}>Project: {m.project}</div>
                   </div>
                ))}
              </div>
            </div>

            {/* R1: Notifications */}
            <div style={{...styles.card, minHeight: '600px', backgroundColor: '#fbfbfd'}}>
              <h3 style={styles.sectionTitle}>Global Feed</h3>
              <div style={{ overflowY: 'auto', maxHeight: '700px', paddingRight: '0.5rem' }}>
                {data.notifications.length === 0 ? <p style={{color: '#86868b', fontSize: '0.9rem'}}>No recent activity.</p> : null}
                {data.notifications.map((n, i) => (
                  <div key={i} style={styles.notification}>
                    <div style={{ fontSize: '0.75rem', color: '#86868b', marginBottom: '0.3rem' }}>
                      {new Date(n.createdAt).toLocaleString()} • {n.createdBy?.name || 'System'}
                    </div>
                    <div>{n.notes}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0071e3', marginTop: '0.3rem', cursor: 'pointer' }} onClick={() => router.push(`/projects/${n.projectId}`)}>
                      {n.project}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : null}
      
      <style>{`
        .hover-item { cursor: pointer; transition: background-color 0.2s; }
        .hover-item:hover { background-color: #fbfbfd; }
      `}</style>
    </div>
  );
}
