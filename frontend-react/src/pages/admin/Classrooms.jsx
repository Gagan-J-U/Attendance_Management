import { Building2, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

export default function ClassroomsAdmin() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    roomNumber: '',
    building: '',
    capacity: 60,
    type: 'theory'
  });

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/classrooms');
      setClassrooms(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classrooms.filter((c) => (
      c.roomNumber?.toLowerCase().includes(q) ||
      c.building?.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q)
    ));
  }, [classrooms, search]);

  const openCreate = () => {
    setFormError('');
    setForm({ roomNumber: '', building: '', capacity: 60, type: 'theory' });
    setIsModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await api.post('/classrooms', {
        roomNumber: form.roomNumber,
        building: form.building || undefined,
        capacity: Number(form.capacity),
        type: form.type
      });
      setIsModalOpen(false);
      await fetchRooms();
    } catch (e2) {
      setFormError(e2.response?.data?.message || 'Failed to create classroom');
    } finally {
      setFormLoading(false);
    }
  };

  const disableRoom = async (id) => {
    if (!confirm('Disable this classroom?')) return;
    try {
      await api.patch(`/classrooms/${id}/status`, { isActive: false });
      await fetchRooms();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to disable classroom');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Classrooms</h1>
          <p className="text-slate-500">Create and manage rooms used for timetable and exams.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border-none">
          <Plus className="w-4 h-4" />
          Add Classroom
        </button>
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
              placeholder="Search by room, building, type..."
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filtered.length} Total</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading classrooms…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-100">
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c._id} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{c.roomNumber}</div>
                          <div className="text-xs text-slate-500">{c.building || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-semibold text-slate-700 capitalize">{c.type}</td>
                    <td className="px-6 py-5 font-semibold text-slate-700">{c.capacity}</td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => disableRoom(c._id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg">
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

      <Modal isOpen={isModalOpen} onClose={() => (formLoading ? null : setIsModalOpen(false))} title="Add Classroom">
        <form className="space-y-4" onSubmit={submit}>
          {formError ? <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium">{formError}</div> : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Room Number</label>
              <input className="input-field" value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Building (optional)</label>
              <input className="input-field" value={form.building} onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Capacity</label>
              <input type="number" min="1" className="input-field" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Type</label>
              <select className="input-field py-2.5" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} required>
                <option value="theory">theory</option>
                <option value="lab">lab</option>
                <option value="seminar">seminar</option>
              </select>
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


