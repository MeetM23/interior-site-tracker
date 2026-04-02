import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  header: { marginBottom: '2.5rem' },
  title: { fontSize: '2rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '1.05rem', color: '#86868b', margin: 0 },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)' },
  cardTitle: { fontSize: '1.2rem', fontWeight: 600, color: '#1d1d1f', marginBottom: '1.5rem', letterSpacing: '-0.01em', borderBottom: '1px solid #f2f2f7', paddingBottom: '0.75rem' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  label: { display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#515154', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', color: '#1d1d1f', backgroundColor: '#fbfbfd', border: '1px solid #d2d2d7', borderRadius: '10px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', color: '#1d1d1f', backgroundColor: '#fbfbfd', border: '1px solid #d2d2d7', borderRadius: '10px', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box', minHeight: '100px', resize: 'vertical' },
  select: { width: '100%', padding: '0.85rem 1rem', fontSize: '0.95rem', color: '#1d1d1f', backgroundColor: '#fbfbfd', border: '1px solid #d2d2d7', borderRadius: '10px', outline: 'none', appearance: 'none', boxSizing: 'border-box' },
  fileZone: { border: '2px dashed #d2d2d7', borderRadius: '12px', padding: '2rem', textAlign: 'center', backgroundColor: '#fbfbfd', cursor: 'pointer', transition: 'all 0.2s' },
  btnPrimary: { padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 500, color: '#ffffff', backgroundColor: '#0071e3', border: 'none', borderRadius: '9px', cursor: 'pointer', transition: 'background-color 0.2s', letterSpacing: '-0.01em' },
  btnSecondary: { padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 500, color: '#1d1d1f', backgroundColor: '#f5f5f7', border: '1px solid #d2d2d7', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s' },
  btnOutlined: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#0071e3', backgroundColor: 'transparent', border: '1px solid #0071e3', borderRadius: '6px', cursor: 'pointer' },
  btnDanger: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#ff3b30', backgroundColor: 'rgba(255, 59, 48, 0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  taskCard: { padding: '1.2rem', border: '1px solid #e5e5ea', borderRadius: '10px', marginBottom: '1rem', backgroundColor: '#fafafa' },
  hint: { fontSize: '0.8rem', color: '#86868b', marginTop: '0.3rem' }
};

const InputField = ({ label, name, value, onChange, type = "text", required, ...props }) => (
  <div>
    <label style={styles.label}>{label} {required && <span style={{color: '#ff3b30'}}>*</span>}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      style={styles.input}
      onFocus={(e) => e.target.style.borderColor = '#0071e3'}
      onBlur={(e) => e.target.style.borderColor = '#d2d2d7'}
      {...props}
    />
  </div>
);

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', projectType: 'Residential', projectCategory: 'Interior', description: '',
    clientName: '', clientPhone: '', clientEmail: '', clientAddress: '', alternateContact: '', clientNotes: '',
    location: '', city: '', state: '', mapsLink: '', siteSize: '',
    budget: 0, spentBudget: 0,
    startDate: '', endDate: '',
    milestones: [
      { name: 'Design Phase', status: 'pending' },
      { name: 'Material Procurement', status: 'pending' },
      { name: 'Execution', status: 'pending' },
      { name: 'Final Handover', status: 'pending' }
    ],
    projectManager: '', assignedDesigner: '', siteSupervisor: '', workersVendors: [],
    status: 'not_started', autoProgress: true, completionPercent: 0,
    tasks: []
  });

  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      api.get('/users').then(r => setUsers(r.data?.data || [])).catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) });
  };

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...form.tasks];
    newTasks[index][field] = value;
    setForm({ ...form, tasks: newTasks });
  };

  const addTask = () => {
    setForm({ ...form, tasks: [...form.tasks, { name: '', assignedTo: '', deadline: '', status: 'pending', priority: 'Medium' }] });
  };

  const removeTask = (index) => {
    setForm({ ...form, tasks: form.tasks.filter((_, i) => i !== index) });
  };

  const handleMilestoneChange = (index, field, value) => {
    const newMilestones = [...form.milestones];
    newMilestones[index][field] = value;
    setForm({ ...form, milestones: newMilestones });
  };

  const addMilestone = () => {
    setForm({ ...form, milestones: [...form.milestones, { name: '', targetDate: '', status: 'pending' }] });
  };

  const removeMilestone = (index) => {
    setForm({ ...form, milestones: form.milestones.filter((_, i) => i !== index) });
  };

  const handleWorkersChange = (e) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
        if (options[i].selected && options[i].value !== "") values.push(options[i].value);
    }
    setForm({ ...form, workersVendors: values });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setDocuments([...documents, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(form));
      documents.forEach(doc => {
        fd.append('documents', doc);
      });

      await api.post('/projects', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const remainingBudget = form.budget - form.spentBudget;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Create New Project</h1>
        <p style={styles.subtitle}>Initialize a new workspace with synced budgets, teams, and timelines.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fff0f0', color: '#ff3b30', padding: '1rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #ffcece', fontWeight: 500 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. PROJECT INFORMATION */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>1. Project Information</h2>
          <div style={styles.grid2}>
            <InputField label="Project Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Skyline Residency" />
            <div>
              <label style={styles.label}>Project Type</label>
              <select name="projectType" value={form.projectType} onChange={handleChange} style={styles.select}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Showroom">Showroom</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Project Category</label>
              <select name="projectCategory" value={form.projectCategory} onChange={handleChange} style={styles.select}>
                <option value="Interior">Interior</option>
                <option value="Renovation">Renovation</option>
                <option value="Furniture">Furniture</option>
                <option value="Turnkey">Turnkey</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={styles.label}>Project Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} style={styles.textarea} placeholder="Brief summary of the project scope..."></textarea>
          </div>
        </div>

        {/* 2. CLIENT DETAILS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>2. Client Details</h2>
          <div style={styles.grid2}>
            <InputField label="Client Full Name" name="clientName" value={form.clientName} onChange={handleChange} required />
            <InputField label="Phone Number" name="clientPhone" value={form.clientPhone} onChange={handleChange} type="tel" />
            <InputField label="Email Address" name="clientEmail" value={form.clientEmail} onChange={handleChange} type="email" />
            <InputField label="Alternate Contact" name="alternateContact" value={form.alternateContact} onChange={handleChange} placeholder="Optional" />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={styles.label}>Full Billing/Client Address</label>
            <input type="text" name="clientAddress" value={form.clientAddress} onChange={handleChange} style={styles.input} />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <label style={styles.label}>Client Notes</label>
            <textarea name="clientNotes" value={form.clientNotes} onChange={handleChange} style={{...styles.textarea, minHeight: '60px'}} placeholder="Preferences, special requirements..."></textarea>
          </div>
        </div>

        {/* 3. LOCATION DETAILS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>3. Location Details</h2>
          <div style={styles.grid2}>
            <InputField label="Site Address (Quick Title)" name="location" value={form.location} onChange={handleChange} required />
            <InputField label="City" name="city" value={form.city} onChange={handleChange} />
            <InputField label="State" name="state" value={form.state} onChange={handleChange} />
            <InputField label="Site Size (sq ft)" name="siteSize" value={form.siteSize || ''} onChange={handleChange} type="number" />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <InputField label="Google Maps Link" name="mapsLink" value={form.mapsLink} onChange={handleChange} type="url" placeholder="https://maps.google.com/..." />
          </div>
        </div>

        {/* 4. BUDGET MANAGEMENT */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>4. Budget Management</h2>
          <div style={styles.grid2}>
            <InputField label="Estimated Budget (₹)" name="budget" value={form.budget || ''} onChange={handleChange} type="number" />
            <div>
              <label style={styles.label}>Spent Budget (₹)</label>
              <input type="number" value={form.spentBudget || ''} readOnly style={{...styles.input, backgroundColor: '#f2f2f7', color: '#86868b'}} />
              <div style={styles.hint}>Auto-tracked via tasks/bills or updated directly.</div>
            </div>
            <div>
              <label style={styles.label}>Remaining Budget (₹)</label>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: remainingBudget < 0 ? '#ff3b30' : '#34c759', padding: '0.5rem 0' }}>
                ₹ {remainingBudget.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* 5. TIMELINE & MILESTONES */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid #f2f2f7', paddingBottom: '0.75rem' }}>
            <h2 style={{...styles.cardTitle, borderBottom: 'none', paddingBottom: 0, marginBottom: 0}}>5. Timeline & Milestones</h2>
          </div>
          <div style={styles.grid2}>
            <InputField label="Start Date" name="startDate" value={form.startDate} onChange={handleChange} type="date" required />
            <InputField label="Target End Date" name="endDate" value={form.endDate} onChange={handleChange} type="date" required />
          </div>
          
          <div style={{ marginTop: '2rem' }}>
            {form.milestones.length === 0 ? (
              <p style={{ color: '#86868b', fontSize: '0.95rem', margin: 0 }}>No milestones added.</p>
            ) : (
              form.milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f2f2f7' }}>
                  <div style={{ flex: '2 1 250px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Milestone Name</label>
                    <input type="text" value={m.name} onChange={(e) => handleMilestoneChange(i, 'name', e.target.value)} required style={styles.input} placeholder="e.g. Design Approved" />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Target Date</label>
                    <input type="date" value={m.targetDate || ''} onChange={(e) => handleMilestoneChange(i, 'targetDate', e.target.value)} style={styles.input} />
                  </div>
                  <div style={{ flex: '0 0 auto', width: '100%' }}>
                    <button type="button" onClick={() => removeMilestone(i)} style={{...styles.btnDanger, width: '100%', height: '42px'}}>Delete Milestone</button>
                  </div>
                </div>
              ))
            )}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
              <button type="button" onClick={addMilestone} style={{...styles.btnOutlined, padding: '0.6rem 1.2rem', fontWeight: 600}}>
                + Add Milestone Checkpoint
              </button>
            </div>
          </div>
        </div>

        {/* 6. TEAM ASSIGNMENT */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>6. Team Assignment</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Project Manager</label>
              <select name="projectManager" value={form.projectManager} onChange={handleChange} style={styles.select}>
                <option value="">-- Unassigned --</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Lead Designer</label>
              <select name="assignedDesigner" value={form.assignedDesigner} onChange={handleChange} style={styles.select}>
                <option value="">-- Unassigned --</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Site Supervisor</label>
              <select name="siteSupervisor" value={form.siteSupervisor} onChange={handleChange} style={styles.select}>
                <option value="">-- Unassigned --</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Workers & Vendors (Multi-select)</label>
              <select multiple value={form.workersVendors} onChange={handleWorkersChange} style={{...styles.select, height: '100px', padding: '0.5rem'}}>
                <option value="" disabled>Hold Ctrl/Cmd to select multiple</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 7. PROJECT STATUS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>7. Project Status & Progress</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Initial Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={styles.select}>
                <option value="not_started">Not Started</option>
                <option value="on_track">In Progress / On Track</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <input type="checkbox" name="autoProgress" checked={form.autoProgress} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: '#0071e3' }} />
              <label style={{ fontSize: '0.95rem', color: '#1d1d1f', fontWeight: 500 }}>Auto-calculate progress based on task completion</label>
            </div>
          </div>
        </div>

        {/* 9. TASK MANAGEMENT */}
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid #f2f2f7', paddingBottom: '0.75rem' }}>
            <h2 style={{...styles.cardTitle, borderBottom: 'none', paddingBottom: 0, marginBottom: 0}}>8. Task Management</h2>
          </div>
          
          {form.tasks.length === 0 ? (
            <p style={{ color: '#86868b', fontSize: '0.95rem', margin: 0 }}>No tasks added yet. You can add them later or break down the project now.</p>
          ) : (
            form.tasks.map((task, i) => (
              <div key={i} style={styles.taskCard}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'end' }}>
                  <div style={{ flex: '2 1 200px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Task Name</label>
                    <input type="text" value={task.name} onChange={(e) => handleTaskChange(i, 'name', e.target.value)} required style={styles.input} />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Assigned To</label>
                    <select value={task.assignedTo} onChange={(e) => handleTaskChange(i, 'assignedTo', e.target.value)} style={styles.select}>
                      <option value="">--</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Deadline</label>
                    <input type="date" value={task.deadline} onChange={(e) => handleTaskChange(i, 'deadline', e.target.value)} style={styles.input} />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{...styles.label, fontSize: '0.8rem'}}>Priority</label>
                    <select value={task.priority} onChange={(e) => handleTaskChange(i, 'priority', e.target.value)} style={styles.select}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div style={{ flex: '1 0 100%' }}>
                    <button type="button" onClick={() => removeTask(i)} style={{...styles.btnDanger, width: '100%', height: '42px'}}>Delete Task</button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button type="button" onClick={addTask} style={{...styles.btnOutlined, padding: '0.6rem 1.2rem', fontWeight: 600}}>
              + Add New Task
            </button>
          </div>
        </div>

        {/* 10. FILE UPLOADS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>9. File Uploads (Plans, Bills, Images)</h2>
          <div 
             style={styles.fileZone}
             onClick={() => fileInputRef.current?.click()}
             onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#0071e3'; }}
             onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#d2d2d7'; }}
             onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '#d2d2d7';
                if (e.dataTransfer.files) {
                  setDocuments([...documents, ...Array.from(e.dataTransfer.files)]);
                }
             }}
          >
            <p style={{ color: '#0071e3', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Click to browse or drag files here</p>
            <p style={{ color: '#86868b', fontSize: '0.9rem', margin: 0 }}>Support IDs, CAD designs, Floor Plans, initial bills (Max 10 files)</p>
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          </div>

          {documents.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={styles.label}>Selected Files ({documents.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {documents.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', backgroundColor: '#fcfcfc', border: '1px solid #e5e5ea', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#1d1d1f', fontWeight: 500 }}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <button type="button" onClick={() => removeFile(i)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
          <button 
             type="button" 
             onClick={() => router.push('/projects')} 
             style={styles.btnSecondary}
             onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e5ea'}
             onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f7'}
          >
             Cancel
          </button>
          {/* <button type="button" style={{...styles.btnSecondary, backgroundColor: '#ffffff', color: '#0071e3', borderColor: '#0071e3'}}>Save Draft</button> */}
          <button 
             type="submit" 
             disabled={isSubmitting} 
             style={{...styles.btnPrimary, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer'}}
             onMouseEnter={(e) => { if(!isSubmitting) e.target.style.backgroundColor = '#005bb5'; }}
             onMouseLeave={(e) => { if(!isSubmitting) e.target.style.backgroundColor = '#0071e3'; }}
          >
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}
