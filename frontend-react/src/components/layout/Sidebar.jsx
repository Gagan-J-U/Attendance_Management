import { clsx } from 'clsx';
import {
    BookOpen,
    Calendar,
    Clock,
    DoorOpen,
    LayoutDashboard,
    LogOut,
    School,
    UserCheck,
    Users
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../context/AuthContext';

const cn = (...inputs) => twMerge(clsx(inputs));

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Teachers', path: '/admin/teachers', icon: Users },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Class Groups', path: '/admin/class-groups', icon: Users },
    { name: 'Classrooms', path: '/admin/classrooms', icon: DoorOpen },
    { name: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { name: 'Time Slots', path: '/admin/timeslots', icon: Clock },
    { name: 'Exams', path: '/admin/exams', icon: School },
    { name: 'Mentorships', path: '/admin/mentorships', icon: Users },
  ];

  const teacherLinks = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Schedule', path: '/teacher/schedule', icon: Calendar },
    { name: 'My Status', path: '/teacher/status', icon: UserCheck },
    { name: 'Subjects', path: '/teacher/subjects', icon: BookOpen },
  ];

  const links = isAdmin ? adminLinks : teacherLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed top-0 left-0 overflow-y-auto z-10">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
            C
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">College Portal</span>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-2">
        <div className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                isActive 
                  ? "bg-primary-50 text-primary-600 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-50">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center font-bold text-indigo-700 uppercase">
            {user?.name?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
