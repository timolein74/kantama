import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Virheellinen sähköposti'),
  password: z.string().min(6, 'Salasanan tulee olla vähintään 6 merkkiä'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Kirjautuminen onnistui!');
      
      // Get fresh user data from store after login
      const userRole = useAuthStore.getState().user?.role;
      
      // Redirect based on role
      switch (userRole) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'FINANCIER':
          navigate('/financier');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Kirjautuminen epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-Kantama-500 to-Kantama-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">e</span>
              </div>
            </Link>
            <h1 className="text-2xl font-display font-bold text-midnight-900 mb-2">
              Kirjaudu sisään
            </h1>
            <p className="text-slate-600">
              Tervetuloa takaisin Kantamaiin
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Sähköposti</label>
              <input
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="email@yritys.fi"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Salasana</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-Kantama-600 focus:ring-Kantama-500"
                />
                <span className="ml-2 text-sm text-slate-600">Muista minut</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-Kantama-600 hover:text-Kantama-700"
              >
                Unohditko salasanan?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4"
            >
              {isLoading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Eikö sinulla ole tiliä?{' '}
              <Link to="/register" className="text-Kantama-600 font-medium hover:text-Kantama-700">
                Rekisteröidy
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

