import {
    CheckCircle2,
    Download,
    Edit2,
    FileUp,
    Filter,
    Loader2,
    Search,
    Trash2,
    UserPlus,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    employeeId: '',
    department: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teachers');
      setTeachers(response.data?.teachers || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTeacher(null);
    setFormError('');
    setForm({
      name: '',
      email: '',
      password: '',
      phoneNumber: '',
      employeeId: '',
      department: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (t) => {
    setEditingTeacher(t);
    setFormError('');
    setForm({
      name: t?.name || '',
      email: t?.email || '',
      password: '',
      phoneNumber: t?.phoneNumber || '',
      employeeId: t?.teacherInfo?.employeeId || '',
      department: t?.teacherInfo?.department || ''
    });
    setIsModalOpen(true);
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitTeacher = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (editingTeacher) {
        // backend forbids employeeId update
        await api.put(`/teachers/${editingTeacher._id}`, {
          name: form.name,
          phoneNumber: form.phoneNumber,
          teacherInfo: { department: form.department }
        });
      } else {
        await api.post('/teachers', {
          name: form.name,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber,
          teacherInfo: {
            employeeId: form.employeeId,
            department: form.department
          }
        });
      }
      setIsModalOpen(false);
      await fetchTeachers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save teacher');
    } finally {
      setFormLoading(false);
    }
  };

  const disableTeacher = async (teacherId) => {
    if (!teacherId) return;
    if (!confirm('Disable this teacher? They will disappear from the active teachers list.')) return;
    try {
      await api.patch(`/teachers/${teacherId}/status`, { isActive: false });
      await fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disable teacher');
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.teacherInfo?.employeeId?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teacher Management</h1>
          <p className="text-slate-500">Manage faculty members, credentials and active status.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
              type="file" 
              id="bulk-upload-teachers" 
              className="hidden" 
              accept=".csv,.xlsx,.xls" 
              onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  setLoading(true);
                  try {
                      const res = await api.post('/bulk/teachers', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      alert(`Successfully uploaded ${res.data.summary.success} teachers. ${res.data.summary.errors.length} errors.`);
                      await fetchTeachers();
                  } catch (err) {
                      alert(err.response?.data?.message || 'Bulk upload failed');
                  } finally {
                      setLoading(false);
                      e.target.value = '';
                  }
              }}
          />
          <button onClick={() => document.getElementById('bulk-upload-teachers').click()} className="btn-secondary flex items-center gap-2 border-slate-200">
              <FileUp className="w-4 h-4" />
              Bulk Upload
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>

          <button 
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div>
      ) : null}

      <div className="card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-100 hidden sm:block">
              <Filter className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {filteredTeachers.length} Total
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-20 gap-4">
               <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
               <p className="text-sm font-medium text-slate-500">Retrieving faculty data...</p>
             </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">Department / ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Added On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
                          {teacher.name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{teacher.name}</p>
                          <p className="text-xs text-slate-500">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{teacher.teacherInfo?.department}</p>
                        <p className="text-xs text-slate-400 font-medium">#{teacher.teacherInfo?.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {teacher.isActive ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ACTIVE
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-full w-fit">
                          <XCircle className="w-3.5 h-3.5" />
                          INACTIVE
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-500 font-medium">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(teacher)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-sm shadow-transparent hover:shadow-slate-200/50">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => disableTeacher(teacher._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-100 shadow-sm shadow-transparent hover:shadow-slate-200/50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => (formLoading ? null : setIsModalOpen(false))}
        title={editingTeacher ? 'Edit Teacher' : 'Register New Faculty'}
      >
        <form className="space-y-4" onSubmit={submitTeacher}>
           {formError ? (
             <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div>
           ) : null}
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={onChange} type="text" className="input-field" placeholder="e.g. Dr. Jane Smith" required />
           </div>
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
              <input name="email" value={form.email} onChange={onChange} type="email" className="input-field" placeholder="jane.smith@college.com" required disabled={!!editingTeacher} />
           </div>
           {!editingTeacher ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                 <input name="password" value={form.password} onChange={onChange} type="password" className="input-field" placeholder="Set initial password" required />
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone (optional)</label>
                 <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} type="text" className="input-field" placeholder="9876543210" />
               </div>
             </div>
           ) : (
             <div>
               <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone (optional)</label>
               <input name="phoneNumber" value={form.phoneNumber} onChange={onChange} type="text" className="input-field" placeholder="9876543210" />
             </div>
           )}
           <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Employee ID</label>
                  <input name="employeeId" value={form.employeeId} onChange={onChange} type="text" className="input-field" placeholder="TCH-101" required disabled={!!editingTeacher} />
              </div>
              <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Department</label>
                  <input name="department" value={form.department} onChange={onChange} type="text" className="input-field" placeholder="Computer Science" required />
              </div>
           </div>
           <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary flex-1"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20">
                {formLoading ? 'Saving…' : (editingTeacher ? 'Save Changes' : 'Register Teacher')}
              </button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Teachers;
