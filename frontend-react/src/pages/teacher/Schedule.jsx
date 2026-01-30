import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalISO(d) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const isoDate = toLocalISO;

function startOfIsoWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const distToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + distToMon);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatTime(t) {
  if (!t) return '';
  // backend seems to return "HH:MM" strings; keep as-is but pad if needed
  return String(t).slice(0, 5);
}

function cellKey(dayStr, slotId) {
  return `${dayStr}__${slotId}`;
}

const Badge = ({ kind, children }) => {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider';
  if (kind === 'EXTRA') return <span className={`${base} bg-orange-50 text-orange-700 border border-orange-100`}>{children}</span>;
  if (kind === 'SUBSTITUTION') return <span className={`${base} bg-indigo-50 text-indigo-700 border border-indigo-100`}>{children}</span>;
  if (kind === 'EXAM' || kind === 'EXAM_DUTY') return <span className={`${base} bg-red-50 text-red-700 border border-red-100`}>{children}</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}>{children}</span>;
};

const Schedule = () => {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scheduleByDate, setScheduleByDate] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(''); // YYYY-MM-DD
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const weekStart = useMemo(() => {
    const start = startOfIsoWeek(new Date());
    return addDays(start, weekOffset * 7);
  }, [weekOffset]);

  const weekDates = useMemo(() => {
    // show Mon..Sat (6 days) for clarity in college timetable
    return DAYS.map((_, i) => isoDate(addDays(weekStart, i)));
  }, [weekStart]);

  const timetableMap = useMemo(() => {
    const map = new Map();
    for (const dayStr of Object.keys(scheduleByDate || {})) {
      const events = scheduleByDate[dayStr] || [];
      for (const ev of events) {
        if (!ev?.slot?._id) continue;
        map.set(cellKey(dayStr, ev.slot._id), ev);
      }
    }
    return map;
  }, [scheduleByDate]);

  useEffect(() => {
      if (isModalOpen && selectedDay && selectedSlotId) {
          const fetchRooms = async () => {
              setLoadingRooms(true);
              try {
                  const res = await api.get('/timetable/available-classrooms', {
                      params: { date: selectedDay, timeSlotId: selectedSlotId }
                  });
                  setAvailableClassrooms(res.data);
                  if (res.data.length > 0) setSelectedClassroomId(res.data[0]._id);
              } catch (e) {
                  console.error(e);
              } finally {
                  setLoadingRooms(false);
              }
          };
          fetchRooms();
      }
  }, [isModalOpen, selectedDay, selectedSlotId]);

  const openExtraClassModal = (dayStr, slotId) => {
    setSaveError('');
    setSelectedDay(dayStr);
    setSelectedSlotId(slotId);
    setSelectedAssignmentId(assignments?.[0]?._id || '');
    setSelectedClassroomId('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const teacherId = user?.id || user?._id;
      if (!teacherId) {
        setError('Missing teacher id. Please log out and log back in.');
        return;
      }
      const [ttRes, slotRes, asgnRes] = await Promise.all([
        api.get(`/timetable/teacher-weekly/${teacherId}`, { params: { weekOffset } }),
        api.get('/timeslots'),
        api.get('/subject-assignments'),
      ]);

      // timetable controller returns { start, end, schedule }
      const raw = ttRes.data?.schedule || ttRes.data || {};
      setScheduleByDate(raw);
      setTimeSlots(Array.isArray(slotRes.data) ? slotRes.data : []);
      setAssignments(Array.isArray(asgnRes.data) ? asgnRes.data.filter(a => a.isActive !== false) : []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const teacherId = user?.id || user?._id;
    if (!teacherId) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?._id, weekOffset]);

  const handleCreateExtraClass = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaving(true);
    try {
      if (!selectedAssignmentId || !selectedDay || !selectedSlotId) {
        setSaveError('Please choose subject, day and time slot.');
        return;
      }
      if (!selectedClassroomId) {
        setSaveError('Please choose a classroom.');
        return;
      }

      await api.post('/timetable/extra', {
        subjectAssignmentId: selectedAssignmentId,
        date: selectedDay,
        timeSlotId: selectedSlotId,
        classroomId: selectedClassroomId,
      });

      setIsModalOpen(false);
      await fetchData();
    } catch (e2) {
      setSaveError(e2?.response?.data?.message || 'Could not create extra class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Academic Schedule</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Monitor your upcoming sessions and schedule <span className="text-slate-900 font-bold underline decoration-primary-500 underline-offset-4">extra classes</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-3 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 py-2.5 bg-slate-50 text-slate-800 rounded-xl font-black text-xs uppercase tracking-widest min-w-[200px] text-center border border-slate-100">
            Week Beginning: {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-3 hover:bg-slate-50 rounded-xl text-slate-500 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-50 border border-red-100 text-red-700 rounded-3xl font-bold">{error}</div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium p-24 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Schedule...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-6 px-6 w-[200px] text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Chronology</th>
                  {weekDates.map((d, idx) => (
                    <th key={d} className="py-6 px-6 min-w-[240px] border-b border-slate-100 border-l border-slate-50">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-800 font-black text-xs uppercase tracking-widest">{DAYS[idx]}</span>
                        <span className="text-[11px] font-bold text-slate-400">{new Date(d).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {timeSlots.map((slot) => (
                  <tr key={slot._id} className="hover:bg-slate-50/30 transition-all align-top">
                    <td className="py-6 px-6 border-r border-slate-50 group">
                      <div className="font-extrabold text-slate-900 text-sm group-hover:text-primary-600 transition-colors">
                        {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{slot.slotName}</div>
                    </td>

                    {weekDates.map((dayStr) => {
                      const ev = timetableMap.get(cellKey(dayStr, slot._id));
                      const isEmpty = !ev;
                      return (
                        <td key={`${dayStr}_${slot._id}`} className="py-4 px-4 border-l border-slate-50">
                          {isEmpty ? (
                            <button
                              onClick={() => openExtraClassModal(dayStr, slot._id)}
                              className="w-full h-[100px] rounded-3xl border border-dashed border-slate-200 bg-slate-50/20 hover:bg-primary-50 hover:border-primary-200 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary-600 group"
                            >
                              <Plus className="w-5 h-5 text-slate-200 group-hover:text-primary-400 group-hover:scale-110 transition-all" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Available</span>
                            </button>
                          ) : (
                            <div className="w-full min-h-[100px] rounded-[32px] border border-slate-100 bg-white shadow-sm p-5 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group">
                               {ev.type === 'EXTRA' && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />}
                               <div className="flex items-center justify-between gap-3 mb-3">
                                <Badge kind={ev.type}>{ev.type}</Badge>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {ev.classroom?.roomNumber || 'N/A'}
                                </div>
                              </div>
                              <div className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-tight">
                                {ev.type.includes('EXAM') ? ev.title : (ev.subject?.subjectName || 'Academic Session')}
                              </div>
                              
                              {!ev.type.includes('EXAM') && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-100">
                                         {ev.subject?.subjectCode?.slice(0, 2)}
                                     </div>
                                     <span className="text-[11px] font-bold text-slate-500">{ev.subject?.subjectCode}</span>
                                  </div>
                                  <div className="px-3 py-1.5 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-600 flex items-center justify-between">
                                    <span>{ev.classGroup?.department}</span>
                                    <span>Sem {ev.classGroup?.semester}({ev.classGroup?.section})</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Academic Schedule Overwrite">
        <form onSubmit={handleCreateExtraClass} className="space-y-6">
          {saveError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-shake">{saveError}</div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Date</label>
              <input readOnly value={selectedDay} className="input-field bg-slate-50 border-slate-100 font-bold text-slate-600" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Selected Slot</label>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="input-field py-3.5"
              >
                {timeSlots.map((s) => (
                  <option key={s._id} value={s._id}>
                    {formatTime(s.startTime)} - {formatTime(s.endTime)} ({s.slotName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Assign Subject Portfolio</label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              className="input-field py-4 font-bold text-slate-800"
            >
              <option value="">Choose an active assignment...</option>
              {assignments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.subjectId?.subjectName} — {a.classGroupId?.department} Sem {a.classGroupId?.semester}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Available Examination Hall / Classroom</label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="input-field py-3.5"
              disabled={loadingRooms}
            >
                <option value="">{loadingRooms ? 'SYNCING ROOM DATABASE...' : 'SELECT A FREE ROOM'}</option>
              {availableClassrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.roomNumber} — {c.building} ({c.type || 'Lecture'})
                </option>
              ))}
            </select>
            {availableClassrooms.length === 0 && !loadingRooms && selectedSlotId && (
                <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg mt-1 italic leading-tight">
                    * CONFLICT DETECTED: No unoccupied classrooms found for this time slot on the selected date.
                </p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              disabled={saving}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={saving || !selectedClassroomId || !selectedAssignmentId}
              className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Confirm Schedule Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;


