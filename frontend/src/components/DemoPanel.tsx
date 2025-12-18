import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface DemoUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'CUSTOMER' | 'FINANCIER';
  label: string;
  icon: string;
  color: string;
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@Kantama.fi',
    password: 'admin123',
    role: 'ADMIN',
    label: 'Admin',
    icon: '👑',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    email: 'demo.financier@Kantama.fi',
    password: 'demo123',
    role: 'FINANCIER',
    label: 'Rahoittaja',
    icon: '🏦',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    email: 'demo.customer@Kantama.fi',
    password: 'demo123',
    role: 'CUSTOMER',
    label: 'Asiakas',
    icon: '👤',
    color: 'from-blue-500 to-cyan-600',
  },
];

export function DemoPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, login, logout } = useAuthStore();

  const handleLogin = async (demoUser: DemoUser) => {
    setLoading(demoUser.email);
    setError(null);
    
    try {
      // First logout if already logged in
      if (user) {
        logout();
      }
      
      // Try to login
      await login(demoUser.email, demoUser.password);
      
      // Redirect based on role
      const redirectMap = {
        ADMIN: '/admin',
        FINANCIER: '/financier',
        CUSTOMER: '/dashboard',
      };
      window.location.href = redirectMap[demoUser.role];
    } catch (err: any) {
      // If login fails, user might not exist - create it
      if (err.response?.status === 401 || err.response?.status === 404) {
        try {
          await createDemoUser(demoUser);
          await login(demoUser.email, demoUser.password);
          
          const redirectMap = {
            ADMIN: '/admin',
            FINANCIER: '/financier',
            CUSTOMER: '/dashboard',
          };
          window.location.href = redirectMap[demoUser.role];
        } catch (createErr: any) {
          setError(`Virhe luotaessa käyttäjää: ${createErr.message}`);
        }
      } else {
        setError(`Kirjautuminen epäonnistui: ${err.response?.data?.detail || err.message}`);
      }
    } finally {
      setLoading(null);
    }
  };

  const createDemoUser = async (demoUser: DemoUser) => {
    if (demoUser.role === 'ADMIN') {
      // Admin already exists from startup
      throw new Error('Admin-käyttäjä on jo olemassa');
    }
    
    if (demoUser.role === 'CUSTOMER') {
      // Register as customer
      await api.post('/auth/register', {
        email: demoUser.email,
        password: demoUser.password,
        first_name: 'Demo',
        last_name: 'Asiakas',
        company_name: 'Demo Yritys Oy',
        business_id: '1234567-8',
      });
      
      // Auto-verify (in real app, this would be email verification)
      // For demo, we'll use admin to activate
      const adminLogin = await api.post('/auth/login', {
        email: 'admin@Kantama.fi',
        password: 'admin123',
      });
      
      const adminToken = adminLogin.data.access_token;
      
      // Get users list to find the new user
      const usersResponse = await api.get('/users/', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      const newUser = usersResponse.data.find((u: any) => u.email === demoUser.email);
      if (newUser) {
        await api.put(`/users/${newUser.id}/activate`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    }
    
    if (demoUser.role === 'FINANCIER') {
      // First login as admin to create financier and user
      const adminLogin = await api.post('/auth/login', {
        email: 'admin@Kantama.fi',
        password: 'admin123',
      });
      
      const adminToken = adminLogin.data.access_token;
      
      // Check if financier exists
      const financiersResponse = await api.get('/financiers/', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      let financier = financiersResponse.data.find((f: any) => f.name === 'Demo Rahoitus Oy');
      
      if (!financier) {
        // Create financier
        const createFinancierResponse = await api.post('/financiers/', {
          name: 'Demo Rahoitus Oy',
          email: 'info@demorahoitus.fi',
          phone: '+358 40 123 4567',
          address: 'Rahoituskatu 1, 00100 Helsinki',
          notes: 'Demo-rahoittaja testausta varten',
        }, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        financier = createFinancierResponse.data;
      }
      
      // Create financier user
      await api.post('/users/financier-user', {
        email: demoUser.email,
        password: demoUser.password,
        first_name: 'Demo',
        last_name: 'Rahoittaja',
        financier_id: financier.id,
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
        title="Avaa demo-paneeli"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isMinimized ? 'w-auto' : 'w-80'}`}>
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">🎭</span>
            <span className="font-bold">Demo-paneeli</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              title={isMinimized ? 'Laajenna' : 'Pienennä'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMinimized ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded transition-colors"
              title="Sulje"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {/* Current user */}
            {user && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Kirjautuneena:</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'FINANCIER' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'ADMIN' ? 'Admin' : user.role === 'FINANCIER' ? 'Rahoittaja' : 'Asiakas'}
                  </span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Demo users */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">Vaihda käyttäjää:</div>
              {demoUsers.map((demoUser) => (
                <button
                  key={demoUser.email}
                  onClick={() => handleLogin(demoUser)}
                  disabled={loading !== null}
                  className={`w-full p-3 rounded-xl bg-gradient-to-r ${demoUser.color} text-white font-medium 
                    hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    flex items-center gap-3`}
                >
                  <span className="text-2xl">{demoUser.icon}</span>
                  <div className="text-left flex-1">
                    <div className="font-semibold">{demoUser.label}</div>
                    <div className="text-xs opacity-80">{demoUser.email}</div>
                  </div>
                  {loading === demoUser.email && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Logout button */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/';
                }}
                className="w-full mt-4 p-2 rounded-xl border-2 border-gray-200 text-gray-600 font-medium
                  hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Kirjaudu ulos
              </button>
            )}

            {/* Info */}
            <div className="mt-4 text-xs text-gray-400 text-center">
              Demo-käyttäjät luodaan automaattisesti ensimmäisellä kirjautumisella
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

