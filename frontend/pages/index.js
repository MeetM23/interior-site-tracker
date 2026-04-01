import Link from 'next/link';
import Head from 'next/head';
import logo from '../moodofwood.webp';

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-beige)', minHeight: '100vh', color: 'var(--text-dark)', fontFamily: 'sans-serif' }}>
      <Head>
        <title>Interior Site Tracker | Mood of Wood</title>
      </Head>

      {/* Navigation */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.5rem 5%', 
        borderBottom: '1px solid var(--border-light)',
        backgroundColor: 'var(--bg-beige)'
      }}>
        <img src={logo.src} alt="Mood of Wood" style={{ height: '40px', objectFit: 'contain' }} />
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'var(--text-dark)', textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem' }}>Login</Link>
          <Link href="/register" style={{ 
            padding: '0.6rem 1.2rem', 
            backgroundColor: 'var(--text-dark)', 
            color: 'var(--bg-white)', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            fontWeight: 500, 
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-orange)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--text-dark)'}
          >Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        padding: '10rem 5%', 
        borderBottom: '1px solid var(--border-light)',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ maxWidth: '850px' }}>
          <h1 style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 'clamp(3.5rem, 8vw, 6rem)', 
            lineHeight: 1.1, 
            margin: '0 0 2rem 0',
            letterSpacing: '-2px',
            color: 'var(--text-dark)',
            fontWeight: 700
          }}>
            Precision in every detail. <br/>Control in every project.
          </h1>
          <p style={{ 
            fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', 
            lineHeight: 1.6, 
            color: 'var(--text-muted)', 
            margin: '0 0 3.5rem 0',
            maxWidth: '600px'
          }}>
            The definitive interior site tracking and management platform for high-end designers. Eliminate chaos. Deliver absolute transparency.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ 
              padding: '1rem 2rem', 
              backgroundColor: 'var(--primary-orange)', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '4px', 
              fontWeight: 500, 
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              border: '1px solid var(--primary-orange)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              e.currentTarget.style.borderColor = 'var(--text-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-orange)';
              e.currentTarget.style.borderColor = 'var(--primary-orange)';
            }}
            >Start Managing</Link>
            
            <Link href="/login" style={{ 
              padding: '1rem 2rem', 
              backgroundColor: 'transparent', 
              color: 'var(--text-dark)', 
              textDecoration: 'none', 
              borderRadius: '4px', 
              fontWeight: 500, 
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              border: '1px solid var(--text-dark)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-dark)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-dark)';
            }}
            >Client Login</Link>
          </div>
        </div>
      </section>

      {/* The Method Section */}
      <section style={{ backgroundColor: 'var(--bg-white)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8rem 5%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '4rem' }}>
            
            <div style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '3.5rem', color: 'var(--border-light)', display: 'block', marginBottom: '1rem', lineHeight: 1 }}>01</span>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Timeline & Milestones</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Track severe dependencies and rigid deadlines without overwhelming GANNT charts. Simple, status-driven milestone tracking.
              </p>
            </div>

            <div style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '3.5rem', color: 'var(--border-light)', display: 'block', marginBottom: '1rem', lineHeight: 1 }}>02</span>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Financial Control</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Monitor budgets against actual spending with zero clutter. A grounded perspective on your project's fiscal health at all times.
              </p>
            </div>

            <div style={{ paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '3.5rem', color: 'var(--border-light)', display: 'block', marginBottom: '1rem', lineHeight: 1 }}>03</span>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>Client Transparency</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Generate beautiful, minimalist progression reports for high-end clientele. Live photo-feeds ensure they are always in loop.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 5%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <img src={logo.src} alt="Mood of Wood" style={{ height: '30px', objectFit: 'contain', marginBottom: '1rem', opacity: 0.8 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>© {new Date().getFullYear()} Interior Site Tracker. All rights reserved.</p>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
           <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease' }} onMouseEnter={(e)=>e.currentTarget.style.color='var(--text-dark)'} onMouseLeave={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Login</Link>
           <Link href="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s ease' }} onMouseEnter={(e)=>e.currentTarget.style.color='var(--text-dark)'} onMouseLeave={(e)=>e.currentTarget.style.color='var(--text-muted)'}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
