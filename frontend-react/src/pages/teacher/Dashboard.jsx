import {
    AlertCircle,
    BookOpen,
    ChevronRight,
    Plus,
    Play
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

const ScheduleIcon = ({ type }) => {
  switch(type) {
    case 'REGULAR': return <div className="p-2 bg-primary-100 text-primary-600 rounded-lg"><BookOpen className="w-4 h-4" /></div>;
    case 'EXTRA': return <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Plus className="w-4 h-4" /></div>;
    case 'EXAM_DUTY': return <div className="p-2 bg-red-100 text-red-600 rounded-lg"><AlertCircle className="w-4 h-4" /></div>;
    default: return null;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scheduleByDate, setScheduleByDate] = useState({});
  const [error, setError] = useState('');

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [startMethod, setStartMethod] = useState('manual');
  const [activeEvent, setActiveEvent] = useState(null);
  const [startError, setStartError] = useState('');
  const [startLoading, setStartLoading] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todaysEvents = useMemo(() => (scheduleByDate?.[todayStr] || []), [scheduleByDate, todayStr]);

  useEffect(() => {
    const teacherId = user?.id || user?._id;
    if (!teacherId) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await api.get(`/timetable/teacher-weekly/${teacherId}`, { params: { weekOffset: 0 } });
        setScheduleByDate(res.data?.schedule || res.data || {});
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load today’s schedule.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, user?._id]);

  const openStart = (ev) => {
    setActiveEvent(ev);
    setStartMethod('manual');
    setStartError('');
    setIsStartOpen(true);
  };

  const startSession = async (e) => {
    e.preventDefault();
    setStartError('');
    setStartLoading(true);
    try {
      if (!activeEvent?.timetableId) {
        setStartError('This slot cannot start a session (missing timetableId).');
        return;
      }
      await api.post('/attendance/start', {
        timetableId: activeEvent.timetableId,
        date: todayStr,
        method: startMethod
      });
      setIsStartOpen(false);
      alert('Attendance session started.');
    } catch (err) {
      setStartError(err.response?.data?.message || 'Could not start session.');
    } finally {
      setStartLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hello, Professor {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500">You have {todaysEvents.length} sessions scheduled for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700">Spring 2026</p>
            <p className="text-xs text-slate-400 font-medium">Academic Session</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center text-primary-600 font-bold">
            S26
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Today's Schedule</h2>
            <a href="/teacher/schedule" className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline">
              Full Timetable <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-4">
            {error ? (
              <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div>
            ) : null}
            {loading ? (
              <div className="p-10 bg-white rounded-2xl border border-slate-100 text-slate-500 font-medium">Loading…</div>
            ) : todaysEvents.length === 0 ? (
              <div className="p-10 bg-white rounded-2xl border border-slate-100 text-slate-500 font-medium">No sessions scheduled for today.</div>
            ) : todaysEvents.map((item) => (
              <div key={item.timetableId || `${item.type}_${item.slot?._id || item.startTime}`} className="card group hover:border-primary-100 transition-all flex items-center gap-6">
                <div className="flex flex-col items-center min-w-[60px]">
                  <p className="text-sm font-bold text-slate-800">{item.slot?.startTime || item.startTime}</p>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider ">{item.slot?.endTime || item.endTime}</p>
                </div>
                
                <div className="w-full h-12 flex-1 flex items-center justify-between border-l border-slate-100 pl-6">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${item.type === 'EXAM' ? 'bg-red-500' : 'bg-primary-500'}`}></span>
                        <h3 className="font-bold text-slate-800">{item.type === 'EXAM' ? item.title : item.subject?.subjectName}</h3>
                     </div>
                     <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                       {item.classGroup ? `${item.classGroup.department} • Sem ${item.classGroup.semester} (${item.classGroup.section})` : ''} • <span className="text-primary-600">{item.classroom?.roomNumber || 'Room'}</span>
                     </p>
                   </div>

                   <div className="flex items-center gap-3">
                     <button
                       onClick={() => openStart(item)}
                       disabled={!item.timetableId}
                       className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 px-4 whitespace-nowrap disabled:opacity-50"
                     >
                       <Play className="w-4 h-4 fill-white" />
                       <span className="text-xs font-bold font-mono">START</span>
                     </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          <div className="card border-none bg-gradient-to-br from-primary-600 to-indigo-700 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
             <h3 className="font-bold text-lg mb-4">Manual Marking</h3>
             <p className="text-primary-100 text-sm mb-6 leading-relaxed">
               Need to mark a past session? Manual marking remains open for all your previous sessions.
             </p>
             <button className="w-full py-3 bg-white text-primary-700 rounded-xl font-bold text-sm shadow-xl shadow-primary-900/20 hover:bg-primary-50 transition-all">
               Access Records
             </button>
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Tip</h2>
            <p className="text-sm text-slate-500">
              Use <span className="font-semibold text-slate-800">My Subjects</span> for class-wise notes/chat and the weekly timetable to schedule extra classes.
            </p>
          </div>
        </div>
      </div>

      <Modal isOpen={isStartOpen} onClose={() => (startLoading ? null : setIsStartOpen(false))} title="Start Attendance Session">
        <form className="space-y-4" onSubmit={startSession}>
          {startError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{startError}</div>
          ) : null}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="font-bold text-slate-800">
              {activeEvent?.subject?.subjectName || activeEvent?.title || 'Session'}
            </div>
            <div className="text-sm text-slate-600 mt-1">
              End time: <span className="font-semibold">{activeEvent?.slot?.endTime || activeEvent?.endTime || '—'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Method</label>
            <select className="input-field py-2.5" value={startMethod} onChange={(e) => setStartMethod(e.target.value)} required>
              <option value="manual">manual</option>
              <option value="fingerprint">fingerprint</option>
            </select>
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsStartOpen(false)} disabled={startLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20" disabled={startLoading}>
              {startLoading ? 'Starting…' : 'Start'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
