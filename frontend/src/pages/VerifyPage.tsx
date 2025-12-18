import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader } from 'lucide-react';
import { auth } from '../lib/api';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Vahvistuslinkki puuttuu');
        return;
      }

      try {
        await auth.verify(token);
        setStatus('success');
        setMessage('Sähköpostisi on vahvistettu!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Vahvistus epäonnistui');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center max-w-md"
      >
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-display font-bold text-midnight-900 mb-4">
              Vahvistetaan...
            </h2>
            <p className="text-slate-600">
              Odota hetki kun vahvistamme sähköpostiosoitteesi.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-midnight-900 mb-4">
              Vahvistus onnistui!
            </h2>
            <p className="text-slate-600 mb-6">
              {message}
            </p>
            <Link to="/login" className="btn-primary">
              Kirjaudu sisään
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-midnight-900 mb-4">
              Vahvistus epäonnistui
            </h2>
            <p className="text-slate-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link to="/login" className="btn-primary block">
                Kirjaudu sisään
              </Link>
              <Link to="/" className="btn-secondary block">
                Takaisin etusivulle
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

