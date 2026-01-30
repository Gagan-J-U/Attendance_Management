import { ArrowRight, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

export default function Mentorships() {
    const [mentorships, setMentorships] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    // Range Selection State
    const [rollNoFrom, setRollNoFrom] = useState('');
    const [rollNoTo, setRollNoTo] = useState('');

    const [form, setForm] = useState({
        mentorId: '',
        studentIds: [],
        academicYear: new Date().getFullYear().toString(),
        semester: 1
    });

    const fetchAll = async () => {
        setLoading(true);
        setError('');
        try {
            const [mRes, tRes, sRes] = await Promise.all([
                api.get('/mentorship'),
                api.get('/teachers'),
                api.get('/students')
            ]);
            setMentorships(Array.isArray(mRes.data) ? mRes.data : []);
            setTeachers(tRes.data?.teachers || []);
            setStudents(Array.isArray(sRes.data) ? sRes.data : []);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load mentorship data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const filteredMentorships = useMemo(() => {
        const q = search.toLowerCase();
        return mentorships.filter((m) => (
            m.mentorId?.name?.toLowerCase().includes(q) ||
            m.studentId?.name?.toLowerCase().includes(q) ||
            m.studentId?.studentInfo?.rollNo?.toLowerCase().includes(q) ||
            m.studentId?.studentInfo?.department?.toLowerCase().includes(q)
        ));
    }, [mentorships, search]);

    const filteredStudentsForModal = useMemo(() => {
        let list = students;
        if (rollNoFrom || rollNoTo) {
            list = list.filter(s => {
                const roll = s.studentInfo?.rollNo || '';
                if (rollNoFrom && roll < rollNoFrom) return false;
                if (rollNoTo && roll > rollNoTo) return false;
                return true;
            });
        }
        return list;
    }, [students, rollNoFrom, rollNoTo]);

    const handleSelectAllFiltered = () => {
        const ids = filteredStudentsForModal.map(s => s._id);
        setForm(f => ({ ...f, studentIds: Array.from(new Set([...f.studentIds, ...ids])) }));
    };

    const toggleStudentSelection = (id) => {
        setForm(f => {
            const exists = f.studentIds.includes(id);
            if (exists) {
                return { ...f, studentIds: f.studentIds.filter(sid => sid !== id) };
            } else {
                return { ...f, studentIds: [...f.studentIds, id] };
            }
        });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (form.studentIds.length === 0) {
            setFormError('Please select at least one student.');
            return;
        }
        setFormError('');
        setFormLoading(true);
        try {
            await api.post('/mentorship', {
                mentorId: form.mentorId,
                studentIds: form.studentIds,
                academicYear: form.academicYear,
                semester: Number(form.semester)
            });
            setIsModalOpen(false);
            await fetchAll();
            // Reset form
            setForm({
                mentorId: '',
                studentIds: [],
                academicYear: new Date().getFullYear().toString(),
                semester: 1
            });
            setRollNoFrom('');
            setRollNoTo('');
        } catch (e2) {
            setFormError(e2.response?.data?.message || 'Failed to assign mentor.');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mentorship Management</h1>
                    <p className="text-slate-500">Assign students to mentors and track their relationships.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none">
                    <Plus className="w-4 h-4" />
                    Assign Mentors
                </button>
            </div>

            {error ? (
                <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div>
            ) : null}

            <div className="card border-none shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by mentor, student, roll no..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
                        />
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredMentorships.length} Total Assignments</div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-sm font-medium text-slate-500">Loading mentorships...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Mentor</th>
                                    <th className="px-6 py-4">Academic Period</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredMentorships.map((m) => (
                                    <tr key={m._id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-slate-800">{m.studentId?.name}</div>
                                            <div className="text-xs text-slate-500 mt-1">Roll: {m.studentId?.studentInfo?.rollNo} • {m.studentId?.studentInfo?.department}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-semibold text-slate-700">{m.mentorId?.name}</div>
                                            <div className="text-xs text-slate-500">{m.mentorId?.email}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-medium text-slate-700">{m.academicYear}</div>
                                            <div className="text-xs text-slate-500">Semester {m.semester}</div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => (formLoading ? null : setIsModalOpen(false))} title="Assign Mentors (Bulk)">
                <form className="space-y-6" onSubmit={submit}>
                    {formError ? (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Mentor (Teacher)</label>
                            <select className="input-field py-2.5" value={form.mentorId} onChange={(e) => setForm((f) => ({ ...f, mentorId: e.target.value }))} required>
                                <option value="">Select Mentor</option>
                                {teachers.map((t) => (
                                    <option key={t._id} value={t._id}>{t.name} — {t.teacherInfo?.department}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Year</label>
                                <input className="input-field" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Sem</label>
                                <input type="number" min="1" max="12" className="input-field" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <label className="text-sm font-bold text-slate-700">Select Students</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    className="px-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500/20 w-24" 
                                    placeholder="Roll From" 
                                    value={rollNoFrom} 
                                    onChange={e => setRollNoFrom(e.target.value)}
                                />
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <input 
                                    className="px-3 py-1.5 bg-slate-50 border-none rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500/20 w-24" 
                                    placeholder="Roll To" 
                                    value={rollNoTo} 
                                    onChange={e => setRollNoTo(e.target.value)}
                                />
                                <button type="button" onClick={handleSelectAllFiltered} className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-lg hover:bg-primary-100 transition-colors uppercase tracking-wider">
                                    Select All Filtered
                                </button>
                            </div>
                        </div>

                        <div className="border border-slate-100 rounded-2xl h-64 overflow-y-auto">
                            <div className="divide-y divide-slate-50">
                                {filteredStudentsForModal.length === 0 ? (
                                    <div className="p-10 text-center text-slate-400 italic text-sm">No students match the criteria.</div>
                                ) : (
                                    filteredStudentsForModal.map((s) => (
                                        <div 
                                            key={s._id} 
                                            onClick={() => toggleStudentSelection(s._id)}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${form.studentIds.includes(s._id) ? 'bg-primary-50/50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.studentIds.includes(s._id) ? 'bg-primary-600 border-primary-600' : 'border-slate-200'}`}>
                                                {form.studentIds.includes(s._id) && <Plus className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Roll: {s.studentInfo?.rollNo} • {s.studentInfo?.department}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">{form.studentIds.length} students selected</div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" className="btn-secondary flex-1" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</button>
                        <button type="submit" className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20" disabled={formLoading}>
                            {formLoading ? 'Assigning…' : `Assign to ${form.studentIds.length} Students`}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
