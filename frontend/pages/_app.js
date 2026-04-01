import { Inter } from 'next/font/google';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/ToastProvider';
import Layout from '../components/Layout';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function App({ Component, pageProps }) {
  return (
    <div className={inter.className}>
      <style jsx global>{`
        :root {
          --font-body: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          --font-heading: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>
      <AuthProvider>
        <ToastProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ToastProvider>
      </AuthProvider>
    </div>
  );
}
