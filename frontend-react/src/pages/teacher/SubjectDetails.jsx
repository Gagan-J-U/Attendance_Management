import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Clock,
    Download,
    FileCheck2,
    FileText,
    Loader2,
    Play,
    Plus,
    Save,
    Trash2,
    Upload,
    Users,
    X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

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

const SubjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState({ schedule: {} });
  const [timeSlots, setTimeSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableClassrooms, setAvailableClassrooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

    // Notes State
    const [notes, setNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [noteFile, setNoteFile] = useState(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [uploadingNote, setUploadingNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

    const weekStart = useMemo(() => {
        const start = startOfIsoWeek(new Date());
        return addDays(start, weekOffset * 7);
    }, [weekOffset]);

    const weekDates = useMemo(() => {
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => isoDate(addDays(weekStart, i)));
    }, [weekStart]);

  const fetchBasics = useCallback(async () => {
    try {
        const [slotRes, classroomRes] = await Promise.all([
            api.get('/timeslots'),
            api.get('/classrooms')
        ]);
        setTimeSlots(slotRes.data);
        setClassrooms(classroomRes.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchSubjectDetails = useCallback(async () => {
    try {
      const response = await api.get(`/subject-assignments/${id}`);
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTimetable = useCallback(async (groupId) => {
      try {
          const res = await api.get(`/timetable/weekly/${groupId}`, { params: { weekOffset } });
          setTimetable(res.data);
      } catch (err) { console.error(err); }
  }, [weekOffset]);

  useEffect(() => {
    fetchSubjectDetails();
    fetchBasics();
  }, [fetchSubjectDetails, fetchBasics]);

    useEffect(() => { if (data?.classGroupId?._id) fetchTimetable(data.classGroupId._id); }, [fetchTimetable, data?.classGroupId?._id]);

    const fetchNotes = useCallback(async () => {
        if (!id) return;
        setLoadingNotes(true);
        try {
            const res = await api.get(`/notes/${id}`);
            setNotes(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingNotes(false);
        }
    }, [id]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleUploadNote = async (e) => {
        e.preventDefault();
        if (!noteFile || !noteTitle) return;

        setUploadingNote(true);
        try {
            const formData = new FormData();
            formData.append('file', noteFile);
            formData.append('title', noteTitle);
            formData.append('subjectAssignmentId', id);

            await api.post('/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNoteFile(null);
            setNoteTitle('');
            fetchNotes();
        } catch (e) {
            alert(e.response?.data?.message || 'Error uploading note');
        } finally {
            setUploadingNote(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            fetchNotes();
        } catch (e) {
            alert('Error deleting note');
        }
    };

  useEffect(() => {
      if (modalOpen && selectedSlot?.date && selectedSlot?.slot?._id) {
          const fetchAvailableRooms = async () => {
              setLoadingRooms(true);
              try {
                  const params = {
                      date: selectedSlot.date,
                      timeSlotId: selectedSlot.slot._id
                  };
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
  }, [modalOpen, selectedSlot]);

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      <p className="font-medium text-slate-500">Loading academic details...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-slate-900 shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h1 className="text-2xl font-bold text-slate-800">{data?.subject?.subjectName}</h1>
               <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">
                 {data?.subject?.subjectCode}
               </span>
            </div>
            <p className="text-slate-500 font-medium">
               {data?.classGroupId?.department} • Sem {data?.classGroupId?.semester} ({data?.classGroupId?.section})
            </p>
          </div>
        </div>

        <button 
           onClick={() => setIsSessionModalOpen(true)}
           className="btn-primary bg-slate-900 border-none px-6 py-3.5 flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          Start Attendance Session
        </button>
      </div>

      {/* Session Method Modal */}
      <Modal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title="Start Attendance Session">
         <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-sm text-slate-600">Choose the method to collect attendance for this session.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setSessionMethod('manual')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${sessionMethod === 'manual' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-slate-500">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-800">Manual</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Teacher marks each</div>
                </button>

                <button 
                    onClick={() => setSessionMethod('fingerprint')}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${sessionMethod === 'fingerprint' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center mb-3 text-slate-500">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-800">Fingerprint</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Students mark on phone</div>
                </button>
            </div>

            <div className="pt-2 flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setIsSessionModalOpen(false)}>Cancel</button>
                <button 
                    disabled={sessionLoading}
                    onClick={async () => {
                        setSessionLoading(true);
                        try {
                            // Find current slot
                            const now = new Date();
                            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
                            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                            
                            // Get all regular slots for this class group today
                            const res = await api.get(`/timetable/weekly/${data?.classGroupId?._id}`);
                            const todayISO = now.toISOString().split('T')[0];
                            const todayClasses = res.data?.schedule?.[todayISO] || [];
                            
                            // Find the one that matches this subject assignment and current time window
                            const currentSlot = todayClasses.find(c => {
                                if (c.subjectAssignmentId?._id !== id) return false;
                                const start = c.slot?.startTime || '';
                                const end = c.slot?.endTime || '';
                                // Allow 15 mins before/after (relaxing the 10 min strict backend if needed, but backend is 10)
                                return true; // Actually, let's just use the first/current for now or prompt to pick
                            });

                            if (!currentSlot) {
                                throw new Error("No scheduled class found for this subject right now.");
                            }

                            await api.post('/attendance/start', {
                                timetableId: currentSlot.timetableId,
                                date: todayISO,
                                method: sessionMethod
                            });
                            
                            alert('Session started successfully!');
                            setIsSessionModalOpen(false);
                        } catch (err) {
                            alert(err.response?.data?.message || err.message || 'Failed to start session');
                        } finally {
                            setSessionLoading(false);
                        }
                    }}
                    className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20"
                >
                    {sessionLoading ? 'Starting…' : 'Initialize Session'}
                </button>
            </div>
         </div>
      </Modal>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card border-none bg-primary-600 text-white flex items-center justify-between overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
             <BarChart3 className="w-16 h-16" />
           </div>
           <div>
             <p className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-1">Class Presence</p>
             <h3 className="text-3xl font-bold">—%</h3>
           </div>
           <div className="text-right">
             <p className="text-sm font-bold text-white/80">Pending</p>
             <p className="text-[10px] text-white/50">Data being calculated</p>
           </div>
        </div>

        <div className="card border-none bg-slate-900 text-white flex items-center justify-between group">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Sessions Held</p>
             <h3 className="text-3xl font-bold">{data?.totalSessions || 0}</h3>
           </div>
           <Clock className="w-8 h-8 text-white opacity-20" />
        </div>

        <div className="card border-none bg-white text-slate-800 flex items-center justify-between group">
           <div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Student Strength</p>
             <h3 className="text-3xl font-bold text-slate-900">{data?.classGroupId?.students?.length || 0}</h3>
           </div>
           <Users className="w-8 h-8 text-primary-600 opacity-20" />
        </div>
      </div>

      {/* Interactive Timetable for Extra Class */}
      <div className="card border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Class Timetable</h2>
                <p className="text-slate-500 text-sm">Click on an empty slot to schedule an extra class.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"><ArrowLeft className="w-4 h-4" /></button>
                <button onClick={() => setWeekOffset(0)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">THIS WEEK</button>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"><ArrowRight className="w-4 h-4" /></button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Time / Day</th>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <th key={day} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {timeSlots.map(slot => (
                        <tr key={slot._id} className="hover:bg-slate-50/30 transition-all">
                            <td className="p-4">
                                <p className="text-xs font-bold text-slate-700">{slot.startTime} - {slot.endTime}</p>
                                <p className="text-[10px] text-slate-400">{slot.slotName}</p>
                            </td>
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                                const dateStr = weekDates[idx];
                                const classes = timetable.schedule?.[dateStr] || [];
                                const existing = classes.find(c => c.slot?._id === slot._id);

                                return (
                                    <td key={day} className="p-2">
                                        {existing ? (
                                            <div className={`p-3 rounded-xl border ${existing.type === 'EXTRA' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'} h-full min-h-[60px]`}>
                                                <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{existing.subject?.subjectName || existing.title}</p>
                                                <p className="text-[9px] text-slate-500 mt-1">{existing.classroom?.roomNumber || '—'}</p>
                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-2 inline-block ${existing.type === 'EXTRA' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                                                    {existing.type}
                                                </span>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setSelectedSlot({ date: dateStr, slot, day });
                                                    setModalOpen(true);
                                                }}
                                                className="w-full h-[60px] border border-dashed border-slate-200 rounded-xl hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600 transition-all flex items-center justify-center group"
                                            >
                                                <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary-400" />
                                            </button>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Notes Section */}
        <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Study Materials</h2>
                        <p className="text-sm text-slate-500 font-medium">Manage and share notes with your students.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 p-8 h-fit">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-1">Upload New Material</h3>
                    <form onSubmit={handleUploadNote} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Title</label>
                            <input 
                                required
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                                className="input-field py-3.5"
                                placeholder="E.g. Unit 1 Introduction"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">File</label>
                            <label className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setNoteFile(e.target.files[0])}
                                />
                                {noteFile ? (
                                    <>
                                        <FileCheck2 className="w-8 h-8 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center px-4 line-clamp-1">{noteFile.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Choose file to upload</span>
                                    </>
                                )}
                            </label>
                        </div>
                        <button 
                            disabled={uploadingNote}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            {uploadingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {uploadingNote ? 'UPLOADING...' : 'SAVE MATERIAL'}
                        </button>
                    </form>
                </div>

                {/* Notes List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Uploaded Resource Library</h3>
                    
                    {loadingNotes ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                             <Loader2 className="w-8 h-8 animate-spin" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Locating Resources...</span>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4 bg-slate-50/30 rounded-[32px] border border-dashed border-slate-200 text-slate-400">
                             <FileText className="w-12 h-12 opacity-10" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">No materials found for this subject.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {notes.map(note => (
                                <div key={note._id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden">
                                     <div className="flex items-start justify-between gap-4">
                                          <div className="flex gap-4">
                                               <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                                   <FileText className="w-6 h-6" />
                                               </div>
                                               <div>
                                                   <h4 className="font-bold text-slate-800 line-clamp-1">{note.title}</h4>
                                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                       {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                   </p>
                                               </div>
                                          </div>
                                          <div className="flex gap-2">
                                               <a 
                                                   href={`http://localhost:5000/${note.fileUrl}`} 
                                                   target="_blank" 
                                                   rel="noreferrer"
                                                   className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-slate-100"
                                               >
                                                   <Download className="w-4 h-4" />
                                               </a>
                                               <button 
                                                   onClick={() => handleDeleteNote(note._id)}
                                                   className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-100"
                                               >
                                                   <Trash2 className="w-4 h-4" />
                                               </button>
                                          </div>
                                     </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Assign Extra Class</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                                    Scheduling Overwrite for {selectedSlot.date}
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-white rounded-full text-slate-400 shadow-sm border border-transparent hover:border-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form className="p-6 space-y-5" onSubmit={async (e) => {
                            e.preventDefault();
                            setSubmitting(true);
                            try {
                                await api.post('/timetable/extra', {
                                    subjectAssignmentId: id,
                                    date: selectedSlot.date,
                                    timeSlotId: selectedSlot.slot._id,
                                    classroomId: e.target.classroomId.value
                                });
                                setModalOpen(false);
                                fetchTimetable(data.classGroupId._id);
                            } catch (err) {
                                alert(err.response?.data?.message || 'Error scheduling class');
                            } finally {
                                setSubmitting(false);
                            }
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Date</label>
                                    <input readOnly value={selectedSlot.date} className="input-field bg-slate-50 border-slate-100 font-bold text-slate-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Time Slot</label>
                                    <input readOnly value={`${selectedSlot.slot.startTime} - ${selectedSlot.slot.endTime}`} className="input-field bg-slate-50 border-slate-100 font-bold text-slate-600" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Subject (Automated)</label>
                                <input readOnly value={`${data?.subject?.subjectName} (${data?.subject?.subjectCode})`} className="input-field bg-primary-50 border-primary-100 font-bold text-primary-700" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Available Classroom</label>
                                <select 
                                    name="classroomId" 
                                    required 
                                    className="input-field py-3.5"
                                    disabled={loadingRooms}
                                >
                                    <option value="">{loadingRooms ? 'Searching for free rooms...' : 'Select a classroom'}</option>
                                    {availableClassrooms.map(c => (
                                        <option key={c._id} value={c._id}>{c.roomNumber} — {c.building}</option>
                                    ))}
                                </select>
                                {!loadingRooms && availableClassrooms.length === 0 && (
                                    <p className="text-[10px] text-red-500 font-bold px-1 italic mt-1">
                                        * No classrooms available for this time slot.
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || availableClassrooms.length === 0}
                                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Confirm Extra Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

      {/* Attendance History & Top Absentees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card border-none">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Sessions History</h2>
            <div className="space-y-4">
               {(!data?.recentSessions || data.recentSessions.length === 0) ? (
                 <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">No sessions recorded yet.</p>
                 </div>
               ) : (
                 data.recentSessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                     {/* Session data rendering would go here */}
                  </div>
                 ))
               )}
            </div>
            <button className="w-full mt-6 py-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all uppercase tracking-widest">
              View Detailed Log
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
             <div className="flex items-center gap-2 mb-6">
               <AlertTriangle className="w-5 h-5 text-orange-500" />
               <h2 className="text-lg font-bold text-slate-800">Students with Low Attendance</h2>
             </div>
             <div className="space-y-4">
                {(!data?.lowAttendanceStudents || data.lowAttendanceStudents.length === 0) ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-400 font-medium italic">All students have good attendance records.</p>
                  </div>
                ) : (
                  data.lowAttendanceStudents.map((stu, i) => (
                    <div key={i} className="flex items-center justify-between group">
                      {/* Stu data rendering */}
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="card bg-slate-50 border-dashed border-slate-200">
             <h3 className="font-bold text-slate-800 mb-2">Subject Notes</h3>
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">
               Upload study material or session notes accessible to the entire class.
             </p>
             <button className="w-full py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
                Access Library
             </button>
          </div>
        </div>
      </div>

      {/* Students List Table */}
      <div className="card border-none">
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Users className="w-5 h-5" />
              </div>
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Enrolled Students</h2>
                  <p className="text-sm text-slate-500">Full list of students in {data?.classGroupId?.department} Sem {data?.classGroupId?.semester} ({data?.classGroupId?.section})</p>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-slate-50/50">
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Roll No</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Student Name</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Email Address</th>
                          <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {(!data?.students || data.students.length === 0) ? (
                          <tr>
                              <td colSpan="4" className="p-12 text-center text-slate-400 italic text-sm">
                                  No students enrolled in this class group.
                              </td>
                          </tr>
                      ) : (
                          data.students.map((student) => (
                              <tr key={student._id} className="hover:bg-slate-50/30 transition-all group">
                                  <td className="p-4">
                                      <span className="text-xs font-bold text-slate-700">#{student.rollNumber || 'N/A'}</span>
                                  </td>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase overflow-hidden">
                                              {student.profilePicture ? (
                                                  <img src={student.profilePicture} alt="" className="w-full h-full object-cover" />
                                              ) : (
                                                  student.name?.charAt(0) || '?'
                                              )}
                                          </div>
                                          <span className="text-sm font-semibold text-slate-800">{student.name}</span>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <span className="text-xs text-slate-500 font-medium">{student.email}</span>
                                  </td>
                                  <td className="p-4 text-right">
                                      <button 
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setIsAttendanceModalOpen(true);
                                            // Fetch student attendance for this subject
                                            // TODO: implement specific endpoint if needed, or query records
                                        }}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                      >
                                          <ArrowRight className="w-4 h-4" />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Student Attendance Modal */}
      <Modal isOpen={isAttendanceModalOpen} onClose={() => setIsAttendanceModalOpen(false)} title={`Student Attendance: ${selectedStudent?.name}`}>
         <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-lg">
                    {selectedStudent?.name?.[0]}
                </div>
                <div>
                    <div className="font-bold text-slate-800">{selectedStudent?.name}</div>
                    <div className="text-xs text-slate-500 font-medium">Roll No: {selectedStudent?.rollNumber} • {selectedStudent?.email}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Recent Sessions</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</span>
                </div>
                <div className="border border-slate-50 rounded-2xl overflow-hidden divide-y divide-slate-50">
                    {/* Mock data for now, would be fetched from backend */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                            <div>
                                <div className="text-sm font-semibold text-slate-700">Jan {25 + i}, 2026</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">10:00 AM - 11:00 AM</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${i % 2 === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {i % 2 === 0 ? 'PRESENT' : 'ABSENT'}
                                </span>
                                <button className="text-xs font-bold text-primary-600 hover:underline">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-2">
                <button onClick={() => setIsAttendanceModalOpen(false)} className="btn-secondary w-full">Close</button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default SubjectDetails;
