import { CalendarDays, Info, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

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
  const day = d.getDay();
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
  return String(t || '').slice(0, 5);
}

export default function TimetableAdmin() {
  const [classGroups, setClassGroups] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleByDate, setScheduleByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null); // { day, slot, existingEv }
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
      subjectAssignmentId: '',
      classroomNumber: '',
      academicYear: ''
  });
  const [classrooms, setClassrooms] = useState([]);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active, inactive, all

  const weekStart = useMemo(() => addDays(startOfIsoWeek(new Date()), weekOffset * 7), [weekOffset]);
  const weekDates = useMemo(() => DAYS.map((_, i) => isoDate(addDays(weekStart, i))), [weekStart]);

  const filteredGroups = useMemo(() => {
    return classGroups.filter(g => {
        const matchDept = !deptFilter || g.department === deptFilter;
        const matchSem = !semFilter || g.semester.toString() === semFilter;
        const matchStatus = statusFilter === 'all' ? true : (statusFilter === 'active' ? g.isActive !== false : g.isActive === false);
        return matchDept && matchSem && matchStatus;
    });
  }, [classGroups, deptFilter, semFilter, statusFilter]);

  const departments = useMemo(() => [...new Set(classGroups.map(g => g.department))], [classGroups]);
  const semesters = useMemo(() => [...new Set(classGroups.map(g => g.semester.toString()))].sort(), [classGroups]);

  const timetableMap = useMemo(() => {
    const map = new Map();
    for (const dayStr of Object.keys(scheduleByDate || {})) {
      for (const ev of scheduleByDate[dayStr] || []) {
        if (!ev?.slot?._id) continue;
        map.set(`${dayStr}__${ev.slot._id}`, ev);
      }
    }
    return map;
  }, [scheduleByDate]);

  const fetchBasics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [groupsRes, slotRes, assignmentRes, classroomRes] = await Promise.all([
        api.get('/classgroups'),
        api.get('/timeslots'),
        selectedGroupId ? api.get(`/subject-assignments/class/${selectedGroupId}`) : Promise.resolve({ data: [] }),
        api.get('/classrooms')
      ]);
      const gs = Array.isArray(groupsRes.data) ? groupsRes.data : [];
      setClassGroups(gs);
      setTimeSlots(Array.isArray(slotRes.data) ? slotRes.data : []);
      setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : []);
      setClassrooms(Array.isArray(classroomRes.data) ? classroomRes.data : []);
      if (!selectedGroupId) {
        const firstActive = gs.find((g) => g.isActive !== false);
        if (firstActive?._id) setSelectedGroupId(firstActive._id);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load class groups/time slots.');
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  const fetchTimetable = useCallback(async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/timetable/weekly/${groupId}`, { params: { weekOffset } });
      setScheduleByDate(res.data?.schedule || res.data || {});
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load weekly timetable.');
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { fetchBasics(); }, [fetchBasics, selectedGroupId]);
  useEffect(() => { if (selectedGroupId) fetchTimetable(selectedGroupId); }, [selectedGroupId, fetchTimetable]);

  const handleSlotClick = (day, slot, existingEv = null) => {
      setEditingEntry({ day, slot, existingEv });
      setFormData({
          subjectAssignmentId: existingEv?.subjectAssignmentId?._id || '',
          classroomNumber: existingEv?.classroom?._id || '',
          academicYear: selectedGroup?.academicYear || ''
      });
      setAssignmentSearch('');
      setAvailableClassrooms([]);
      setModalOpen(true);
  };

  useEffect(() => {
      if (modalOpen && editingEntry?.slot?._id) {
          const fetchAvailableRooms = async () => {
              setLoadingRooms(true);
              try {
                  const params = {
                      dayOfWeek: editingEntry.day,
                      timeSlotId: editingEntry.slot._id
                  };
                  if (editingEntry.existingEv?.timetableId) {
                      params.excludeTimetableId = editingEntry.existingEv.timetableId;
                  }
                  const res = await api.get('/timetable/available-classrooms', { params });
                  setAvailableClassrooms(res.data);
              } catch (err) {
                  console.error(err);
              } finally {
                  setLoadingRooms(false);
              }
          };
          fetchAvailableRooms();
      }
  }, [modalOpen, editingEntry]);

  const handleSave = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          const payload = {
              ...formData,
              dayOfWeek: editingEntry.day,
              timeSlotId: editingEntry.slot._id,
              validFrom: new Date()
          };

          if (editingEntry.existingEv?.timetableId) {
             // Actually, if it's already there, we might want to update or replace.
             // For simplicity, let's just create new if not exists, or we could add UPDATE logic in controller
             await api.patch(`/timetable/${editingEntry.existingEv.timetableId}`, payload);
          } else {
              await api.post('/timetable', payload);
          }
          fetchTimetable(selectedGroupId);
          setModalOpen(false);
      } catch (err) {
          setError(err.response?.data?.message || 'Error saving timetable entry');
      } finally {
          setSubmitting(false);
      }
  };

  const handleDelete = async (e, id) => {
      e.stopPropagation();
      if (!window.confirm('Delete this entry?')) return;
      try {
          await api.delete(`/timetable/${id}`);
          fetchTimetable(selectedGroupId);
      } catch (err) {
          alert('Error deleting');
      }
  };

  const selectedGroup = classGroups.find((g) => g._id === selectedGroupId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Timetable</h1>
          </div>
          <p className="text-slate-500 font-medium">View weekly timetable for a class group.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select 
                className="input-field py-2 px-4 text-sm w-full sm:w-auto min-w-[140px]"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
            >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
                className="input-field py-2 px-4 text-sm w-full sm:w-auto min-w-[120px]"
                value={semFilter}
                onChange={(e) => setSemFilter(e.target.value)}
            >
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
            <select 
                className="input-field py-2 px-4 text-sm w-full sm:w-auto min-w-[120px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="all">All Status</option>
            </select>

            <select
                className="input-field py-2.5 font-bold text-primary-700 bg-primary-50 border-primary-200 w-full sm:w-auto min-w-[200px]"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
            >
                <option value="">Select class group</option>
                {filteredGroups.map((g) => (
                <option key={g._id} value={g._id}>
                    {g.department} • Sem {g.semester} ({g.section}) {g.isActive === false ? ' [INACTIVE]' : ''}
                </option>
                ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="btn-secondary h-10 px-4">Prev</button>
            <button onClick={() => setWeekOffset(0)} className="btn-secondary h-10 px-4">This Week</button>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="btn-secondary h-10 px-4">Next</button>
          </div>
        </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3">
        <Info className="w-5 h-5 text-slate-400 mt-0.5" />
        <div className="text-sm text-slate-600">
          <div className="font-bold text-slate-800">Note</div>
          <div>
            The backend currently exposes weekly views (`GET /timetable/weekly/:classGroupId`) plus overrides/extra classes.
            It does <span className="font-semibold">not</span> expose an endpoint to create the base (regular) timetable from the admin UI.
            Once regular timetables exist in the DB, you can view them here.
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-premium p-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading timetable…</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-premium overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-slate-800">
              {selectedGroup ? `${selectedGroup.department} • Sem ${selectedGroup.semester} (${selectedGroup.section})` : '—'}
            </div>
            <div className="text-sm text-slate-500 font-medium">Week of {weekStart.toLocaleDateString()}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <th className="py-4 px-5 w-[180px]">Time Slot</th>
                  {weekDates.map((d, idx) => (
                    <th key={d} className="py-4 px-5 min-w-[220px]">
                      <div className="flex flex-col">
                        <span className="text-slate-700">{DAYS[idx]}</span>
                        <span className="text-[11px] font-semibold text-slate-400 normal-case tracking-normal">{d}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {timeSlots.map((slot) => (
                  <tr key={slot._id} className="hover:bg-slate-50/40 transition-colors align-top">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${slot.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <div className={`font-bold ${slot.isActive !== false ? 'text-slate-800' : 'text-slate-400'}`}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1 ml-3.5">{slot.slotName || 'Period'} {slot.isActive === false ? '(Disabled)' : ''}</div>
                    </td>

                    {DAYS.map((dayName, idx) => {
                      const dayDateStr = weekDates[idx];
                      const ev = timetableMap.get(`${dayDateStr}__${slot._id}`);
                      return (
                        <td 
                          key={`${dayName}_${slot._id}`} 
                          className="py-4 px-5 cursor-pointer"
                          onClick={() => handleSlotClick(dayName, slot, ev)}
                        >
                          {!ev ? (
                            <div className="w-full h-[86px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 hover:bg-slate-100/50 hover:border-primary-300 transition-all flex items-center justify-center">
                                <Plus className="w-5 h-5 text-slate-300" />
                            </div>
                          ) : (
                            <div className="w-full min-h-[86px] rounded-2xl border border-slate-100 bg-white shadow-sm p-4 hover:shadow-md transition-all relative group/card">
                              <button 
                                onClick={(e) => handleDelete(e, ev.timetableId)}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500 hover:text-white border border-red-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="font-bold text-slate-800 line-clamp-1">
                                {ev.type === 'EXAM' ? ev.title : (ev.subject?.subjectName || 'Class')}
                              </div>
                              <div className="text-xs text-slate-600 font-medium mt-1">
                                {ev.classroom?.roomNumber ? <span className="text-primary-700">{ev.classroom.roomNumber}</span> : 'Room'}
                                {ev.teacher?.name ? ` • ${ev.teacher.name}` : ''}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                                {ev.type}
                              </div>
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

      {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {editingEntry.existingEv ? 'Edit Class' : 'Assign Class'}
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {editingEntry.day} • {editingEntry.slot.slotName}
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Subject & Teacher</label>
                                <div className="space-y-2">
                                    <input 
                                        type="text" 
                                        placeholder="Search subject or teacher..." 
                                        className="input-field py-2 text-xs"
                                        value={assignmentSearch}
                                        onChange={(e) => setAssignmentSearch(e.target.value)}
                                    />
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.subjectAssignmentId}
                                        onChange={(e) => setFormData({ ...formData, subjectAssignmentId: e.target.value })}
                                    >
                                        <option value="">Select Assignment</option>
                                        {assignments.length === 0 && <option disabled>No active assignments found for this class</option>}
                                        {assignments.filter(as => 
                                            as.subjectId?.subjectName?.toLowerCase().includes(assignmentSearch.toLowerCase()) || 
                                            as.teacherId?.name?.toLowerCase().includes(assignmentSearch.toLowerCase())
                                        ).map(as => (
                                            <option key={as._id} value={as._id}>
                                                {as.subjectId?.subjectName} — {as.teacherId?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-400 px-1 font-medium italic">Showing active subject assignments for this class group.</p>
                            </div>

                            <div className="space-y-1.5">
                                    <select
                                        required
                                        className="input-field"
                                        value={formData.classroomNumber}
                                        onChange={(e) => setFormData({ ...formData, classroomNumber: e.target.value })}
                                        disabled={loadingRooms}
                                    >
                                        <option value="">{loadingRooms ? 'Fetching available rooms...' : 'Select Room'}</option>
                                        {availableClassrooms.map(c => (
                                            <option key={c._id} value={c._id}>{c.roomNumber} — {c.building} ({c.type})</option>
                                        ))}
                                    </select>
                                    {!loadingRooms && availableClassrooms.length === 0 && (
                                        <p className="text-[10px] text-red-500 font-bold px-1 italic mt-1">
                                            * No rooms available for this time slot.
                                        </p>
                                    )}
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3.5 px-4 bg-primary-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {editingEntry.existingEv ? 'UPDATE' : 'SAVE ENTRY'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    </div>
  );
}


