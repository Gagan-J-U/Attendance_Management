import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy load pages
const LoginPage = React.lazy(() => import('./pages/auth/Login'));
const RegisterPage = React.lazy(() => import('./pages/auth/Register'));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/ForgotPassword'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const TeachersPage = React.lazy(() => import('./pages/admin/Teachers'));
const SubjectsPage = React.lazy(() => import('./pages/admin/Subjects'));
const ClassGroupsPage = React.lazy(() => import('./pages/admin/ClassGroups'));
const StudentsPage = React.lazy(() => import('./pages/admin/Students'));
const ClassroomsPage = React.lazy(() => import('./pages/admin/Classrooms'));
const AdminTimetablePage = React.lazy(() => import('./pages/admin/Timetable'));
const AdminExamsPage = React.lazy(() => import('./pages/admin/Exams'));
const TimeSlotsPage = React.lazy(() => import('./pages/admin/TimeSlots'));
const MentorshipsPage = React.lazy(() => import('./pages/admin/Mentorships'));
const TeacherDashboard = React.lazy(() => import('./pages/teacher/Dashboard'));
const MySubjectsPage = React.lazy(() => import('./pages/teacher/MySubjects'));
const SubjectDetailsPage = React.lazy(() => import('./pages/teacher/SubjectDetails'));
const TeacherSchedulePage = React.lazy(() => import('./pages/teacher/Schedule'));
const MarkStatusPage = React.lazy(() => import('./pages/teacher/MarkStatus'));

const MainLayout = ({ children }) => (
  <div className="flex min-h-screen">
    <Sidebar />
    <main className="flex-1 ml-64 bg-slate-50 min-h-screen">
      <Navbar />
      <div className="p-8">
        <React.Suspense fallback={<div className="text-slate-500 font-medium">Loading...</div>}>
          {children}
        </React.Suspense>
      </div>
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <React.Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route
                path="/admin/dashboard"
                element={<MainLayout><AdminDashboard /></MainLayout>}
              />
              <Route
                path="/admin/teachers"
                element={<MainLayout><TeachersPage /></MainLayout>}
              />
              <Route
                path="/admin/subjects"
                element={<MainLayout><SubjectsPage /></MainLayout>}
              />
            <Route
              path="/admin/students"
              element={<MainLayout><StudentsPage /></MainLayout>}
            />
            <Route
              path="/admin/classrooms"
              element={<MainLayout><ClassroomsPage /></MainLayout>}
            />
            <Route
              path="/admin/class-groups"
              element={<MainLayout><ClassGroupsPage /></MainLayout>}
            />
            <Route
              path="/admin/timetable"
              element={<MainLayout><AdminTimetablePage /></MainLayout>}
            />
              <Route
                path="/admin/exams"
                element={<MainLayout><AdminExamsPage /></MainLayout>}
              />
              <Route
                path="/admin/timeslots"
                element={<MainLayout><TimeSlotsPage /></MainLayout>}
              />
              <Route
                path="/admin/mentorships"
                element={<MainLayout><MentorshipsPage /></MainLayout>}
              />
              <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route
                path="/teacher/dashboard"
                element={<MainLayout><TeacherDashboard /></MainLayout>}
              />
              <Route
                path="/teacher/schedule"
                element={<MainLayout><TeacherSchedulePage /></MainLayout>}
              />
              <Route
                path="/teacher/subjects"
                element={<MainLayout><MySubjectsPage /></MainLayout>}
              />
              <Route
                path="/teacher/subjects/:id"
                element={<MainLayout><SubjectDetailsPage /></MainLayout>}
              />
              <Route
                path="/teacher/status"
                element={<MainLayout><MarkStatusPage /></MainLayout>}
              />
              <Route path="/teacher/*" element={<Navigate to="/teacher/dashboard" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
