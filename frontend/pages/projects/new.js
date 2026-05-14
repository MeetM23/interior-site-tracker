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
};

const InputField = ({ label, name, value, onChange, type = "text", required, ...props }) => (
  <div>
    <label style={styles.label}>{label} {required && <span style={{ color: '#ff3b30' }}>*</span>}</label>
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
    clientName: '', clientPhone: '', clientEmail: '',
    location: '', city: '', state: '', mapsLink: '', siteSize: '',
    budget: 0,
    startDate: '', endDate: '',
    assignedDesigner: '',
    status: 'not_started', generateDefaultMilestones: true,
  });

  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'OWNER') {
      api.get('/users').then(r => {
        const all = r.data?.data || [];
        setUsers(all.filter(u => u.role === 'DESIGNER'));
      }).catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) });
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
      // 1. Create the Client inline first to fulfill the strict normalized database rule
      const clientRes = await api.post('/clients', {
        name: form.clientName || 'Untitled Client',
        phone: form.clientPhone,
        email: form.clientEmail,
      });

      const clientId = clientRes.data.data._id;

      // 2. Prepare the Project data correctly mapped to backend Schema
      const projectPayload = {
        name: form.name,
        clientId: clientId,
        projectType: form.projectType,
        projectCategory: form.projectCategory,
        description: form.description,
        location: form.location,
        city: form.city,
        state: form.state,
        siteSize: form.siteSize,
        budget: form.budget,
        startDate: form.startDate,
        endDate: form.endDate,
        assignedDesigner: form.assignedDesigner || null,
        status: form.status,
        generateDefaultMilestones: form.generateDefaultMilestones
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(projectPayload));
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

        {/* 2. CLIENT DETAILS (Auto-Creates Client Model) */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>2. Client Details <span style={{fontSize:'0.8rem', color: '#86868b', fontWeight:400}}>(Will auto-create a new Client entry)</span></h2>
          <div style={styles.grid2}>
            <InputField label="Client Full Name" name="clientName" value={form.clientName} onChange={handleChange} required />
            <InputField label="Phone Number" name="clientPhone" value={form.clientPhone} onChange={handleChange} type="tel" />
            <InputField label="Email Address" name="clientEmail" value={form.clientEmail} onChange={handleChange} type="email" />
          </div>
        </div>

        {/* 3. LOCATION & TIMELINE */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>3. Logistics & Timeline</h2>
          <div style={styles.grid2}>
            <InputField label="Site Address (Quick Title)" name="location" value={form.location} onChange={handleChange} required />
            <InputField label="Site Size (sq ft)" name="siteSize" value={form.siteSize || ''} onChange={handleChange} type="number" />
            <InputField label="Estimated Budget (₹)" name="budget" value={form.budget || ''} onChange={handleChange} type="number" />
          </div>
          <div style={{...styles.grid2, marginTop: '1.5rem'}}>
             <InputField label="Start Date" name="startDate" value={form.startDate} onChange={handleChange} type="date" required />
             <InputField label="Target End Date" name="endDate" value={form.endDate} onChange={handleChange} type="date" required />
          </div>
        </div>

        {/* 4. TEAM ASSIGNMENT */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>4. Lead Assignment</h2>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Assigned Designer</label>
              <select name="assignedDesigner" value={form.assignedDesigner} onChange={handleChange} style={styles.select}>
                <option value="">— Assign later —</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <input type="checkbox" name="generateDefaultMilestones" checked={form.generateDefaultMilestones} onChange={handleChange} style={{ width: '20px', height: '20px', accentColor: '#0071e3' }} />
              <label style={{ fontSize: '0.95rem', color: '#1d1d1f', fontWeight: 500 }}>Auto-generate standard milestones for this project</label>
            </div>
          </div>
        </div>

        {/* 5. FILE UPLOADS */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>5. Attach Blueprint / Floor Plan (Optional)</h2>
          <div
            style={styles.fileZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <p style={{ color: '#0071e3', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Click to browse or drag files here</p>
            <p style={{ color: '#86868b', fontSize: '0.9rem', margin: 0 }}>Support IDs, CAD designs, Floor Plans (Max 10 files)</p>
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
          <button type="button" onClick={() => router.push('/projects')} style={styles.btnSecondary}>Cancel</button>
          <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}>
            {isSubmitting ? 'Creating Project...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}