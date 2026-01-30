import { CopyPlus, Loader2, Plus, Search, Trash2, UserPlus, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

export default function ClassGroups() {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [cloneFrom, setCloneFrom] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [rollNoFrom, setRollNoFrom] = useState('');
  const [rollNoTo, setRollNoTo] = useState('');

  const [form, setForm] = useState({
    department: '',
    semester: 1,
    section: 'A',
    academicYear: '',
    classTeacherId: ''
  });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [gRes, tRes] = await Promise.all([
        api.get('/classgroups'),
        api.get('/teachers')
      ]);
      setGroups(Array.isArray(gRes.data) ? gRes.data : []);
      setTeachers(tRes.data?.teachers || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load class groups.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return groups.filter((g) => (
      g.department?.toLowerCase().includes(q) ||
      String(g.semester).includes(q) ||
      g.section?.toLowerCase().includes(q) ||
      g.academicYear?.toLowerCase().includes(q) ||
      g.classTeacherId?.name?.toLowerCase().includes(q)
    ));
  }, [groups, search]);

  const openCreate = () => {
    setCloneFrom(null);
    setFormError('');
    setForm({
      department: '',
      semester: 1,
      section: 'A',
      academicYear: '',
      classTeacherId: ''
    });
    setIsModalOpen(true);
  };

  const openClone = (g) => {
    setCloneFrom(g);
    setFormError('');
    setForm({
      department: g.department || '',
      semester: Number(g.semester) || 1,
      section: g.section || 'A',
      academicYear: g.academicYear || '',
      classTeacherId: g.classTeacherId?._id || ''
    });
    setIsModalOpen(true);
  };

  const disableGroup = async (id) => {
    if (!confirm('Disable this class group? Timetables/assignments should move to the next semester group.')) return;
    try {
      await api.patch(`/classgroups/${id}/status`, { isActive: false });
      await fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to disable class group.');
    }
  };

  const openManageStudents = async (g) => {
    setFormError('');
    setActiveGroup(g);
    setSelectedStudentId('');
    setIsStudentsModalOpen(true);
    try {
      const fresh = await api.get(`/classgroups/${g._id}`);
      setActiveGroup(fresh.data);
    } catch {
      // fallback to existing data
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (!activeGroup?._id || !selectedStudentId) return;
    setFormLoading(true);
    try {
      await api.post(`/classgroups/${activeGroup._id}/students`, { studentId: selectedStudentId });
      const fresh = await api.get(`/classgroups/${activeGroup._id}`);
      setActiveGroup(fresh.data);
      setSelectedStudentId('');
      await fetchAll();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Failed to add student');
    } finally {
      setFormLoading(false);
    }
  };

  const removeStudent = async (studentId) => {
    if (!activeGroup?._id) return;
    if (!confirm('Remove this student from class group?')) return;
    setFormLoading(true);
    try {
      await api.delete(`/classgroups/${activeGroup._id}/students/${studentId}`);
      const fresh = await api.get(`/classgroups/${activeGroup._id}`);
      setActiveGroup(fresh.data);
      await fetchAll();
    } catch (e2) {
      alert(e2.response?.data?.message || 'Failed to remove student');
    } finally {
      setFormLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/classgroups', {
        department: form.department,
        semester: Number(form.semester),
        section: form.section,
        academicYear: form.academicYear,
        classTeacherId: form.classTeacherId || undefined
      });
      // optional: disable old after clone
      if (cloneFrom && confirm('New group created. Disable the previous semester group now?')) {
        await api.patch(`/classgroups/${cloneFrom._id}/status`, { isActive: false });
      }
      setIsModalOpen(false);
      await fetchAll();
    } catch (e2) {
      setFormError(e2.response?.data?.message || 'Failed to create class group.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Groups</h1>
          <p className="text-slate-500">Create semester-wise groups and disable old batches as you progress.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none">
          <Plus className="w-4 h-4" />
          New Class Group
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
              placeholder="Search by dept/semester/year/teacher..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Total</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading class groups...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Group</th>
                  <th className="px-6 py-4">Academic Year</th>
                  <th className="px-6 py-4">Class Teacher</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((g) => (
                  <tr key={g._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{g.department} • Sem {g.semester} ({g.section})</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>{g.students?.length ?? 0} students</span>
                        {g.isActive === false ? <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">INACTIVE</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-700">{g.academicYear}</td>
                    <td className="px-6 py-5 text-slate-700">
                      {g.classTeacherId?.name ? (
                        <span className="font-semibold">{g.classTeacherId.name}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openManageStudents(g)} className="p-2 text-slate-500 hover:text-primary-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-100">
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => openClone(g)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-100">
                          <CopyPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => disableGroup(g._id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => (formLoading ? null : setIsModalOpen(false))} title={cloneFrom ? 'Create Next Semester Group' : 'Create Class Group'}>
        <form className="space-y-4" onSubmit={submit}>
          {formError ? (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Department</label>
              <input className="input-field" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} placeholder="Computer Science" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Academic Year</label>
              <input className="input-field" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} placeholder="2025-26" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Semester</label>
              <input type="number" min="1" max="12" className="input-field" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Section</label>
              <input className="input-field uppercase" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} placeholder="A" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Class Teacher (optional)</label>
            <select className="input-field py-2.5" value={form.classTeacherId} onChange={(e) => setForm((f) => ({ ...f, classTeacherId: e.target.value }))}>
              <option value="">No class teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.name} — {t.teacherInfo?.department}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20" disabled={formLoading}>
              {formLoading ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStudentsModalOpen} onClose={() => (formLoading ? null : setIsStudentsModalOpen(false))} title="Manage Students">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="font-bold text-slate-800">
              {activeGroup ? `${activeGroup.department} • Sem ${activeGroup.semester} (${activeGroup.section}) — ${activeGroup.academicYear}` : '—'}
            </div>
            <div className="text-sm text-slate-500 mt-1">Add or remove students for this class group.</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Roll No</label>
                <div className="flex items-center gap-2">
                    <input 
                        className="input-field py-2 text-sm" 
                        placeholder="From" 
                        value={rollNoFrom} 
                        onChange={e => setRollNoFrom(e.target.value)}
                    />
                    <span className="text-slate-300">to</span>
                    <input 
                        className="input-field py-2 text-sm" 
                        placeholder="To" 
                        value={rollNoTo} 
                        onChange={e => setRollNoTo(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Student</label>
                <select className="input-field py-2 text-sm w-full" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">Select individual</option>
                {students
                    .filter(s => {
                        const roll = s.studentInfo?.rollNo || '';
                        if (rollNoFrom && roll < rollNoFrom) return false;
                        if (rollNoTo && roll > rollNoTo) return false;
                        return !(activeGroup?.students || []).some((gs) => String(gs?._id || gs) === String(s._id));
                    })
                    .map((s) => (
                    <option key={s._id} value={s._id}>
                        {s.name} — {s.studentInfo?.rollNo}
                    </option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2">
                <button 
                   type="button"
                   onClick={async () => {
                        if (!activeGroup?._id) return;
                        const filtered = students.filter(s => {
                            const roll = s.studentInfo?.rollNo || '';
                            if (rollNoFrom && roll < rollNoFrom) return false;
                            if (rollNoTo && roll > rollNoTo) return false;
                            return !(activeGroup?.students || []).some((gs) => String(gs?._id || gs) === String(s._id));
                        });
                        if (filtered.length === 0) return;
                        if (!confirm(`Add ${filtered.length} students to this group?`)) return;
                        
                        setFormLoading(true);
                        try {
                            for(const s of filtered) {
                                await api.post(`/classgroups/${activeGroup._id}/students`, { studentId: s._id });
                            }
                            const fresh = await api.get(`/classgroups/${activeGroup._id}`);
                            setActiveGroup(fresh.data);
                            await fetchAll();
                        } catch (e2) {
                            alert('Some students could not be added');
                        } finally {
                            setFormLoading(false);
                        }
                   }}
                   className="btn-secondary py-2 text-xs font-bold"
                   disabled={formLoading}
                >
                    Add Filtered
                </button>
                <button onClick={addStudent} disabled={formLoading || !selectedStudentId} className="btn-primary bg-primary-600 border-none shadow-lg shadow-primary-500/20 py-2">
                    {formLoading ? 'Adding…' : 'Add'}
                </button>
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white border-b border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-400">
              Current Students ({activeGroup?.students?.length ?? 0})
            </div>
            <div className="max-h-72 overflow-y-auto">
              {(activeGroup?.students || []).length === 0 ? (
                <div className="p-4 text-slate-500">No students in this group yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeGroup.students.map((s) => (
                    <div key={s._id || s} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="font-semibold text-slate-800">{s.name || s._id || s}</div>
                        <div className="text-xs text-slate-500">{s.usn || s.email || ''}</div>
                      </div>
                      <button onClick={() => removeStudent(s._id || s)} className="text-red-600 text-xs font-bold hover:underline" disabled={formLoading}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}


