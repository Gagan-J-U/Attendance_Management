import {
    AlertCircle,
    BookOpen,
    CheckCircle,
    ExternalLink,
    Plus,
    TrendingUp,
    Users
} from 'lucide-react';
import { createElement, useEffect, useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="card hover:border-primary-200 transition-all cursor-default group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
        {Icon ? createElement(Icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` }) : null}
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value ?? '—'}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    students: null,
    subjects: 0,
    activeSessions: null
  });
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [teachersRes, subjectsRes, assignmentsRes] = await Promise.all([
          api.get('/teachers'),
          api.get('/subjects'),
          api.get('/subject-assignments')
        ]);
        if (cancelled) return;
        setStats((s) => ({
          ...s,
          teachers: Array.isArray(teachersRes.data) ? teachersRes.data.length : 0,
          subjects: Array.isArray(subjectsRes.data) ? subjectsRes.data.length : 0
        }));
        setRecentAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data.slice(0, 5) : []);
      } catch {
        // keep UI functional even if stats endpoints fail
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Overview</h1>
        <p className="text-slate-500">Welcome back. Here's what's happening in your college today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Teachers" 
          value={stats.teachers} 
          icon={Users} 
          trend="+4%" 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Active Students" 
          value={stats.students} 
          icon={Users} 
          trend="+12%" 
          color="bg-primary-600" 
        />
        <StatCard 
          title="Subjects Offered" 
          value={stats.subjects} 
          icon={BookOpen} 
          color="bg-violet-600" 
        />
        <StatCard 
          title="Live Sessions" 
          value={stats.activeSessions} 
          icon={CheckCircle} 
          color="bg-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800">Recent Subject Assignments</h2>
              <Link to="/admin/subjects" className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline">
                Manage <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-4">Subject</th>
                    <th className="pb-4">Teacher</th>
                    <th className="pb-4">Class Group</th>
                    <th className="pb-4">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAssignments.length === 0 ? (
                    <tr>
                      <td className="py-6 text-slate-500 font-medium" colSpan={4}>
                        No assignments found yet. Create one from the Subjects page.
                      </td>
                    </tr>
                  ) : recentAssignments.map((asgn) => (
                    <tr key={asgn._id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-medium text-slate-700">{asgn.subjectId?.subjectName} ({asgn.subjectId?.subjectCode})</td>
                      <td className="py-4 text-slate-600">{asgn.teacherId?.name || '—'}</td>
                      <td className="py-4 text-slate-600">
                        {asgn.classGroupId?.department} • Sem {asgn.classGroupId?.semester} ({asgn.classGroupId?.section})
                      </td>
                      <td className="py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                          {asgn.subjectAssignmentType}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <h2 className="text-lg font-bold mb-2">Quick Actions</h2>
            <p className="text-slate-400 text-sm mb-6">Commonly used administrative tasks.</p>
            
            <div className="space-y-3 relative z-10">
              <Link to="/admin/teachers" className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium">
                <Plus className="w-4 h-4 text-primary-400" />
                Add New Teacher
              </Link>
              <Link to="/admin/subjects" className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Create Subject Assignment
              </Link>
              <Link to="/admin/exams" className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                Schedule Exam
              </Link>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Storage Usage</h2>
            <div className="flex items-center gap-4 mb-2">
               <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-primary-600 rounded-full w-[65%] shadow-sm shadow-primary-500/20"></div>
               </div>
               <span className="text-xs font-bold text-slate-500">65%</span>
            </div>
            <p className="text-xs text-slate-400">Notes and session logs are using 4.2GB of 10GB limited bandwidth.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
