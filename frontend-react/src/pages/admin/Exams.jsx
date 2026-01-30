import { AlertTriangle, CalendarDays, Loader2, Plus, Save, School, Timer, Trash2, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

export default function ExamsAdmin() {
  const [classGroups, setClassGroups] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [exams, setExams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '12:00',
    classGroupId: '',
    studentCount: 0,
    classroomId: '',
    invigilatorTeacherId: '',
  });

  const fetchBasics = async () => {
    try {
      const [groupsRes, roomsRes, teachersRes] = await Promise.all([
        api.get('/classgroups'),
        api.get('/classrooms'),
        api.get('/teachers')
      ]);
      const gs = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      const rs = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const ts = teachersRes.data?.teachers || [];
      setClassGroups(gs);
      setClassrooms(rs);
      setTeachers(ts);

      setForm((f) => ({
        ...f,
        classGroupId: f.classGroupId || gs.find((g) => g.isActive !== false)?._id || '',
        classroomId: f.classroomId || rs[0]?._id || '',
        invigilatorTeacherId: f.invigilatorTeacherId || ts[0]?._id || ''
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedGroupFilter) params.classGroupId = selectedGroupFilter;
      if (dateFilter) {
          params.startDate = dateFilter;
          params.endDate = dateFilter;
      }
      const res = await api.get('/exams', { params });
      setExams(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load exams.');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupFilter, dateFilter]);

  useEffect(() => { 
      fetchBasics(); 
      fetchExams();
  }, [fetchExams]);

  const selectedGroup = useMemo(() => classGroups.find((g) => g._id === form.classGroupId), [classGroups, form.classGroupId]);

  const openCreate = () => {
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to cancel/delete this exam?')) return;
      try {
          await api.delete(`/exams/${id}`);
          fetchExams();
      } catch (err) {
          alert('Error deleting exam');
      }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/exams', {
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        allocations: [{
          classGroupId: form.classGroupId,
          studentCount: Number(form.studentCount),
          classroomNumber: form.classroomId
        }],
        invigilators: [{
          teacherId: form.invigilatorTeacherId,
          classroomNumber: form.classroomId
        }]
      });
      setIsModalOpen(false);
      fetchExams();
    } catch (e2) {
      setFormError(e2.response?.data?.message || 'Failed to schedule exam.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Examination Hub</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage and monitor all scheduled tests and academic examinations.</p>
        </div>
        <button 
            onClick={openCreate} 
            className="flex items-center gap-2 px-6 py-3.5 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm tracking-tight"
        >
          <Plus className="w-5 h-5" />
          SCHEDULE NEW EXAM
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-premium">
        <div className="flex-1 min-w-[240px] relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
                className="input-field pl-11 py-3 text-sm font-bold text-slate-700 bg-slate-50/50 border-transparent focus:bg-white"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
            >
                <option value="">All Class Groups</option>
                {classGroups.map(g => (
                    <option key={g._id} value={g._id}>{g.department} • Sem {g.semester} ({g.section})</option>
                ))}
            </select>
        </div>
        <div className="flex-1 min-w-[200px] relative">
            <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
                type="date" 
                className="input-field pl-11 py-3 text-sm font-bold text-slate-700 bg-slate-50/50 border-transparent focus:bg-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
            />
        </div>
        <button 
            onClick={() => { setSelectedGroupFilter(''); setDateFilter(''); }}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Clear Filters"
        >
            <X className="w-5 h-5" />
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium p-24 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Examination Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100">
                <CalendarDays className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold">No exams found for the selected filters.</p>
            </div>
          ) : (
            exams.map((exam) => (
                <div key={exam._id} className="card p-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none bg-white">
                    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <School className="w-16 h-16" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                                {new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <button 
                                onClick={() => handleDelete(exam._id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500 text-white rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <h3 className="text-xl font-bold mb-1 tracking-tight">{exam.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <Timer className="w-3.5 h-3.5" />
                            {exam.startTime} — {exam.endTime}
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                        {exam.allocations.map((alloc, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-xs">
                                        R{alloc.classroomNumber?.roomName || '??'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classroom / Block</p>
                                        <p className="font-bold text-slate-800">{alloc.classroomNumber?.roomName} ({alloc.classroomNumber?.block || 'Main'})</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Group</p>
                                        <p className="text-xs font-bold text-slate-700">Sem {alloc.classGroupId?.semester} - {alloc.classGroupId?.section}</p>
                                        <p className="text-[10px] text-slate-500 italic mt-0.5">{alloc.classGroupId?.department}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invigilator</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{exam.invigilators?.[0]?.teacherId?.name || 'Assigned'}</p>
                                        <p className="text-[10px] text-slate-500 italic mt-0.5">Teacher</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => (formLoading ? null : setIsModalOpen(false))} title="Schedule Examination">
        <form className="space-y-6" onSubmit={submit}>
          {formError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium animate-shake">{formError}</div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Examination Title</label>
            <input className="input-field py-4" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. End Semester Exam - Algorithms" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Start</label>
              <input type="time" className="input-field" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">End</label>
              <input type="time" className="input-field" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Target Class Group</label>
              <select className="input-field py-3.5" value={form.classGroupId} onChange={(e) => setForm((f) => ({ ...f, classGroupId: e.target.value }))} required>
                <option value="">Select group</option>
                {classGroups.filter((g) => g.isActive !== false).map((g) => (
                  <option key={g._id} value={g._id}>{g.department} • Sem {g.semester} ({g.section})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Expected Strength</label>
              <input type="number" min="0" className="input-field py-3.5" value={form.studentCount} onChange={(e) => setForm((f) => ({ ...f, studentCount: e.target.value }))} placeholder="Total Students" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Examination Hall</label>
              <select className="input-field py-3.5" value={form.classroomId} onChange={(e) => setForm((f) => ({ ...f, classroomId: e.target.value }))} required>
                <option value="">Select room</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>{c.roomName} — {c.block}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Invigilator</label>
              <select className="input-field py-3.5" value={form.invigilatorTeacherId} onChange={(e) => setForm((f) => ({ ...f, invigilatorTeacherId: e.target.value }))} required>
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t._id} value={t._id}>{t.name} ({t.teacherInfo?.department})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Discard</button>
            <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2" disabled={formLoading}>
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
              {formLoading ? 'PLANNING...' : 'CONFIRM SCHEDULE'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


