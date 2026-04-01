import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [task, setTask] = useState({ name: '', assignedTo: '', deadline: '' });
  const [updateNotes, setUpdateNotes] = useState('');
  const [files, setFiles] = useState(null);
  const [team, setTeam] = useState([]);
  const [loadingProject, setLoadingProject] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  // Gallery state
  const [galleryFiles, setGalleryFiles] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (user?.role === 'owner') {
      api.get('/users').then(r => setTeam(r.data.data || [])).catch(() => {});
    }
  }, [user, loading, router]);

  // Construct dynamic upload base
  const uploadBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/uploads/';

  const fetchProject = async () => {
    try {
      if (!id) return;
      setLoadingProject(true);
      const r = await api.get(`/projects/${id}`);
      setProject(r.data?.data || null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to load project';
      setError(msg);
    } finally {
      setLoadingProject(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id, user]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      setSavingTask(true);
      await api.post(`/projects/${id}/tasks`, task);
      setTask({ name: '', assignedTo:'', deadline:'' });
      await fetchProject();
    } catch (err) {
      const msg = err.response?.data?.message || 'Task add failed';
      setError(msg);
    } finally {
      setSavingTask(false);
    }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/projects/${id}/tasks/${taskId}`, { status });
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Task update failed');
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('notes', updateNotes);
      if (files) {
        Array.from(files).forEach(file => form.append('files', file));
      }
      await api.post(`/projects/${id}/updates`, form, { headers: {'Content-Type':'multipart/form-data'} });
      setUpdateNotes(''); setFiles(null);
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleUploadGallery = async (e) => {
    e.preventDefault();
    if (!galleryFiles) return;
    try {
      setUploadingGallery(true);
      const form = new FormData();
      Array.from(galleryFiles).forEach(f => form.append('photos', f));
      if (galleryCaption) form.append('caption', galleryCaption);
      await api.post(`/projects/${id}/gallery`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGalleryFiles(null);
      setGalleryCaption('');
      fetchProject();
    } catch (err) {
      setError(err.response?.data?.message || 'Gallery upload failed');
    } finally {
      setUploadingGallery(false);
    }
  };

  if (!user) return <p>Loading...</p>;
  if (!project) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading project details...</p>
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

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'var(--success-green)';
      case 'in_progress': return 'var(--primary-orange)';
      case 'delayed': return 'var(--danger-red)';
      default: return 'var(--text-muted)';
    }
  };

  const progress = project.completionPercent || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>{project.name}</h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>
              {project.clientName} • {project.location}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: getStatusColor(project.status) + '20',
              color: getStatusColor(project.status),
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {project.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </div>
            
            {user?.role === 'owner' && (
              <>
                <button
                  onClick={() => router.push(`/projects/edit/${id}`)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: 'var(--bg-white)',
                    color: 'var(--text-dark)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--text-dark)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-white)';
                    e.currentTarget.style.color = 'var(--text-dark)';
                  }}>
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                      try {
                        await api.delete(`/projects/${id}`);
                        router.push('/projects');
                      } catch (err) {
                        setError(err.response?.data?.message || 'Delete failed');
                      }
                    }
                  }}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: '#FFF5F5',
                    color: 'var(--danger-red)',
                    border: '1px solid #FFEBEB',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--danger-red)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFF5F5';
                    e.currentTarget.style.color = 'var(--danger-red)';
                  }}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
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

      {/* Project Info Card */}
      <div style={{
        backgroundColor: 'var(--bg-white)',
        borderRadius: '8px',
        padding: '2rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Start Date</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{project.startDate ? project.startDate.split('T')[0] : 'TBD'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: '0 0 0.5rem 0' }}>End Date</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{project.endDate ? project.endDate.split('T')[0] : 'TBD'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Budget</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>${project.budget || 'Not set'}</p>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Progress</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(project.status) }}>{progress}%</span>
          </div>
          <div style={{
            height: '8px',
            backgroundColor: 'var(--border-light)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: getStatusColor(project.status),
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Site Imagery Gallery */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Site Imagery Gallery
        </h2>

        {/* Gallery Grid */}
        {project.gallery && project.gallery.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem'
          }}>
             {project.gallery.map(g => (
               <div key={g._id} style={{
                  backgroundColor: 'var(--bg-white)', borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease',
                  cursor: 'pointer'
               }} 
               onClick={() => setActiveImage(g.url)}
               onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}>
                     <img src={g.url} alt="Site capture" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1rem' }}>
                     {g.caption && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{g.caption}</p>}
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {g.uploadedBy?.profilePhoto ? (
                           <img src={g.uploadedBy.profilePhoto} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                           <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--text-dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold' }}>
                             {g.uploadedBy?.name?.charAt(0) || '?'}
                           </div>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.uploadedBy?.name} • {new Date(g.createdAt).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* Upload Form */}
        <div style={{ backgroundColor: 'var(--bg-white)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
           <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Upload Physical Evidence</h3>
           <form onSubmit={handleUploadGallery} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <input type="file" multiple accept="image/*" required onChange={e => setGalleryFiles(e.target.files)} 
                 style={{ padding: '0.6rem', border: '1px dashed var(--border-light)', borderRadius: '6px', flex: '1 1 200px' }} />
              <input type="text" placeholder="Caption (e.g., HVAC setup completed)" value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} 
                 style={{ padding: '0.7rem 1rem', border: '1px solid var(--border-light)', borderRadius: '6px', flex: '2 1 300px' }} />
              <button type="submit" disabled={uploadingGallery} style={{
                 padding: '0.7rem 1.5rem', backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none', borderRadius: '6px',
                 fontWeight: 600, cursor: uploadingGallery ? 'not-allowed' : 'pointer'
              }}>
                 {uploadingGallery ? 'Uploading...' : 'Push to Gallery'}
              </button>
           </form>
        </div>
      </div>

      {/* Milestones Timeline */}
      {project.milestones && project.milestones.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Milestones
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem',
          }}>
            {project.milestones.map((m, idx) => (
              <div key={m._id} style={{
                backgroundColor: 'var(--bg-white)',
                borderRadius: '8px',
                padding: '1.5rem',
                border: '1px solid var(--border-light)',
                borderLeft: `3px solid ${m.status === 'completed' ? 'var(--success-green)' : m.status === 'delayed' ? 'var(--danger-red)' : 'var(--primary-orange)'}`,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{m.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {m.targetDate ? `Target: ${new Date(m.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No target date'}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.8rem',
                    backgroundColor: (m.status === 'completed' ? 'var(--success-green)' : m.status === 'delayed' ? 'var(--danger-red)' : 'var(--primary-orange)') + '20',
                    color: m.status === 'completed' ? 'var(--success-green)' : m.status === 'delayed' ? 'var(--danger-red)' : 'var(--primary-orange)',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {m.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Tasks
        </h2>

        {/* Task List */}
        {project.tasks && project.tasks.length > 0 && (
          <div style={{
            display: 'grid',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            {project.tasks.map(t => (
              <div key={t._id} style={{
                backgroundColor: 'var(--bg-white)',
                borderRadius: '8px',
                padding: '1.5rem',
                border: '1px solid var(--border-light)',
                borderLeft: `3px solid ${getTaskStatusColor(t.status)}`,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem' }}>{t.name}</h3>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {t.assignedTo && <span>Owner: {t.assignedTo.name}</span>}
                      {t.deadline && <span>Due: {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.8rem',
                    backgroundColor: getTaskStatusColor(t.status) + '20',
                    color: getTaskStatusColor(t.status),
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap',
                  }}>
                    {t.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['pending','in_progress','completed','delayed'].map(s => (
                    <button
                      key={s}
                      disabled={t.status === s}
                      onClick={() => handleTaskStatus(t._id, s)}
                      style={{
                        padding: '0.6rem 1rem',
                        border: `1px solid ${t.status === s ? getTaskStatusColor(s) : 'var(--border-light)'}`,
                        borderRadius: '6px',
                        backgroundColor: t.status === s ? getTaskStatusColor(s) + '10' : 'transparent',
                        color: t.status === s ? getTaskStatusColor(s) : 'var(--text-muted)',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        cursor: t.status === s ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize',
                      }}
                      onMouseEnter={(e) => {
                        if (t.status !== s) {
                          e.currentTarget.style.borderColor = getTaskStatusColor(s);
                          e.currentTarget.style.backgroundColor = getTaskStatusColor(s) + '10';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (t.status !== s) {
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}>
                      {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Task Form */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          borderRadius: '8px',
          padding: '2rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Add New Task</h3>
          <form onSubmit={handleAddTask}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <input
                value={task.name}
                onChange={e => setTask({...task, name: e.target.value})}
                required
                placeholder="Task name"
                style={{
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
              <input
                value={task.deadline}
                onChange={e => setTask({...task, deadline: e.target.value})}
                type="date"
                style={{
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                }}
              />
              <select
                value={task.assignedTo}
                onChange={e => setTask({...task, assignedTo: e.target.value})}
                style={{
                  padding: '0.9rem 1.1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">-- Unassigned --</option>
                {user?.role === 'owner' ? (
                  team.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)
                ) : (
                  <option value={user?._id}>Myself ({user?.name})</option>
                )}
              </select>
            </div>
            <button
              type="submit"
              disabled={savingTask}
              style={{
                padding: '0.9rem 1.8rem',
                backgroundColor: 'var(--text-dark)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: savingTask ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: savingTask ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!savingTask) {
                  e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              }}>
              {savingTask ? 'Adding...' : '+ Add Task'}
            </button>
          </form>
        </div>
      </div>

      {/* Updates Section */}
      <div>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Updates
        </h2>

        {/* Update Feed */}
        {project.updates && project.updates.length > 0 && (
          <div style={{
            display: 'grid',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            {project.updates.map(u => (
              <div key={u._id} style={{
                backgroundColor: 'var(--bg-white)',
                borderRadius: '8px',
                padding: '1.5rem',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-dark)' }}>{u.createdBy?.name}</p>
                  <time style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6, color: 'var(--text-dark)' }}>{u.notes}</p>
                {u.images && u.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                    {u.images.map(img => (
                      <div
                        key={img}
                        onClick={() => setActiveImage(uploadBase + img)}
                        style={{
                          cursor: 'pointer',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          aspectRatio: '1',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}>
                        <img
                           src={uploadBase + img}
                          alt="update"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Post Update Form */}
        <div style={{
          backgroundColor: 'var(--bg-white)',
          borderRadius: '8px',
          padding: '2rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Post An Update</h3>
          <form onSubmit={handleUpdatePost}>
            <div style={{ marginBottom: '1.5rem' }}>
              <textarea
                value={updateNotes}
                onChange={e => setUpdateNotes(e.target.value)}
                required
                placeholder="Share progress, findings, or next steps..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '1rem',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                Upload Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => setFiles(e.target.files)}
                style={{
                  padding: '0.75rem',
                  border: '1px dashed var(--border-light)',
                  borderRadius: '8px',
                  width: '100%',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.9rem 1.8rem',
                backgroundColor: 'var(--text-dark)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              }}>
              Post Update
            </button>
          </form>
        </div>
      </div>

      {/* Image Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
          }}>
          <div style={{
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
          }}>
            <img
              src={activeImage}
              alt="full"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '8px',
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage(null);
              }}
              style={{
                position: 'absolute',
                top: '-3rem',
                right: 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
