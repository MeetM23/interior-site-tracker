import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

export default function ProfileView({ userId }) {
  const router = useRouter();
  const { user: authedUser } = useAuth(); // The currently logged in user
  
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [updateMsg, setUpdateMsg] = useState('');

  // Form states specifically for settings tab
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!userId) return;
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const userRes = await api.get(`/users/${userId}`);
        const pData = userRes.data?.data;
        setProfile(pData);
        setFormData({
          phone: pData.phone || '',
          businessInfo: {
            companyName: pData.businessInfo?.companyName || '',
            address: pData.businessInfo?.address || '',
            gst: pData.businessInfo?.gst || '',
            website: pData.businessInfo?.website || ''
          },
          designerInfo: {
            roleType: pData.designerInfo?.roleType || '',
            specialization: pData.designerInfo?.specialization || ''
          },
          settings: {
            alertDelays: pData.settings?.alertDelays ?? true,
            alertDeadlines: pData.settings?.alertDeadlines ?? true
          }
        });

        const projRes = await api.get('/projects');
        const allProj = projRes.data?.data || [];
        
        if (pData.role === 'owner') {
           setProjects(allProj);
        } else {
           const userProj = allProj.filter(p => {
             const id = p.assignedDesigner?._id || p.assignedDesigner;
             return id === userId;
           });
           setProjects(userProj);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading interface...</p>
      </div>
    );
  }

  if (!profile) {
    return <p style={{ color: 'var(--danger-red)', fontWeight: 500 }}>Failed to load profile. Ensure you have the right access permissions.</p>;
  }

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdateMsg('');
    try {
      await api.put(`/users/${userId}`, formData);
      setUpdateMsg('Profile settings updated successfully.');
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      setUpdateMsg(err.response?.data?.message || 'Failed to update settings');
    }
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('photo', file);
    try {
       setUpdateMsg('Uploading photo...');
       const res = await api.post('/users/photo', uploadData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       setProfile(prev => ({ ...prev, profilePhoto: res.data.photoUrl }));
       setUpdateMsg('Photo updated. (Refresh to see globally)');
       setTimeout(() => setUpdateMsg(''), 3000);
    } catch(err) {
       setUpdateMsg('Photo upload failed.');
    }
  };

  // Metrics
  const activeProjects = projects.filter(p => ['on_track', 'at_risk', 'delayed'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');
  const delayedProjects = projects.filter(p => p.status === 'delayed');

  // Task metrics for designers
  let tasksCompleted = 0;
  let tasksPending = 0;
  projects.forEach(p => {
     p.tasks?.forEach(t => {
       if (t.assignedTo?._id === userId || t.assignedTo === userId || profile.role === 'owner') {
          if (t.status === 'completed') tasksCompleted++;
          else tasksPending++;
       }
     });
  });
  const totalTasks = tasksCompleted + tasksPending;
  const onTimePercent = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  // Gathering all recent updates across assigned projects for the Activity tab
  const allUpdates = projects.flatMap(p => 
     (p.updates || [])
       .filter(u => u.createdBy?._id === userId || u.createdBy === userId)
       .map(u => ({ ...u, projectName: p.name, projectId: p._id }))
  ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const isSelf = authedUser?._id === userId;

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Profile Header Block */}
      <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-white)',
          padding: '2.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
           <div style={{ position: 'relative' }}>
             {profile.profilePhoto ? (
               <img src={profile.profilePhoto} alt={profile.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
             ) : (
               <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--text-dark)', 
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-heading)'
               }}>
                  {profile.name.charAt(0).toUpperCase()}
               </div>
             )}
             {isSelf && (
               <label style={{
                 position: 'absolute', bottom: '-5px', right: '-5px', backgroundColor: 'var(--primary-orange)',
                 color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                 alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem', border: '2px solid white'
               }} title="Upload new photo">
                 +
                 <input type="file" accept="image/*" hidden onChange={handleUploadPhoto} />
               </label>
             )}
           </div>
           <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h1 style={{ color: 'var(--text-dark)', margin: '0 0 0.5rem 0', fontSize: 'clamp(2rem, 3.5vw, 2.5rem)' }}>{profile.name}</h1>
                {updateMsg && <span style={{ fontSize: '0.9rem', color: updateMsg.includes('failed') ? 'var(--danger-red)' : 'var(--success-green)', fontWeight: 500 }}>{updateMsg}</span>}
              </div>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.05rem' }}>
                {profile.role === 'owner' ? 'Admin & Owner' : profile.designerInfo?.roleType || 'Staff Designer'} 
                <span style={{ margin: '0 0.5rem' }}>•</span> {profile.email}
                {profile.phone && <><span style={{ margin: '0 0.5rem' }}>•</span> {profile.phone}</>}
              </p>
           </div>
         </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2.5rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2.5rem' }}>
         {['profile', 'projects', 'activity', 'settings'].map(t => (
           <button key={t} onClick={() => setActiveTab(t)} style={{
             background: 'none', border: 'none', padding: '0 0 1rem 0', cursor: 'pointer',
             fontSize: '1.05rem', fontWeight: activeTab === t ? 600 : 500,
             color: activeTab === t ? 'var(--primary-orange)' : 'var(--text-muted)',
             borderBottom: activeTab === t ? '2px solid var(--primary-orange)' : '2px solid transparent',
             textTransform: 'capitalize',
             transition: 'all 0.2s ease'
           }}>{t}</button>
         ))}
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          
          {/* Owner specifics */}
          {profile.role === 'owner' && (
            <div style={{ padding: '2rem', backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Business Info</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-muted)' }}>
                <div><strong style={{color:'var(--text-dark)'}}>Company:</strong> {profile.businessInfo?.companyName || 'Not Set'}</div>
                <div><strong style={{color:'var(--text-dark)'}}>GST No:</strong> {profile.businessInfo?.gst || 'Not Set'}</div>
                <div><strong style={{color:'var(--text-dark)'}}>Website:</strong> {profile.businessInfo?.website || 'Not Set'}</div>
                <div><strong style={{color:'var(--text-dark)'}}>Address:</strong> {profile.businessInfo?.address || 'Not Set'}</div>
              </div>
            </div>
          )}

          {/* Designer specifics */}
          {profile.role !== 'owner' && (
            <div style={{ padding: '2rem', backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
               <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Professional Skills</h2>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: 'var(--text-muted)' }}>
                  <div><strong style={{color:'var(--text-dark)'}}>Role Type:</strong> {profile.designerInfo?.roleType || 'Interior Designer'}</div>
                  <div><strong style={{color:'var(--text-dark)'}}>Specialization:</strong> {profile.designerInfo?.specialization || 'Generalist'}</div>
               </div>
            </div>
          )}

          {/* Activity Overview Block */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Overall Coverage</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Projects</p>
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{projects.length}</h2>
              </div>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Ongoing</p>
                  <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{activeProjects.length}</h2>
              </div>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Completed</p>
                  <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--success-green)' }}>{completedProjects.length}</h2>
              </div>
            </div>
          </div>

          {/* Performance Block (Designers focus Heavily on this) */}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Task Performance Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Tasks Pending</p>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>{tasksPending}</h2>
              </div>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Tasks Competed</p>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}>{tasksCompleted}</h2>
              </div>
              <div style={{ padding: '1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px', backgroundColor: 'var(--bg-white)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>On-Time Rate</p>
                  <h2 style={{ fontSize: '2rem', margin: 0, color: onTimePercent > 80 ? 'var(--success-green)' : 'var(--text-dark)' }}>{onTimePercent}%</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROJECTS */}
      {activeTab === 'projects' && (
        <div>
           <div style={{ display: 'grid', gap: '1rem' }}>
             {projects.length === 0 ? <p>No projects assigned.</p> : projects.map(p => (
                <div key={p._id} onClick={() => router.push(`/projects/${p._id}`)} 
                style={{ padding: '1.5rem', backgroundColor: 'var(--bg-white)', borderRadius: '8px', border: '1px solid var(--border-light)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h3 style={{ margin: '0 0 0.25rem 0' }}>{p.name}</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.clientName} • {p.location}</p>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', color: p.status === 'completed' ? 'var(--success-green)' : p.status==='delayed'?'var(--danger-red)':'var(--primary-orange)' }}>
                         {p.status.replace('_', ' ')}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{p.completionPercent || 0}% Done</p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY */}
      {activeTab === 'activity' && (
        <div>
           {allUpdates.length === 0 ? <p>No recent activity found.</p> : (
             <div style={{ 
               backgroundColor: 'var(--bg-white)', 
               borderRadius: '10px', 
               border: '1px solid var(--border-light)',
               padding: '2rem' 
             }}>
               {allUpdates.slice(0, 15).map((upd, idx) => (
                  <div key={idx} style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: idx !== allUpdates.length-1 ? '1px solid var(--border-light)' : 'none' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Updated <strong>{upd.projectName}</strong> • {new Date(upd.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-dark)' }}>{upd.notes}</p>
                  </div>
               ))}
             </div>
           )}
        </div>
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleUpdateSettings}>
           <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Basic Settings</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Phone Number</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', maxWidth: '400px' }} disabled={!isSelf} />
                 </div>
              </div>
           </div>

           {profile.role === 'owner' && (
             <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Business Profile</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Company Name</label>
                      <input type="text" value={formData.businessInfo.companyName} onChange={e => setFormData({...formData, businessInfo: {...formData.businessInfo, companyName: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf} />
                   </div>
                   <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>GST Number</label>
                      <input type="text" value={formData.businessInfo.gst} onChange={e => setFormData({...formData, businessInfo: {...formData.businessInfo, gst: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf} />
                   </div>
                   <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Website</label>
                      <input type="text" value={formData.businessInfo.website} onChange={e => setFormData({...formData, businessInfo: {...formData.businessInfo, website: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf} />
                   </div>
                   <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Business Address</label>
                      <textarea rows={3} value={formData.businessInfo.address} onChange={e => setFormData({...formData, businessInfo: {...formData.businessInfo, address: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf} />
                   </div>
                </div>
             </div>
           )}

           {profile.role !== 'owner' && (
             <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Professional Profile</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Role Type</label>
                      <input type="text" placeholder="e.g. Site Supervisor" value={formData.designerInfo.roleType} onChange={e => setFormData({...formData, designerInfo: {...formData.designerInfo, roleType: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf && authedUser?.role !== 'owner'} />
                   </div>
                   <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Specialization</label>
                      <input type="text" placeholder="e.g. Kitchen Design" value={formData.designerInfo.specialization} onChange={e => setFormData({...formData, designerInfo: {...formData.designerInfo, specialization: e.target.value}})} style={{ width: '100%' }} disabled={!isSelf && authedUser?.role !== 'owner'} />
                   </div>
                </div>
             </div>
           )}

           <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '10px', border: '1px solid var(--border-light)', padding: '2rem', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Notification Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: isSelf ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={formData.settings.alertDelays} onChange={e => setFormData({...formData, settings: {...formData.settings, alertDelays: e.target.checked}})} disabled={!isSelf} style={{ width: '18px', height: '18px', accentColor: 'var(--primary-orange)' }} />
                    <span style={{ fontSize: '1.05rem' }}>Alert me for project delays</span>
                 </label>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: isSelf ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={formData.settings.alertDeadlines} onChange={e => setFormData({...formData, settings: {...formData.settings, alertDeadlines: e.target.checked}})} disabled={!isSelf} style={{ width: '18px', height: '18px', accentColor: 'var(--primary-orange)' }} />
                    <span style={{ fontSize: '1.05rem' }}>Deadline reminders / Active warnings</span>
                 </label>
              </div>
           </div>

           {(isSelf || authedUser?.role === 'owner') && (
             <div>
                <button type="submit" style={{ padding: '1rem 2.5rem', backgroundColor: 'var(--text-dark)', color: 'white', borderRadius: '6px', fontSize: '1rem', fontWeight: 600 }}>Save Changes</button>
                {updateMsg && <span style={{ marginLeft: '1rem', color: updateMsg.includes('Failed') ? 'var(--danger-red)' : 'var(--success-green)', fontWeight: 500 }}>{updateMsg}</span>}
             </div>
           )}
        </form>
      )}

    </div>
  );
}
