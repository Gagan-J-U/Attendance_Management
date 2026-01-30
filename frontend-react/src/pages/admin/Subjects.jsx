import {
    Layers,
    Loader2,
    Plus,
    Search,
    Trash2,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [subjectForm, setSubjectForm] = useState({
    subjectName: '',
    subjectCode: '',
    credits: 4,
    department: '',
    semester: 1
  });

  const [assignmentForm, setAssignmentForm] = useState({
    subjectId: '',
    teacherId: '',
    classGroupId: '',
    academicYear: '',
    offeringType: 'REGULAR',
    subjectAssignmentType: 'THEORY'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, assignRes, teachersRes, groupsRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/subject-assignments'),
        api.get('/teachers'),
        api.get('/classgroups')
      ]);
      setSubjects(subsRes.data);
      setAssignments(assignRes.data);
      setTeachers(teachersRes.data?.teachers || []);
      setClassGroups(groupsRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load subjects/assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.subjectName?.toLowerCase().includes(q) ||
      s.subjectCode?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  const filteredAssignments = assignments.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.subjectId?.subjectName?.toLowerCase().includes(q) ||
      a.subjectId?.subjectCode?.toLowerCase().includes(q) ||
      a.teacherId?.name?.toLowerCase().includes(q) ||
      a.classGroupId?.department?.toLowerCase().includes(q)
    );
  });

  const openCreateModal = () => {
    setFormError('');
    if (activeTab === 'list') {
      setSubjectForm({ subjectName: '', subjectCode: '', credits: 4, department: '', semester: 1 });
    } else {
      const cg = classGroups?.[0]?._id || '';
      setAssignmentForm((f) => ({
        ...f,
        subjectId: subjects?.[0]?._id || '',
        teacherId: teachers?.[0]?._id || '',
        classGroupId: cg,
        academicYear: classGroups?.find((x) => x._id === cg)?.academicYear || f.academicYear || ''
      }));
    }
    setIsModalOpen(true);
  };

  const disableSubject = async (id) => {
    if (!confirm('Disable this subject? It will be hidden from active lists.')) return;
    try {
      await api.patch(`/subjects/${id}/status`, { isActive: false });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disable subject');
    }
  };

  const disableAssignment = async (id) => {
    if (!confirm('Disable this subject assignment? (Cannot be re-activated as per backend rule)')) return;
    try {
      await api.put(`/subject-assignments/${id}`, { isActive: false });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to disable assignment');
    }
  };

  const submitModal = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      if (activeTab === 'list') {
        await api.post('/subjects', {
          subjectName: subjectForm.subjectName,
          subjectCode: subjectForm.subjectCode,
          credits: Number(subjectForm.credits),
          department: subjectForm.department,
          semester: Number(subjectForm.semester)
        });
      } else {
        await api.post('/subject-assignments', {
          subjectId: assignmentForm.subjectId,
          classGroupId: assignmentForm.classGroupId,
          teacherId: assignmentForm.teacherId,
          academicYear: assignmentForm.academicYear,
          offeringType: assignmentForm.offeringType,
          subjectAssignmentType: assignmentForm.subjectAssignmentType
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subject Repository</h1>
          <p className="text-slate-500">Manage global subjects and their active assignments to teachers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setActiveTab(activeTab === 'list' ? 'assignments' : 'list')}
             className="btn-secondary flex items-center gap-2"
          >
            {activeTab === 'list' ? <Zap className="w-4 h-4 text-primary-600" /> : <Layers className="w-4 h-4 text-primary-600" />}
            {activeTab === 'list' ? 'View Assignments' : 'Manage Subjects'}
          </button>
          <button 
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'list' ? 'Add Subject' : 'New Assignment'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-red-50 border border-red-100 text-red-700 rounded-2xl font-medium">{error}</div>
      ) : null}

      <div className="card border-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setActiveTab('list')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Subject List
              </button>
              <button 
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'assignments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Teacher Assignments
              </button>
           </div>
           
           <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-20 gap-4">
               <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
               <p className="text-sm font-medium text-slate-500">Loading curriculum data...</p>
             </div>
          ) : activeTab === 'list' ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4 text-center">Credits</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((sub) => (
                  <tr key={sub._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                           {sub.subjectCode?.substring(0, 2)}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{sub.subjectName}</p>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">{sub.subjectCode}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center font-bold text-slate-700">{sub.credits}</td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold">
                        {sub.department}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button onClick={() => disableSubject(sub._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Assignment</th>
                  <th className="px-6 py-4">Class Group</th>
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((asgn) => (
                  <tr key={asgn._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                       <div>
                          <p className="font-bold text-slate-800">{asgn.subjectId?.subjectName}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-bold py-0.5 px-2 bg-primary-100 text-primary-700 rounded uppercase tracking-wider">
                               {asgn.subjectAssignmentType}
                             </span>
                             <span className="text-[10px] font-bold py-0.5 px-2 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                               {asgn.offeringType}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 text-slate-600">
                          <Layers className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-semibold">
                            {asgn.classGroupId?.department} • Sem {asgn.classGroupId?.semester} ({asgn.classGroupId?.section})
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                             {asgn.teacherId?.name?.[0]}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{asgn.teacherId?.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button onClick={() => disableAssignment(asgn._id)} className="text-red-600 font-bold text-xs hover:underline">Disable</button>
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
        onClose={() => setIsModalOpen(false)} 
        title={activeTab === 'list' ? "Add New Subject" : "Create Teacher Assignment"}
      >
        <form className="space-y-4" onSubmit={submitModal}>
           {formError ? (
             <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div>
           ) : null}
           {activeTab === 'assignments' && (
             <>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Subject</label>
                  <select className="input-field py-2.5" value={assignmentForm.subjectId} onChange={(e) => setAssignmentForm((f) => ({ ...f, subjectId: e.target.value }))} required>
                    <option value="">Select subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Teacher</label>
                  <select className="input-field py-2.5" value={assignmentForm.teacherId} onChange={(e) => setAssignmentForm((f) => ({ ...f, teacherId: e.target.value }))} required>
                    <option value="">Select teacher</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Class Group</label>
                  <select
                    className="input-field py-2.5"
                    value={assignmentForm.classGroupId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const cg = classGroups.find((x) => x._id === id);
                      setAssignmentForm((f) => ({ ...f, classGroupId: id, academicYear: cg?.academicYear || f.academicYear }));
                    }}
                    required
                  >
                    <option value="">Select class group</option>
                    {classGroups.filter((g) => g.isActive !== false).map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.department} • Sem {g.semester} ({g.section}) — {g.academicYear}
                      </option>
                    ))}
                  </select>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Academic Year</label>
                   <input className="input-field" value={assignmentForm.academicYear} onChange={(e) => setAssignmentForm((f) => ({ ...f, academicYear: e.target.value }))} placeholder="2025-26" required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Offering Type</label>
                   <select className="input-field py-2.5" value={assignmentForm.offeringType} onChange={(e) => setAssignmentForm((f) => ({ ...f, offeringType: e.target.value }))} required>
                     <option value="REGULAR">REGULAR</option>
                     <option value="REMEDIAL">REMEDIAL</option>
                     <option value="HONORS">HONORS</option>
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1.5">Assignment Type</label>
                 <select className="input-field py-2.5" value={assignmentForm.subjectAssignmentType} onChange={(e) => setAssignmentForm((f) => ({ ...f, subjectAssignmentType: e.target.value }))} required>
                   <option value="THEORY">THEORY</option>
                   <option value="LAB">LAB</option>
                   <option value="TUTORIAL">TUTORIAL</option>
                 </select>
               </div>
             </>
           )}
           {activeTab === 'list' && (
              <>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Name</label>
                    <input value={subjectForm.subjectName} onChange={(e) => setSubjectForm((f) => ({ ...f, subjectName: e.target.value }))} type="text" className="input-field" placeholder="e.g. Operating Systems" required />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject Code</label>
                        <input value={subjectForm.subjectCode} onChange={(e) => setSubjectForm((f) => ({ ...f, subjectCode: e.target.value }))} type="text" className="input-field uppercase" placeholder="CS301" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Credits</label>
                        <input value={subjectForm.credits} onChange={(e) => setSubjectForm((f) => ({ ...f, credits: e.target.value }))} type="number" className="input-field" placeholder="4" required />
                    </div>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Default Semester</label>
                   <input value={subjectForm.semester} onChange={(e) => setSubjectForm((f) => ({ ...f, semester: e.target.value }))} type="number" min="1" max="12" className="input-field" placeholder="3" required />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1.5">Department</label>
                   <input value={subjectForm.department} onChange={(e) => setSubjectForm((f) => ({ ...f, department: e.target.value }))} type="text" className="input-field" placeholder="Computer Science" required />
                 </div>
              </>
           )}
           <div className="pt-4 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary flex-1"
                disabled={formLoading}
              >
                Cancel
              </button>
              <button disabled={formLoading} type="submit" className="btn-primary flex-1 bg-primary-600 border-none shadow-lg shadow-primary-500/20">
                {formLoading ? 'Saving…' : (activeTab === 'list' ? 'Create Subject' : 'Create Assignment')}
              </button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subjects;
