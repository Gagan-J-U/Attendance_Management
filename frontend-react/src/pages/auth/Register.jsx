import { ArrowLeft, Briefcase, Loader2, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher', // Default to teacher
    employeeId: '',
    department: '',
    adminLevel: 1
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'teacher' ? {
            teacherInfo: {
                employeeId: formData.employeeId,
                department: formData.department
            }
        } : {}),
        ...(formData.role === 'admin' ? {
          adminInfo: { adminLevel: Number(formData.adminLevel) || 1 }
        } : {})
      };

      await api.post('/auth/register', payload);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Sidebar Decoration */}
      <div className="hidden lg:flex w-1/3 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-600/20 rounded-full -ml-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-20 group">
             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
             <span className="text-sm font-bold uppercase tracking-widest">Back to Login</span>
          </Link>
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-8">
            A
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight">Create Your Professional Account</h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Join the Antigravity community today. Access your specialized dashboard and start managing assignments with ease.
          </p>
        </div>
        
        <div className="relative z-10 pt-10 border-t border-white/10">
           <p className="text-sm text-slate-500 font-medium">© 2026 Antigravity Systems. All rights reserved.</p>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="w-full lg:w-2/3 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-xl w-full py-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Registration</h2>
          <p className="text-slate-500 mb-8">Enter your details to create your secure account.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    placeholder="john@college.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Access Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select 
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.role === 'teacher' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-100 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Employee ID</label>
                  <input 
                    name="employeeId"
                    required
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500"
                    placeholder="TCH-001"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Department</label>
                  <select 
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500"
                  >
                    <option value="">Select Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Information Science">Information Science</option>
                  </select>
                </div>
              </div>
            )}

            {formData.role === 'admin' && (
              <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Level</label>
                <input
                  name="adminLevel"
                  type="number"
                  min="1"
                  value={formData.adminLevel}
                  onChange={handleChange}
                  className="mt-2 w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-primary-500"
                  placeholder="1"
                />
                <p className="text-xs text-slate-500 mt-2">Required by the backend for admin accounts.</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
