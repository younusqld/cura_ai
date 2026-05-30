import React, { useState, useEffect } from 'react';
import {
  Activity, Pill, User, AlertTriangle, CheckCircle2,
  ChevronRight, ShieldAlert, ShieldCheck, Stethoscope,
  AlertOctagon, Menu, X, ClipboardList, Zap, Save,
  Lock, LogOut, Users, Settings, UserPlus,
  Plus, Trash2, HeartPulse, FileText, Check, PlusCircle
} from 'lucide-react';

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [registerCreds, setRegisterCreds] = useState({ username: '', password: '', confirmPassword: '' });

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeTab, setActiveTab] = useState('patient_profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // DYNAMIC DATASET & BACKEND STATE
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(true);
  const [availableSymptoms, setAvailableSymptoms] = useState([]);

  const [profile, setProfile] = useState({
    username: '', name: '', age: 30, gender: 'Female', lastSymptoms: '', lastPrescription: []
  });

  const [savedPatients, setSavedPatients] = useState([]);

  // SYMPTOM SELECTION STATE
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomSearch, setSymptomSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  const [engineState, setEngineState] = useState({
    isAnalyzing: false, results: null, error: null
  });

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('curaAI_patients_v3');
      if (stored) setSavedPatients(JSON.parse(stored));
    } catch (e) { }
  }, []);

  // --- CHECK FLASK BACKEND STATUS ---
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:5050/api/status');
        const data = await res.json();
        if (data.status === 'online') {
          setIsBackendOnline(true);
          setAvailableSymptoms(data.available_symptoms || []);
        } else {
          setIsBackendOnline(false);
        }
      } catch (err) {
        console.error("Backend offline", err);
        setIsBackendOnline(false);
      } finally {
        setIsCheckingBackend(false);
      }
    };
    checkBackend();
  }, []);

  const loadUserProfile = (username) => {
    setLoggedInUser(username);
    const existingProfile = savedPatients.find(p => p.username === username);
    if (existingProfile) {
      setProfile(existingProfile);
    } else {
      setProfile({
        username, name: username, age: 30, gender: 'Female', lastSymptoms: '', lastPrescription: []
      });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    const { username, password } = loginCreds;

    if (username === 'admin' && password === 'admin123') {
      setCurrentView('admin');
      return;
    }

    try {
      const stored = localStorage.getItem('curaAI_users');
      let users = [];
      if (stored) users = JSON.parse(stored);
      else {
        users = [{ username: 'a', password: 'a', role: 'patient' }];
        localStorage.setItem('curaAI_users', JSON.stringify(users));
      }

      const matchedUser = users.find(u => u.username === username && u.password === password) || (username === 'a' && password === 'a');

      if (matchedUser) {
        loadUserProfile(username);
        setCurrentView('dashboard');
        return;
      }
    } catch (err) { }

    setAuthError('Invalid credentials. Please try again or register a new account.');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError('');
    if (registerCreds.password !== registerCreds.confirmPassword) {
      setAuthError("Passwords do not match!"); return;
    }
    if (registerCreds.username.trim() === '') {
      setAuthError("Username is required."); return;
    }

    let existingUsers = [];
    try {
      const stored = localStorage.getItem('curaAI_users');
      if (stored) existingUsers = JSON.parse(stored);
    } catch (err) { }

    if (existingUsers.some(u => u.username === registerCreds.username) || registerCreds.username === 'a' || registerCreds.username === 'admin') {
      setAuthError("Username already exists! Please choose another."); return;
    }

    const newUser = { username: registerCreds.username, password: registerCreds.password, role: 'patient' };
    existingUsers.push(newUser);
    localStorage.setItem('curaAI_users', JSON.stringify(existingUsers));

    const newProfile = {
      username: registerCreds.username, name: registerCreds.username, age: 30, gender: 'Female', lastSymptoms: '', lastPrescription: []
    };

    const updatedPatients = [...savedPatients, newProfile];
    setSavedPatients(updatedPatients);
    localStorage.setItem('curaAI_patients_v3', JSON.stringify(updatedPatients));

    setAuthSuccess('Registration successful! You can now log in.');
    setCurrentView('login');
    setRegisterCreds({ username: '', password: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    setCurrentView('login');
    setLoginCreds({ username: '', password: '' });
    setLoggedInUser(null);
    setAuthError('');
    setAuthSuccess('');
    setActiveTab('patient_profile');
    setSelectedSymptoms([]);
    setEngineState({ isAnalyzing: false, results: null, error: null });
  };

  const handleSaveProfile = (optionalPrescription = [], optionalSymptoms = '', confidence = 0, disease = 'Unknown', isFallback = false) => {
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      symptoms: optionalSymptoms,
      disease: disease,
      confidence: confidence,
      prescription: optionalPrescription,
      isFallback: isFallback
    };

    const updatedProfile = {
      ...profile,
      lastSymptoms: optionalSymptoms || 'None recorded',
      lastPrescription: optionalPrescription || [],
      lastDate: new Date().toLocaleString(),
      history: [...(profile.history || []), newRecord]
    };

    setProfile(updatedProfile);
    setSavedPatients(prev => {
      const newSaved = [...prev.filter(p => p.username !== loggedInUser), updatedProfile];
      localStorage.setItem('curaAI_patients_v3', JSON.stringify(newSaved));
      return newSaved;
    });
  };

  const toggleSymptom = (symptomName) => {
    if (selectedSymptoms.find(s => s.name === symptomName)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s.name !== symptomName));
    } else {
      setSelectedSymptoms([...selectedSymptoms, { name: symptomName, severity: 2 }]);
    }
  };

  const updateSeverity = (symptomName, severity) => {
    setSelectedSymptoms(selectedSymptoms.map(s =>
      s.name === symptomName ? { ...s, severity } : s
    ));
  };

  // --- DYNAMIC ML INFERENCE (VIA FLASK) ---
  const runAnalysis = async () => {
    if (selectedSymptoms.length === 0 || !isBackendOnline) return;
    setEngineState({ isAnalyzing: true, results: null, error: null });
    setShowDisclaimer(true);

    try {
      const response = await fetch('http://localhost:5050/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: selectedSymptoms })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms.');
      }

      setEngineState({
        isAnalyzing: false,
        results: data,
        error: null
      });

      handleSaveProfile(
        data.medicines || [],
        selectedSymptoms.map(s => `${formatSymptomName(s.name)} (Sev: ${s.severity})`).join(', '),
        data.predictions && data.predictions.length > 0 ? data.predictions[0].confidence : 0,
        data.predictions && data.predictions.length > 0 ? data.predictions[0].disease : 'No Match',
        data.isFallback || false
      );

    } catch (err) {
      setEngineState({
        isAnalyzing: false,
        results: null,
        error: err.message
      });
    }
  };

  const formatSymptomName = (name) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredSymptoms = availableSymptoms.filter(s => s.replace('_', ' ').toLowerCase().includes(symptomSearch.toLowerCase()));

  // ==========================================
  // VIEW ROUTING
  // ==========================================

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transform transition-all">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 relative overflow-hidden">
              <Zap size={32} className="text-white stroke-[2.5] relative z-10" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">CuraAI ML</h1>
            <p className="text-gray-500 font-medium mt-2">Machine Learning Health Engine</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {authSuccess && (
              <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-bold flex items-center border border-green-200"><CheckCircle2 size={16} className="mr-2 shrink-0" /> {authSuccess}</div>
            )}
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center border border-red-200"><AlertOctagon size={16} className="mr-2 shrink-0" /> {authError}</div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="text" required placeholder="Enter username"
                  className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-gray-800 font-medium"
                  value={loginCreds.username} onChange={(e) => setLoginCreds({ ...loginCreds, username: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input
                  type="password" required placeholder="••••••••"
                  className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-gray-800 font-medium"
                  value={loginCreds.password} onChange={(e) => setLoginCreds({ ...loginCreds, password: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 mt-4 active:scale-[0.98]">Secure Login</button>
          </form>

          <div className="mt-6 text-center flex flex-col space-y-2">
            <p className="text-sm text-gray-600 font-medium">Don't have an account? <button onClick={() => { setCurrentView('register'); setAuthError(''); setAuthSuccess(''); }} className="text-blue-600 hover:text-blue-700 font-bold ml-1 transition-colors">Register here</button></p>
            <p className="text-xs text-gray-400 font-medium pt-2 border-t border-gray-100">System Admin? <button onClick={() => { setLoginCreds({ username: 'admin', password: 'admin123' }); handleLogin({ preventDefault: () => { } }); }} className="text-gray-500 hover:text-gray-800 font-bold ml-1 transition-colors">Quick Login</button></p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 transform transition-all animate-in fade-in zoom-in-95">
          <div className="text-center mb-8">
            <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
              <UserPlus size={32} className="text-white stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-gray-500 font-medium mt-2">Join CuraAI Personal Health</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {authError && (<div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center border border-red-200"><AlertOctagon size={16} className="mr-2 shrink-0" /> {authError}</div>)}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input type="text" required placeholder="Choose a username" className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all text-gray-800 font-medium" value={registerCreds.username} onChange={(e) => setRegisterCreds({ ...registerCreds, username: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input type="password" required placeholder="Create password" className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all text-gray-800 font-medium" value={registerCreds.password} onChange={(e) => setRegisterCreds({ ...registerCreds, password: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <ShieldCheck size={18} className="absolute left-4 top-3.5 text-gray-400" />
                <input type="password" required placeholder="Repeat password" className="w-full bg-slate-50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all text-gray-800 font-medium" value={registerCreds.confirmPassword} onChange={(e) => setRegisterCreds({ ...registerCreds, confirmPassword: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-600/30 mt-2 active:scale-[0.98]">Register Now</button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-medium">Already have an account? <button onClick={() => { setCurrentView('login'); setAuthError(''); }} className="text-green-600 hover:text-green-700 font-bold ml-1 transition-colors">Sign in</button></p>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING FLASK BACKEND SCREEN ---
  if (isCheckingBackend) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl p-10 shadow-2xl text-center">
          <Zap size={56} className="mx-auto animate-pulse text-blue-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connecting to ML Backend</h2>
          <p className="text-gray-500 font-medium mb-8">Please wait while we connect to the Flask server and load the Random Forest model.</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-2/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isBackendOnline && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl p-10 shadow-2xl text-center">
          <AlertOctagon size={56} className="mx-auto text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Backend Offline</h2>
          <p className="text-gray-500 font-medium mb-6">The Flask backend server is not running. Please start it to use the application.</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Retry Connection</button>
        </div>
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-200">
        <aside className="w-full md:w-72 bg-gray-900 border-r border-gray-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-10">
              <Settings size={28} className="stroke-[2.5]" />
              <span className="font-bold text-2xl tracking-tight text-white">Admin <span className="text-gray-400 font-light">Panel</span></span>
            </div>
            <nav className="space-y-2">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all bg-indigo-600 text-white shadow-md">
                <Users size={20} className="text-indigo-100" /><span>User Activity</span>
              </button>
            </nav>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all font-bold">
            <LogOut size={18} /><span>Logout Admin</span>
          </button>
        </aside>
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <header className="mb-10"><h1 className="text-3xl font-black text-gray-900">System Dashboard</h1><p className="text-gray-500 font-medium">Manage clinical data and oversee user registries.</p></header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-4"><div className="bg-indigo-100 p-4 rounded-xl"><Users size={24} className="text-indigo-600" /></div><div><p className="text-sm font-bold text-gray-500 uppercase">Registered Users</p><h3 className="text-2xl font-black text-gray-900">{savedPatients.length}</h3></div></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center space-x-4"><div className="bg-blue-100 p-4 rounded-xl"><Activity size={24} className="text-blue-600" /></div><div><p className="text-sm font-bold text-gray-500 uppercase">Flask API Status</p><h3 className="text-2xl font-black text-blue-600">{isBackendOnline ? 'Online' : 'Offline'}</h3></div></div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-gray-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center"><ClipboardList size={20} className="mr-2 text-indigo-600" /> User Prediction History</h2>
              <input type="text" placeholder="Search user or disease..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-600 outline-none w-full md:w-64" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-white text-gray-500 text-sm border-b border-gray-200"><th className="p-4 font-bold uppercase tracking-wider">Time & User</th><th className="p-4 font-bold uppercase tracking-wider">Symptoms</th><th className="p-4 font-bold uppercase tracking-wider">Prediction</th><th className="p-4 font-bold uppercase tracking-wider">Medicines</th></tr></thead>
                <tbody className="text-sm">
                  {savedPatients.flatMap(p => (p.history || []).map(h => ({ ...h, username: p.username })))
                    .sort((a, b) => b.id - a.id)
                    .filter(record => (record.username || '').toLowerCase().includes(adminSearch.toLowerCase()) || (record.disease || '').toLowerCase().includes(adminSearch.toLowerCase()))
                    .map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors align-top">
                        <td className="p-4"><div className="font-bold text-gray-900">@{record.username || 'Unknown'}</div><div className="text-xs text-gray-400 mt-1">{record.date}</div></td>
                        <td className="p-4 max-w-xs text-gray-600 font-medium italic">"{record.symptoms || 'None'}"</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{record.disease || 'Unknown'}</div>
                          <div className={`text-xs font-bold px-2 py-1 rounded mt-1 inline-block ${record.confidence >= 80 ? 'bg-green-100 text-green-700' : record.confidence >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>Conf: {record.confidence || 0}%</div>
                        </td>
                        <td className="p-4">
                          {record.isFallback ? <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold">Fallback Triggered</span> : (record.prescription && record.prescription.length > 0) ? <div className="flex flex-col gap-1">{record.prescription.map((rx, idx) => <span key={idx} className="bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded-md text-xs font-bold flex items-center"><Pill size={12} className="mr-1" /> {rx.name}</span>)}</div> : <span className="text-gray-400 text-xs">No Meds</span>}
                        </td>
                      </tr>
                    ))}
                  {savedPatients.flatMap(p => p.history || []).length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500 font-medium">No predictions logged yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const NavItem = ({ icon: Icon, label, id }) => (
    <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-700'} print:hidden`}>
      <Icon size={20} className={activeTab === id ? 'text-blue-100' : 'text-gray-400'} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-200 print:bg-white print:block">

      {/* Medical Disclaimer Modal */}
      {showDisclaimer && engineState.results && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <div className="flex items-center text-amber-600 mb-4">
              <ShieldAlert size={32} className="mr-3" />
              <h2 className="text-2xl font-black">Medical Disclaimer</h2>
            </div>
            <p className="text-gray-600 font-medium mb-4 leading-relaxed">
              The CuraAI system uses Machine Learning to predict possible conditions and recommend treatments. <strong className="text-red-600">This tool provides preliminary educational assistance only and DOES NOT replace professional doctors or medical advice.</strong>
            </p>
            <ul className="text-gray-600 font-medium mb-8 leading-relaxed list-disc pl-5 space-y-2">
              <li><strong>Dataset Limitations:</strong> The ML model is trained on a synthetic, limited dataset and may lack clinical accuracy.</li>
              <li>Always seek the advice of a qualified health provider with any questions regarding a medical condition.</li>
              <li>Do not use this system in medical emergencies.</li>
            </ul>
            <button onClick={() => setShowDisclaimer(false)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20 print:hidden">
        <div className="flex items-center space-x-2 text-blue-700">
          <Activity size={24} className="stroke-[2.5]" />
          <span className="font-bold text-xl tracking-tight">CuraAI Global</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 p-6 z-10 transition-transform duration-300 overflow-y-auto shadow-2xl md:shadow-none print:hidden flex flex-col justify-between`}>
        <div>
          <div className="hidden md:flex items-center space-x-2 text-blue-700 mb-10">
            <Activity size={28} className="stroke-[2.5]" />
            <span className="font-bold text-2xl tracking-tight">CuraAI <span className="text-gray-800 font-light">Global</span></span>
          </div>

          <div className="mb-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">ML Backend Status</div>
            <div className="flex items-center text-sm font-bold mb-1">
              <Zap size={16} className={isBackendOnline ? "text-green-500 mr-2" : "text-red-500 mr-2"} />
              <span className={isBackendOnline ? "text-green-700" : "text-red-700"}>{isBackendOnline ? 'Scikit-Learn Online' : 'API Offline'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 border-t border-gray-300 pt-2 font-medium">Model: <span className="text-blue-600 font-bold">Random Forest</span></div>
          </div>

          <nav className="space-y-2 mb-10">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">My Dashboard</div>
            <NavItem icon={User} label="My Profile" id="patient_profile" />
            <NavItem icon={ClipboardList} label="Consultation Board" id="consultation" />
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-bold">
          <LogOut size={18} /><span>Logout (@{loggedInUser})</span>
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto print:p-0 print:m-0 print:w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-200 pb-6 print:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {activeTab === 'patient_profile' && 'My Health Profile'}
              {activeTab === 'consultation' && 'Clinical Consultation Board'}
            </h1>
            <p className="text-gray-500 mt-1 flex items-center text-sm md:text-base"><ShieldAlert size={14} className="mr-1 text-blue-500" /> Powered by Scikit-Learn Machine Learning</p>
          </div>
          <div className="flex flex-col bg-white p-3 rounded-xl shadow-sm border border-gray-200 text-sm w-full md:w-auto">
            <span className="font-semibold text-gray-700 mb-1">My Context:</span>
            <div className="flex flex-wrap space-x-3 text-gray-500 items-center">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                {profile.name ? `${profile.name} • ` : ''}{profile.age} Yrs / {profile.gender}
              </span>
            </div>
          </div>
        </header>

        {activeTab === 'patient_profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">

              <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 gap-4">
                <div className="flex-1 w-full flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">My Full Name</label>
                    <input type="text" placeholder="Enter Name..." className="w-full bg-white border border-gray-300 p-2.5 rounded-lg font-bold text-gray-800" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <button onClick={() => handleSaveProfile(null, null)} disabled={!profile.name.trim()} className="mt-5 bg-green-100 text-green-700 p-2.5 px-4 rounded-lg flex items-center font-semibold disabled:opacity-50"><Save size={18} className="mr-2" /> Save</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between items-center">
                  <label className="text-sm font-bold text-gray-700 w-full mb-2 flex items-center justify-between">
                    <span>Age</span>
                  </label>

                  <div
                    className="relative w-full max-w-[220px] h-64 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center overflow-hidden touch-none select-none"
                    onWheel={(e) => {
                      const currentAge = parseInt(profile.age, 10) || 30;
                      if (e.deltaY > 0 && currentAge < 120) setProfile({ ...profile, age: currentAge + 1 });
                      else if (e.deltaY < 0 && currentAge > 1) setProfile({ ...profile, age: currentAge - 1 });
                    }}
                    onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
                    onTouchMove={(e) => {
                      if (!touchStartY) return;
                      const currentY = e.touches[0].clientY;
                      const diff = touchStartY - currentY;
                      const currentAge = parseInt(profile.age, 10) || 30;
                      if (Math.abs(diff) > 20) {
                        if (diff > 0 && currentAge < 120) setProfile({ ...profile, age: currentAge + 1 });
                        else if (diff < 0 && currentAge > 1) setProfile({ ...profile, age: currentAge - 1 });
                        setTouchStartY(currentY);
                      }
                    }}
                  >
                    <div className="absolute top-0 w-full h-16 bg-gradient-to-b from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
                    <div className="flex flex-col items-center justify-center w-full space-y-2">
                      {[-2, -1, 0, 1, 2].map(offset => {
                        const ageVal = (parseInt(profile.age, 10) || 30) + offset;
                        if (ageVal < 1 || ageVal > 120) return <div key={`empty-${offset}`} className="h-14 w-full"></div>;

                        const isCenter = offset === 0;
                        const isEdge = Math.abs(offset) === 2;

                        return (
                          <div
                            key={ageVal}
                            onClick={() => setProfile({ ...profile, age: ageVal })}
                            className={`h-14 w-10/12 mx-auto flex items-center justify-center cursor-pointer transition-all duration-200 ${isCenter
                                ? 'bg-[#F4F7FA] border border-[#E8F0FE] rounded-xl text-5xl font-black text-[#111827] z-0 relative scale-100 py-8'
                                : isEdge
                                  ? 'text-2xl font-bold text-gray-100 scale-90'
                                  : 'text-3xl font-bold text-gray-400 scale-95 hover:text-gray-500'
                              }`}
                          >
                            {ageVal} {isCenter && <span className="text-lg font-bold text-gray-400 ml-2">Yrs</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none"></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-3 font-medium">Scroll or tap to adjust</div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                      <span>Gender</span>
                    </label>
                    <div className="mt-4 flex flex-col space-y-3">
                      {['Male', 'Female'].map(g => (
                        <button key={g} onClick={() => setProfile({ ...profile, gender: g })} className={`py-4 rounded-xl font-bold transition-all border-2 ${profile.gender === g ? 'bg-purple-100 border-purple-500 text-purple-900' : 'bg-white border-gray-200 text-gray-500 hover:border-purple-200'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setActiveTab('consultation')} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center shadow-md hover:bg-blue-700">
                Analyze My Symptoms <ChevronRight size={20} className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'consultation' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
              <div className="lg:col-span-6 space-y-6">

                {/* SYMPTOM SELECTOR */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center"><Stethoscope size={22} className="mr-2 text-blue-600" />Symptom Triage</h2>
                  <p className="text-sm text-gray-500 mb-6">Select the symptoms you are experiencing and assign a severity. The ML model will predict the underlying disease.</p>

                  {/* Selected Symptoms */}
                  {selectedSymptoms.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Selected Symptoms ({selectedSymptoms.length})</h3>
                      <div className="space-y-2">
                        {selectedSymptoms.map(sym => (
                          <div key={sym.name} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 gap-3">
                            <div className="font-semibold text-gray-800 flex items-center">
                              <button onClick={() => toggleSymptom(sym.name)} className="text-red-400 hover:text-red-600 mr-2"><Trash2 size={16} /></button>
                              {formatSymptomName(sym.name)}
                            </div>
                            <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm self-start sm:self-auto">
                              {[
                                { val: 1, label: 'Mild', color: 'hover:bg-yellow-50', active: 'bg-yellow-100 text-yellow-800 font-bold border-yellow-300' },
                                { val: 2, label: 'Moderate', color: 'hover:bg-orange-50', active: 'bg-orange-100 text-orange-800 font-bold border-orange-300' },
                                { val: 3, label: 'Severe', color: 'hover:bg-red-50', active: 'bg-red-100 text-red-800 font-bold border-red-300' }
                              ].map(btn => (
                                <button
                                  key={btn.val}
                                  onClick={() => updateSeverity(sym.name, btn.val)}
                                  className={`px-3 py-1.5 text-xs transition-colors border-r last:border-r-0 border-transparent ${sym.severity === btn.val ? btn.active : `text-gray-500 ${btn.color}`}`}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Symptom */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search and add symptoms..."
                      className="w-full bg-slate-50 border border-gray-300 p-4 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      value={symptomSearch}
                      onChange={(e) => setSymptomSearch(e.target.value)}
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl bg-white p-2 flex flex-wrap gap-2">
                    {filteredSymptoms.map(sym => {
                      const isSelected = selectedSymptoms.find(s => s.name === sym);
                      return (
                        <button
                          key={sym}
                          onClick={() => toggleSymptom(sym)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center border ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-gray-700 hover:bg-slate-100 border-gray-200'}`}
                        >
                          {isSelected ? <Check size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
                          {formatSymptomName(sym)}
                        </button>
                      );
                    })}
                    {filteredSymptoms.length === 0 && <p className="text-gray-400 text-sm p-4 w-full text-center">No matching symptoms found in database.</p>}
                  </div>

                  <button onClick={runAnalysis} disabled={engineState.isAnalyzing || selectedSymptoms.length === 0} className={`w-full mt-8 px-6 py-4 rounded-xl font-bold flex justify-center items-center shadow-lg transition-all ${engineState.isAnalyzing || selectedSymptoms.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'}`}>
                    {engineState.isAnalyzing ? <>Running Model Inference...</> : <>Predict Disease & Treatment <Activity size={20} className="ml-2" /></>}
                  </button>
                </div>
              </div>

              {/* RESULTS SECTION */}
              <div className="lg:col-span-6">
                {engineState.isAnalyzing ? (
                  <div className="h-full min-h-[500px] bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                    <Zap size={48} className="animate-pulse text-indigo-600 mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Data Pipeline...</h3>
                    <p className="text-gray-500 font-medium">Random Forest processing features against trained weights.</p>
                  </div>
                ) : engineState.error ? (
                  <div className="h-full min-h-[500px] bg-red-50 border border-red-200 rounded-3xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                    <AlertTriangle size={64} className="text-red-500 mb-6" />
                    <h3 className="text-2xl font-black text-red-700 mb-4">Inference Failed</h3>
                    <p className="text-red-600 font-medium">{engineState.error}</p>
                  </div>
                ) : engineState.results ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">

                    {/* Disease Prediction Card */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                        <div className="flex items-center text-indigo-400 mb-2 text-sm font-bold tracking-widest uppercase">
                          <HeartPulse size={16} className="mr-2" /> Primary Prediction
                        </div>
                        <h2 className="text-3xl font-black">{engineState.results.predictions[0]?.disease || 'Unknown'}</h2>
                      </div>

                      <div className="p-6 bg-white">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Confidence Scores</h3>
                        <div className="space-y-4">
                          {engineState.results.predictions.map((pred, idx) => (
                            <div key={pred.disease}>
                              <div className="flex justify-between text-sm font-semibold mb-1">
                                <span className={idx === 0 ? "text-gray-900" : "text-gray-500"}>{pred.disease}</span>
                                <span className={idx === 0 ? "text-indigo-600" : "text-gray-500"}>{pred.confidence}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${idx === 0 ? 'bg-indigo-600' : 'bg-gray-400'}`} style={{ width: `${pred.confidence}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Medicine Recommendation Card OR Fallback */}
                    {engineState.results.isFallback ? (
                      <div className="bg-red-50 rounded-3xl shadow-xl overflow-hidden border-2 border-red-200 p-8 text-center">
                        <AlertOctagon size={48} className="mx-auto text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-red-800 mb-2">Low Confidence Prediction</h2>
                        <p className="text-red-700 font-semibold mb-4 leading-relaxed">{engineState.results.message}</p>
                        <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg inline-block font-medium">Insufficient data or contradictory symptoms detected. Treatment blocked for safety.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                        <div className="bg-blue-50 border-b border-blue-100 p-6">
                          <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <Pill size={20} className="mr-2 text-blue-600" /> Recommended Treatment
                          </h2>
                        </div>

                        <div className="p-6">
                          {engineState.results.medicines && engineState.results.medicines.length > 0 ? (
                            <div className="space-y-4">
                              {engineState.results.medicines.map((med, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative overflow-hidden">
                                  <div className={`absolute top-0 left-0 w-1 h-full ${med.priority === 1 ? 'bg-indigo-500' : 'bg-blue-300'}`}></div>
                                  <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-gray-900">{med.name}</h3>
                                    {med.priority && (
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${med.priority === 1 ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-200 text-gray-600'}`}>
                                        Priority {med.priority}
                                      </span>
                                    )}
                                  </div>
                                  <span className="inline-block bg-white text-blue-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-blue-100 mt-1 mb-2">
                                    {med.category}
                                  </span>
                                  <p className="text-sm text-gray-700 font-medium leading-relaxed mb-2">{med.description}</p>
                                  {med.precautions && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center">
                                        <ShieldAlert size={12} className="mr-1" /> Precautions
                                      </p>
                                      <p className="text-xs text-gray-600 font-medium">{med.precautions}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 font-medium p-4 text-center bg-slate-50 rounded-xl border border-slate-200">No specific medicines found for this condition in the dataset.</p>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="h-full min-h-[500px] bg-transparent border-2 border-dashed border-gray-300 rounded-3xl flex items-center justify-center p-12 text-center text-gray-500"><p className="text-lg font-bold text-gray-700">Awaiting Input</p></div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
