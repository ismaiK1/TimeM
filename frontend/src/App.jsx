import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Clock,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  History,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { setOnUnauthorized } from './api/client';
import { TOKEN_KEY } from './constants/auth';
import * as api from './services/api';
import * as authApi from './api/auth';
import Login from './components/Login';

// Map des classes Tailwind pour StatCard (évite les classes dynamiques non détectées par le JIT)
const STATCARD_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
};

const DEFAULT_LATE_DATA = [
  { name: "À l'heure", value: 100, color: '#10b981' },
  { name: 'En retard', value: 0, color: '#ef4444' },
];
const DEFAULT_WORK_HOURS = [
  { day: 'Lun', hours: 0 },
  { day: 'Mar', hours: 0 },
  { day: 'Mer', hours: 0 },
  { day: 'Jeu', hours: 0 },
  { day: 'Ven', hours: 0 },
  { day: 'Sam', hours: 0 },
  { day: 'Dim', hours: 0 },
];

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, subValue, trend, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${STATCARD_COLORS[color] ?? STATCARD_COLORS.indigo}`}>
        <Icon size={24} />
      </div>
      {trend != null && (
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <div className="flex items-baseline space-x-2 mt-1">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{subValue}</p>
    </div>
  </div>
);

function ToastList({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between gap-3"
        >
          <span className="text-sm font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="text-slate-300 hover:text-white shrink-0"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [teamMembers, setTeamMembers] = useState([]);
  const [workHoursData, setWorkHoursData] = useState(DEFAULT_WORK_HOURS);
  const [lateData, setLateData] = useState(DEFAULT_LATE_DATA);
  const [statsSummary, setStatsSummary] = useState({ avgHoursPerDay: 0, avgHoursPerWeek: 0 });
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [clockLoading, setClockLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [clocks, setClocks] = useState([]);
  const [loadingClocks, setLoadingClocks] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'EMPLOYEE' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    setError('');
    try {
      const list = await api.getMembers();
      setTeamMembers(list);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Serveur indisponible';
      setError(msg);
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api.getStats(period);
      setLateData(data.lateData.length ? data.lateData : DEFAULT_LATE_DATA);
      setWorkHoursData(data.workHoursData.length ? data.workHoursData : DEFAULT_WORK_HOURS);
      setStatsSummary(data.statsSummary || {});
    } catch (err) {
      setLateData(DEFAULT_LATE_DATA);
      setWorkHoursData(DEFAULT_WORK_HOURS);
    } finally {
      setLoadingStats(false);
    }
  }, [period]);

  const refreshOpenClock = useCallback(async () => {
    try {
      const open = await api.hasOpenClock();
      setIsClockedIn(!!open);
    } catch {
      setIsClockedIn(false);
    }
  }, []);

  const loadClocks = useCallback(async () => {
    setLoadingClocks(true);
    try {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      const list = await api.getClocks({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      setClocks(Array.isArray(list) ? list : []);
    } catch {
      setClocks([]);
    } finally {
      setLoadingClocks(false);
    }
  }, []);

  // Restauration du token et profil au chargement
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      window.__tm_token = token;
      import('./api/auth')
        .then((m) => m.me())
        .then((profile) => setUser(profile))
        .catch(() => {
          window.__tm_token = null;
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // Chargement des données une fois connecté (GET /users réservé aux MANAGER)
  useEffect(() => {
    if (!user) return;
    if (user.role === 'MANAGER') loadMembers();
    refreshOpenClock();
  }, [user, loadMembers, refreshOpenClock]);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user, period, loadStats]);

  useEffect(() => {
    if (!user || activeTab !== 'historique') return;
    loadClocks();
  }, [user, activeTab, loadClocks]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSuccess = (token, profile) => {
    localStorage.setItem(TOKEN_KEY, token);
    window.__tm_token = token;
    setUser(profile);
    setAuthError('');
  };

  const handleLogout = () => {
    window.__tm_token = null;
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const handlePointer = async () => {
    setClockLoading(true);
    setError('');
    try {
      if (isClockedIn) {
        await api.clockOut();
        addToast('Pointage de sortie enregistré.');
        setIsClockedIn(false);
      } else {
        await api.clockIn();
        addToast('Pointage d\'entrée enregistré.');
        setIsClockedIn(true);
      }
      loadStats();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erreur lors du pointage';
      setError(msg);
      addToast(msg);
    } finally {
      setClockLoading(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    try {
      await api.deleteMember(id);
      addToast(`Membre "${name}" supprimé.`);
      loadMembers();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Impossible de supprimer';
      addToast(msg);
    }
  };

  const handleOpenAddMember = () => {
    setAddMemberError('');
    setAddMemberForm({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
    setShowAddMemberModal(true);
  };

  const handleSubmitAddMember = async (e) => {
    e.preventDefault();
    setAddMemberError('');
    setAddMemberLoading(true);
    try {
      await api.createMember({
        email: addMemberForm.email,
        password: addMemberForm.password,
        firstName: addMemberForm.firstName,
        lastName: addMemberForm.lastName,
        role: addMemberForm.role,
      });
      addToast('Membre ajouté.');
      setShowAddMemberModal(false);
      loadMembers();
    } catch (err) {
      setAddMemberError(err.response?.data?.error || err.message || 'Erreur lors de l\'ajout');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleOpenEditMember = (member) => {
    setEditingMemberId(member.id);
    setEditError('');
    setEditForm({ firstName: member.name.split(' ')[0] || '', lastName: member.name.split(' ').slice(1).join(' ') || '', role: member.role });
  };

  useEffect(() => {
    if (!editingMemberId) return;
    api.getMember(editingMemberId)
      .then((u) => setEditForm({ firstName: u.firstName || '', lastName: u.lastName || '', role: u.role || 'EMPLOYEE' }))
      .catch(() => setEditError('Impossible de charger le membre'))
      .finally(() => {});
  }, [editingMemberId]);

  const handleSubmitEditMember = async (e) => {
    e.preventDefault();
    if (!editingMemberId) return;
    setEditError('');
    setEditLoading(true);
    try {
      await api.updateMember(editingMemberId, { firstName: editForm.firstName, lastName: editForm.lastName, role: editForm.role });
      addToast('Membre mis à jour.');
      setEditingMemberId(null);
      loadMembers();
    } catch (err) {
      setEditError(err.response?.data?.error || err.message || 'Erreur lors de la mise à jour');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordNew !== passwordConfirm) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordNew.length < 6) {
      setPasswordError('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }
    setPasswordLoading(true);
    try {
      await authApi.changePassword(passwordCurrent, passwordNew);
      addToast('Mot de passe mis à jour.');
      setPasswordCurrent('');
      setPasswordNew('');
      setPasswordConfirm('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || err.message || 'Erreur');
    } finally {
      setPasswordLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  if (!user && !authLoading) {
    return (
      <>
        <Login onSuccess={handleLoginSuccess} loading={authLoading} error={authError} />
      </>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" aria-hidden />
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6 opacity-0 animate-fadeIn">
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-xl text-sm" role="alert">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Heures (moy/jour)"
          value={`${statsSummary.avgHoursPerDay ?? 0}h`}
          subValue={period === '7d' ? '7 derniers jours' : 'Mois'}
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Taux à l'heure"
          value={`${lateData.find((d) => d.name === "À l'heure")?.value ?? 100}%`}
          subValue="Période"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Retards"
          value={lateData.find((d) => d.name === 'En retard')?.value ?? 0}
          subValue="% de la période"
          icon={AlertCircle}
          color="rose"
        />
        <StatCard
          title="Membres"
          value={teamMembers.length}
          subValue="Équipe"
          icon={Users}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Activité de la semaine</h3>
            <select
              className="text-sm border-none bg-slate-50 rounded-lg px-3 py-1 focus:ring-0"
              aria-label="Période"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7d">7 derniers jours</option>
              <option value="month">Mois dernier</option>
            </select>
          </div>
          {loadingStats ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={workHoursData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-6">Répartition Ponctualité</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lateData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {lateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 w-full">
              {lateData.map((item) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeam = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden opacity-0 animate-fadeIn">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Membres de l&apos;équipe</h3>
          <p className="text-sm text-slate-500">Gérez les accès et visualisez les performances</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAddMember}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-colors duration-300 shadow-lg shadow-indigo-100"
          aria-label="Ajouter un membre"
        >
          <UserPlus size={18} />
          <span>Ajouter</span>
        </button>
      </div>
      {loadingMembers ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border-t border-rose-100 text-rose-700 rounded-b-2xl" role="alert">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" role="grid">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4" scope="col">Membre</th>
                <th className="px-6 py-4" scope="col">Rôle</th>
                <th className="px-6 py-4" scope="col">Statut</th>
                <th className="px-6 py-4 text-center" scope="col">Taux Retard</th>
                <th className="px-6 py-4 text-center" scope="col">Heures (Sem)</th>
                <th className="px-6 py-4 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-slate-50/50 transition-colors duration-300 group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('') || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span
                      className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        member.role === 'MANAGER'
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          member.status === 'Online'
                            ? 'bg-emerald-500 animate-pulse'
                            : member.status === 'In Break'
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                        }`}
                        aria-hidden
                      />
                      <span className="text-sm text-slate-600">{member.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${
                        member.lateRate > 10 ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {member.lateRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                    {member.hours}h
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMember(member)}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all duration-300 border border-transparent hover:border-slate-100"
                        aria-label="Éditer le membre"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id, member.name)}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm transition-all duration-300 border border-transparent hover:border-slate-100"
                        aria-label="Supprimer le membre"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const formatDuration = (clockIn, clockOut) => {
    if (!clockOut) return 'En cours';
    const ms = new Date(clockOut) - new Date(clockIn);
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const renderHistory = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden opacity-0 animate-fadeIn">
      {loadingClocks ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" aria-hidden />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" role="grid">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl" scope="col">Date</th>
                <th className="px-6 py-4" scope="col">Arrivée</th>
                <th className="px-6 py-4" scope="col">Départ</th>
                <th className="px-6 py-4" scope="col">Durée</th>
                <th className="px-6 py-4 rounded-tr-2xl" scope="col">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Aucun pointage enregistré sur les 30 derniers jours.
                  </td>
                </tr>
              ) : (
                clocks.map((session) => {
                  const isOpen = session.clockOut == null;
                  return (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50/50 transition-colors duration-300"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {new Date(session.clockIn).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(session.clockIn).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {isOpen ? '—' : new Date(session.clockOut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {formatDuration(session.clockIn, session.clockOut)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                            isOpen ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isOpen ? 'En cours' : 'Terminé'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 opacity-0 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Profil</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Prénom</label>
            <input
              type="text"
              readOnly
              value={user?.firstName ?? ''}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
              aria-label="Prénom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nom</label>
            <input
              type="text"
              readOnly
              value={user?.lastName ?? ''}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
              aria-label="Nom"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              readOnly
              value={user?.email ?? ''}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm"
              aria-label="Email"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Mot de passe</h3>
        <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="settings-current-password" className="block text-sm font-medium text-slate-600 mb-1">Mot de passe actuel</label>
            <input
              id="settings-current-password"
              type="password"
              value={passwordCurrent}
              onChange={(e) => setPasswordCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              aria-label="Mot de passe actuel"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label htmlFor="settings-new-password" className="block text-sm font-medium text-slate-600 mb-1">Nouveau mot de passe</label>
            <input
              id="settings-new-password"
              type="password"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              aria-label="Nouveau mot de passe"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-slate-600 mb-1">Confirmer le mot de passe</label>
            <input
              id="settings-confirm-password"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              aria-label="Confirmer le mot de passe"
              autoComplete="new-password"
            />
          </div>
          {passwordError && (
            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg" role="alert">{passwordError}</p>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-300 shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {passwordLoading ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
            <span className="text-sm text-slate-700">Notifications par email</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
            <span className="text-sm text-slate-700">Rappels de pointage</span>
          </label>
        </div>
      </div>
    </div>
  );

  const pageTitles = {
    dashboard: { title: 'Tableau de bord', description: 'Résumé de l\'activité et indicateurs clés.' },
    historique: { title: 'Historique des pointages', description: 'Liste de vos sessions passées.' },
    team: { title: 'Mon équipe', description: 'Gestion des membres et des accès.' },
    settings: { title: 'Paramètres', description: 'Profil, mot de passe et notifications.' },
  };
  const currentPage = pageTitles[activeTab] ?? pageTitles.dashboard;

  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : '';

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden">
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" role="dialog" aria-modal="true" aria-labelledby="add-member-title">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6">
            <h2 id="add-member-title" className="text-lg font-bold text-slate-900 mb-4">Ajouter un membre</h2>
            <form onSubmit={handleSubmitAddMember} className="space-y-4">
              <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                <input id="add-email" type="email" required value={addMemberForm.email} onChange={(e) => setAddMemberForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" placeholder="email@exemple.com" />
              </div>
              <div>
                <label htmlFor="add-password" className="block text-sm font-medium text-slate-600 mb-1">Mot de passe</label>
                <input id="add-password" type="password" required minLength={6} value={addMemberForm.password} onChange={(e) => setAddMemberForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" placeholder="••••••••" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="add-firstName" className="block text-sm font-medium text-slate-600 mb-1">Prénom</label>
                  <input id="add-firstName" type="text" required value={addMemberForm.firstName} onChange={(e) => setAddMemberForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label htmlFor="add-lastName" className="block text-sm font-medium text-slate-600 mb-1">Nom</label>
                  <input id="add-lastName" type="text" required value={addMemberForm.lastName} onChange={(e) => setAddMemberForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="add-role" className="block text-sm font-medium text-slate-600 mb-1">Rôle</label>
                <select id="add-role" value={addMemberForm.role} onChange={(e) => setAddMemberForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm">
                  <option value="EMPLOYEE">Employé</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {addMemberError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg" role="alert">{addMemberError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={addMemberLoading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">{addMemberLoading ? 'Ajout...' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" role="dialog" aria-modal="true" aria-labelledby="edit-member-title">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6">
            <h2 id="edit-member-title" className="text-lg font-bold text-slate-900 mb-4">Modifier le membre</h2>
            <form onSubmit={handleSubmitEditMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-firstName" className="block text-sm font-medium text-slate-600 mb-1">Prénom</label>
                  <input id="edit-firstName" type="text" required value={editForm.firstName} onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="block text-sm font-medium text-slate-600 mb-1">Nom</label>
                  <input id="edit-lastName" type="text" required value={editForm.lastName} onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-slate-600 mb-1">Rôle</label>
                <select id="edit-role" value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm">
                  <option value="EMPLOYEE">Employé</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {editError && <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg" role="alert">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingMemberId(null)} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={editLoading} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">{editLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shrink-0">
        <div className="flex items-center space-x-3 px-2 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Clock size={24} aria-hidden />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TimeManager</h1>
        </div>

        <nav className="flex-1 space-y-2" aria-label="Navigation principale">
          <SidebarItem
            icon={LayoutDashboard}
            label="Tableau de bord"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem
            icon={History}
            label="Historique"
            active={activeTab === 'historique'}
            onClick={() => setActiveTab('historique')}
          />
          <SidebarItem
            icon={Users}
            label="Mon équipe"
            active={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
          />
        </nav>

        <div className="pt-6 mt-6 border-t border-slate-100 space-y-1">
          <SidebarItem
            icon={Settings}
            label="Paramètres"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <SidebarItem icon={LogOut} label="Déconnexion" active={false} onClick={handleLogout} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="relative max-w-md w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={18}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300"
                aria-label="Rechercher"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 shrink-0">
            <div className="flex items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <div className="mr-4">
                <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">
                  Session actuelle
                </p>
                <p
                  className="text-sm font-mono font-bold text-slate-700 leading-none"
                  role="timer"
                  aria-live="polite"
                >
                  {currentTime.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePointer}
                disabled={clockLoading}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 disabled:opacity-50 flex items-center gap-2 ${
                  isClockedIn
                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                    : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }`}
              >
                {clockLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />}
                {clockLoading ? 'Enregistrement...' : isClockedIn ? 'Terminer' : 'Pointer'}
              </button>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationCount(0)}
                className="text-slate-400 hover:text-indigo-600 transition-colors duration-300 p-1"
                aria-label={notificationCount > 0 ? `${notificationCount} notification(s) non lue(s)` : 'Notifications'}
                title="Notifications"
              >
                <Bell size={20} aria-hidden />
              </button>
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-500 text-white text-xs font-bold rounded-full border-2 border-white"
                  aria-hidden
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{displayName || 'Utilisateur'}</p>
                <p className="text-[10px] text-slate-400 font-medium">{user?.role === 'MANAGER' ? 'Manager' : 'Employé'}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shadow-inner ring-2 ring-slate-50 shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'user')}`}
                  alt={`Avatar ${displayName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  {currentPage.title}
                </h2>
                <p className="text-slate-500 mt-1">
                  {currentPage.description}
                </p>
              </div>
              {activeTab === 'dashboard' && (
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPeriod('7d')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                      period === '7d' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    7 derniers jours
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('month')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                      period === 'month' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Mois
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'historique' && renderHistory()}
            {activeTab === 'team' && renderTeam()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
