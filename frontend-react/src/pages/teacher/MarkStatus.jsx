import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Save
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/axios';

const MarkStatus = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('present');
    const [remark, setRemark] = useState('');
    const [recentLogs, setRecentLogs] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [timeSlotId, setTimeSlotId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchLogs();
        fetchTimeSlots();
    }, []);

    const fetchTimeSlots = async () => {
        try {
            const res = await api.get('/timeslots');
            setTimeSlots(res.data.filter(s => s.isActive !== false));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/teacher-attendance/me');
            setRecentLogs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/teacher-attendance/status', {
                date,
                timeSlotId: timeSlotId || null,
                status,
                remark,
                method: 'manual'
            });
            fetchLogs();
            alert('Status updated successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Attendance & Status</h1>
                <p className="text-slate-500 font-medium">Mark yourself as busy, on-leave, or present for the day.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="card shadow-premium border-none p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Date</label>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">My Status</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['present', 'busy', 'on-leave', 'absent'].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatus(s)}
                                            className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold capitalize flex items-center justify-center gap-2 ${
                                                status === s 
                                                ? 'bg-primary-50 border-primary-600 text-primary-600 shadow-sm' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${
                                                s === 'present' ? 'bg-emerald-500' : 
                                                s === 'busy' ? 'bg-amber-500' : 
                                                'bg-red-400'
                                            }`}></div>
                                            {s.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Time Selection</label>
                                <select 
                                    className="input-field" 
                                    value={timeSlotId} 
                                    onChange={(e) => setTimeSlotId(e.target.value)}
                                    required={status === 'busy'}
                                >
                                    <option value="">Whole Day</option>
                                    {timeSlots.map(slot => (
                                        <option key={slot._id} value={slot._id}>
                                            {slot.slotName} ({slot.startTime} - {slot.endTime})
                                        </option>
                                    ))}
                                </select>
                                {status === 'busy' && !timeSlotId && (
                                    <p className="text-[10px] text-amber-600 font-bold px-1 italic">
                                        * Busy status must be assigned to a specific time slot.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Remark / Reason</label>
                                <textarea
                                    className="input-field min-h-[100px] py-3"
                                    placeholder="Explain your status (e.g., Hospital visit, Meeting at block A)"
                                    value={remark}
                                    onChange={(e) => setRemark(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                UPDATE MY STATUS
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="card shadow-premium border-none p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary-500" />
                                Recent Status Logs
                            </h2>
                        </div>
                        <div className="p-0">
                            {recentLogs.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium text-sm">No status updates found yet.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/30">
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Remark</th>
                                            <th className="px-6 py-4">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {recentLogs.map((log) => (
                                            <tr key={log._id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                        log.status === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {log.status}
                                                    </span>
                                                    {log.timeSlotId && (
                                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                                            {log.timeSlotId.slotName}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-500 italic">"{log.remark || '—'}"</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{log.method}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-amber-900">Important Note</h3>
                            <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                Marking yourself as <span className="font-bold">Busy</span> or <span className="font-bold">Absent</span> will automatically notify the administration and potentially flag your sessions for substitute teachers. You can only update today's or future dates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkStatus;
