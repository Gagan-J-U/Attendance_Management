import { FileUp, Loader2, Search, Trash2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

export default function StudentsAdmin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    rollNo: '',
    department: '',
    semester: 1,
    section: 'A'
  });

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students');
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentInfo?.rollNo?.toLowerCase().includes(q) ||
      s.studentInfo?.department?.toLowerCase().includes(q)
    ));
  }, [students, search]);

  const openCreate = () => {
    setFormError('');
    setForm({
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      rollNo: '',
      department: '',
      semester: 1,
      section: 'A'
    });
    setIsModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/students', {
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber,
        studentInfo: {
          rollNo: form.rollNo,
          department: form.department,
          semester: Number(form.semester),
          section: form.section
        }
      });
      setIsModalOpen(false);
      await fetchStudents();
    } catch (e2) {
      setFormError(e2.response?.data?.message || 'Failed to create student');
    } finally {
      setFormLoading(false);
    }
  };

  const disableStudent = async (id) => {
    if (!confirm('Disable this student?')) return;
    try {
      await api.patch(`/students/${id}/status`, { isActive: false });
      await fetchStudents();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to disable student');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-slate-500">Create students and manage active status.</p>
        </div>
        <div className="flex items-center gap-3">
            <input 
                type="file" 
                id="bulk-upload" 
                className="hidden" 
                accept=".csv,.xlsx,.xls" 
                onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    setLoading(true);
                    try {
                        const res = await api.post('/bulk/students', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        alert(`Successfully uploaded ${res.data.summary.success} students. ${res.data.summary.errors.length} errors.`);
                        await fetchStudents();
                    } catch (err) {
                        alert(err.response?.data?.message || 'Bulk upload failed');
                    } finally {
                        setLoading(false);
                        e.target.value = '';
                    }
                }}
            />
            <button onClick={() => document.getElementById('bulk-upload').click()} className="btn-secondary flex items-center gap-2 border-slate-200">
                <FileUp className="w-4 h-4" />
                Bulk Upload
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none">
                <UserPlus className="w-4 h-4" />
                Add Student
            </button>
        </div>
      </div>

      {error ? <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div> : null}

      <div className="card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
              placeholder="Search by name, email, roll no..."
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Total</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading students…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Roll / Dept</th>
                  <th className="px-6 py-4">Sem</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-700">{s.studentInfo?.rollNo || '—'}</div>
                      <div className="text-xs text-slate-500">{s.studentInfo?.department || '—'} ({s.studentInfo?.section || '—'})</div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-700">{s.studentInfo?.semester ?? '—'}</td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => disableStudent(s._id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
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

      <Modal isOpen={isModalOpen} onClose={() => (formLoading ? null : setIsModalOpen(false))} title="Add Student">
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <input type="password" className="input-field" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone (optional)</label>
              <input className="input-field" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Roll No</label>
              <input className="input-field" value={form.rollNo} onChange={(e) => setForm((f) => ({ ...f, rollNo: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Department</label>
              <input className="input-field" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Semester</label>
              <input type="number" min="1" max="12" className="input-field" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Section</label>
              <input className="input-field uppercase" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} required />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20" disabled={formLoading}>
              {formLoading ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


