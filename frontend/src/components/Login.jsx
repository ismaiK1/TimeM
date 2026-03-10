import React, { useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Vue Login — formulaire email/mot de passe, appelle l'API puis exécute onSuccess(token, user).
 */
export default function Login({ onSuccess, loading: authLoading, error: authError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await import('../api/auth').then((m) => m.login(email, password));
      onSuccess(res.token, res.user);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Connexion impossible. Vérifiez le serveur et vos identifiants.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Clock size={28} aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">TimeManager</h1>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-6 text-center">Connexion</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="vous@company.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-600 mb-1">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          {(error || authError) && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg" role="alert">
              {error || authError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || authLoading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-300 shadow-lg shadow-indigo-100"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
