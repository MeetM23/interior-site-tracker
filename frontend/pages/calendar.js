import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const styles = {
  layout: { display: 'flex', height: 'calc(100vh - 100px)', gap: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  leftPanel: { width: '220px', display: 'flex', flexDirection: 'column', gap: '2rem' },
  mainPanel: { flex: 1, backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.04)' },
  rightPanel: { width: '320px', backgroundColor: '#fbfbfd', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.04)', overflowY: 'auto' },
  
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#1d1d1f' },
  dot: { width: '10px', height: '10px', borderRadius: '50%' },
  
  detailTitle: { fontSize: '1.2rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '0.5rem' },
  detailTag: { display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' },
  detailRow: { display: 'flex', flexDirection: 'column', marginBottom: '1rem' },
  detailLabel: { fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' },
  detailVal: { fontSize: '0.9rem', color: '#1d1d1f', fontWeight: 500 },
  
  btnOutlined: { width: '100%', padding: '0.6rem', fontSize: '0.85rem', fontWeight: 500, color: '#0071e3', backgroundColor: 'transparent', border: '1px solid #0071e3', borderRadius: '6px', cursor: 'pointer', marginBottom: '0.5rem' },
};

const getColorString = (colorStr) => {
  switch (colorStr) {
    case 'blue': return '#0071e3';
    case 'green': return '#34c759';
    case 'red': return '#ff3b30';
    case 'purple': return '#af52de';
    case 'grey': return '#8e8e93';
    default: return '#0071e3';
  }
};

const CustomEvent = ({ event }) => {
  const color = getColorString(event.color);
  return (
    <div style={{
      borderLeft: `4px solid ${color}`,
      padding: '2px 6px',
      backgroundColor: 'transparent',
      color: '#1d1d1f',
      fontSize: '0.8rem',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      width: '100%'
    }}>
      <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{event.title}</span>
      {event.assignedTo?.profilePhoto ? (
         <img src={event.assignedTo.profilePhoto} style={{width: '16px', height: '16px', borderRadius: '50%'}} alt="P" />
      ) : null}
    </div>
  );
};

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/calendar')
        .then(r => {
          const mapped = (r.data.data || []).map(e => ({
            ...e,
            start: new Date(e.date),
            end: new Date(e.date),
          }));
          setEvents(mapped);
        })
        .catch(e => console.error(e));
    }
  }, [user]);

  if (!user || loading) return null;



  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setSelectedDate(event.start);
  };

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setSelectedEvent(null);
  };

  const dayEvents = events.filter(e => new Date(e.date).toDateString() === selectedDate.toDateString());

  return (
    <div>
      <Head>
        <title>Calendar</title>
        <style>{`
          /* Override react-big-calendar defaults to match Apple style */
          .rbc-calendar { border: none !important; font-family: inherit; }
          .rbc-month-view { border: 1px solid #f2f2f7; border-radius: 8px; overflow: hidden; }
          .rbc-header { padding: 10px; font-weight: 600; color: #86868b; text-transform: uppercase; font-size: 0.75rem; border-bottom: 1px solid #f2f2f7; }
          .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f2f2f7; }
          .rbc-month-row + .rbc-month-row { border-top: 1px solid #f2f2f7; }
          .rbc-event { background-color: rgba(242, 242, 247, 0.6) !important; color: inherit !important; border: none; padding: 0 !important; border-radius: 4px; overflow: hidden; margin-bottom: 2px; }
          .rbc-event:hover { background-color: rgba(0, 113, 227, 0.1) !important; }
          .rbc-today { background-color: #fbfbfd; }
          .rbc-date-cell { padding: 4px 8px; font-size: 0.85rem; font-weight: 500; color: #1d1d1f; }
          .rbc-off-range-bg { background-color: #fafafa; }
          .rbc-btn-group button { border: 1px solid #d2d2d7; color: #1d1d1f; box-shadow: none; transition: background-color 0.2s; }
          .rbc-btn-group button.rbc-active { background-color: #f2f2f7; box-shadow: none; }
          .rbc-btn-group button:hover { background-color: #f2f2f7; }
          .rbc-toolbar button { font-family: inherit; border-radius: 6px; }
        `}</style>
      </Head>

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Calendar</h1>
          <p style={{ margin: 0, color: '#86868b' }}>Manage your company timelines across projects.</p>
        </div>
        

      </div>

      <div style={styles.layout}>
        
        {/* Left Legend */}
        <div style={styles.leftPanel}>
          <div>
            <h4 style={{ fontSize: '0.8rem', color: '#86868b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', marginTop: 0 }}>Legend</h4>
            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: getColorString('blue')}}/> Tasks</div>
            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: getColorString('green')}}/> Milestones</div>
            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: getColorString('red')}}/> Deadlines / Overdue</div>
            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: getColorString('purple')}}/> Meetings</div>
            <div style={styles.legendItem}><div style={{...styles.dot, backgroundColor: getColorString('grey')}}/> Completed</div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div style={styles.mainPanel}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month', 'week', 'agenda']}
            defaultView='month'
            components={{
              event: CustomEvent
            }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
          />
        </div>

        {/* Right Detail Panel */}
        <div style={styles.rightPanel}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #e5e5ea', paddingBottom: '0.5rem' }}>
            {selectedDate.toDateString()}
          </h3>
          
          {dayEvents.length === 0 ? (
            <p style={{ color: '#86868b', fontSize: '0.9rem' }}>No events scheduled for this day.</p>
          ) : (
            dayEvents.map(evt => (
              <div key={evt._id} style={{ 
                marginBottom: '1.5rem', 
                padding: '1rem', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                borderLeft: `3px solid ${getColorString(evt.color)}`,
                borderBottom: '1px solid #f2f2f7',
                borderRight: '1px solid #f2f2f7',
                borderTop: '1px solid #f2f2f7',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedEvent(evt)}
              >
              <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.3rem' }}>{evt.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase' }}>
                {evt.type} • {evt.projectName || 'Unknown Project'} 

              </div>
                {evt.status && (
                  <div style={{ marginTop: '0.5rem', display: 'inline-block', backgroundColor: '#f2f2f7', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                    Status: {evt.status.replace('_', ' ')}
                  </div>
                )}
              </div>
            ))
          )}

          {selectedEvent && (
            <div style={{ marginTop: '2rem', borderTop: '2px dashed #d2d2d7', paddingTop: '2rem' }}>
              <div style={{...styles.detailTag, backgroundColor: '#f2f2f7', color: getColorString(selectedEvent.color)}}>{selectedEvent.type}</div>
              <h2 style={styles.detailTitle}>{selectedEvent.title}</h2>
              

              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Project</span>
                <span style={styles.detailVal}>{selectedEvent.projectName || 'Unknown'}</span>
              </div>
              
              <div style={styles.detailRow}>
                 <span style={styles.detailLabel}>Date</span>
                 <span style={styles.detailVal}>{new Date(selectedEvent.date).toLocaleDateString()}</span>
              </div>

               <div style={styles.detailRow}>
                 <span style={styles.detailLabel}>Assigned To</span>
                 <span style={styles.detailVal}>{selectedEvent.assignedTo?.name || 'Unassigned'}</span>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button style={styles.btnOutlined} onClick={() => router.push(`/projects/${selectedEvent.projectId}`)}>Go to Project</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
