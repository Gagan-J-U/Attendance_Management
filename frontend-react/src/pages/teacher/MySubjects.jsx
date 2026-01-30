import {
    BarChart3,
    BookOpen,
    ChevronRight,
    FileText,
    Loader2,
    MessageSquare,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const MySubjects = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssignments();
  }, []);

  const fetchMyAssignments = async () => {
    try {
      const response = await api.get('/subject-assignments');
      setAssignments(response.data.filter(a => a.isActive !== false));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Subject Load</h1>
          <p className="text-slate-500">View and manage attendance, notes and chat for your assigned subjects.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-2xl border border-slate-100 shadow-premium">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your academic load...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {assignments.map((asgn) => (
            <div key={asgn._id} className="card p-0 overflow-hidden group hover:shadow-2xl transition-all border-none">
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white relative">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                   <BookOpen className="w-16 h-16 text-primary-600" />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                   <span className="px-2 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                     {asgn.subjectAssignmentType}
                   </span>
                   <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                     {asgn.subjectId?.subjectCode}
                   </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-primary-600 transition-colors">
                  {asgn.subjectId?.subjectName}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {asgn.classGroupId?.department} • Sem {asgn.classGroupId?.semester} ({asgn.classGroupId?.section})
                </p>
              </div>

              <div className="p-6 border-t border-slate-50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Students</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-800">{asgn.classGroupId?.students?.length || 0}</span>
                      </div>
                   </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Attd.</p>
                       <div className="flex items-center gap-2">
                         <BarChart3 className="w-4 h-4 text-emerald-600" />
                         <span className="font-bold text-slate-800">—%</span>
                       </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <button className="flex-1 p-2 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                      <MessageSquare className="w-3.5 h-3.5" />
                      CHAT
                   </button>
                   <button className="flex-1 p-2 bg-white border border-slate-100 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-xs font-bold text-slate-600">
                      <FileText className="w-3.5 h-3.5" />
                      NOTES
                   </button>
                </div>

                <Link 
                  to={`/teacher/subjects/${asgn._id}`}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all group/btn"
                >
                  <span className="font-bold text-sm tracking-tight">Manage Subject</span>
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubjects;
