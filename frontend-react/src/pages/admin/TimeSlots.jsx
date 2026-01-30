import {
  AlertCircle,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../../api/axios';

const TimeSlots = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [formData, setFormData] = useState({
        slotName: '',
        startTime: '',
        endTime: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            const res = await api.get('/timeslots');
            setSlots(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (slot = null) => {
        if (slot) {
            setEditingSlot(slot);
            setFormData({
                slotName: slot.slotName,
                startTime: slot.startTime,
                endTime: slot.endTime
            });
        } else {
            setEditingSlot(null);
            setFormData({ slotName: '', startTime: '', endTime: '' });
        }
        setError('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingSlot) {
                await api.patch(`/timeslots/${editingSlot._id}`, formData);
            } else {
                await api.post('/timeslots', formData);
            }
            fetchSlots();
            setModalOpen(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving time slot');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this time slot?')) return;
        try {
            await api.delete(`/timeslots/${id}`);
            fetchSlots();
        } catch (err) {
            alert('Error deleting slot');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await api.patch(`/timeslots/${id}`, { isActive: !currentStatus });
            fetchSlots();
        } catch (err) {
            alert('Error updating status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Time Slots</h1>
                    <p className="text-slate-500">Manage daily lecture periods and timing.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all font-bold text-sm"
                >
                    <Plus className="w-4 h-4" />
                    CREATE NEW SLOT
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-2xl border border-slate-100 shadow-premium">
                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="text-sm font-medium text-slate-500">Loading time slots...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.map((slot) => (
                        <div key={slot._id} className="card p-6 group hover:border-primary-200 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(slot)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary-600">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(slot._id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{slot.slotName}</h3>
                            <p className="text-slate-500 font-medium">
                                {slot.startTime} — {slot.endTime}
                            </p>
                             <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${slot.isActive !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${slot.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                                        {slot.isActive !== false ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleToggleStatus(slot._id, slot.isActive !== false)}
                                    className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                                        slot.isActive !== false 
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                    }`}
                                >
                                    {slot.isActive !== false ? 'DISABLE' : 'ENABLE'}
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingSlot ? 'Edit Time Slot' : 'Create New Slot'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Slot Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Period 1, Lunch Break"
                                    className="input-field"
                                    value={formData.slotName}
                                    onChange={(e) => setFormData({ ...formData, slotName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Start Time</label>
                                    <input
                                        required
                                        type="time"
                                        className="input-field"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">End Time</label>
                                    <input
                                        required
                                        type="time"
                                        className="input-field"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingSlot ? 'UPDATE' : 'CREATE'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlots;
