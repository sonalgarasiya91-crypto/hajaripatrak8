import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DailyAttendanceView } from './components/DailyAttendanceView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { AnalyticsView } from './components/AnalyticsView';
import { StudentDirectoryView } from './components/StudentDirectoryView';
import { StudentManagerModal } from './components/StudentManagerModal';
import { EditSchoolModal } from './components/EditSchoolModal';
import { Student, DayAttendance, SchoolProfile, AttendanceStatus } from './types';
import {
  loadStudents,
  saveStudents,
  loadAttendanceRecords,
  saveAttendanceRecords,
  loadSchoolProfile,
  saveSchoolProfile,
  getSoundPreference,
  setSoundPreference,
} from './utils/storage';
import { INITIAL_STUDENTS } from './data/initialStudents';

export default function App() {
  const [school, setSchool] = useState<SchoolProfile>(loadSchoolProfile);
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, DayAttendance>>(() =>
    loadAttendanceRecords(students)
  );

  // Today's date YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState<string>(getTodayString);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'students' | 'analytics'>('daily');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(getSoundPreference);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isEditSchoolModalOpen, setIsEditSchoolModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [openAddDirectly, setOpenAddDirectly] = useState<boolean>(false);

  // Save changes to localStorage
  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveAttendanceRecords(attendanceRecords);
  }, [attendanceRecords]);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabledState(nextVal);
    setSoundPreference(nextVal);
  };

  const handleSaveSchoolProfile = (updatedSchool: SchoolProfile) => {
    setSchool(updatedSchool);
    saveSchoolProfile(updatedSchool);
  };

  // Update single student attendance
  const handleUpdateAttendance = (date: string, studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => {
      const existing = prev[date] || {
        date,
        records: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedRecords = {
        ...existing.records,
        [studentId]: status,
      };

      return {
        ...prev,
        [date]: {
          ...existing,
          records: updatedRecords,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Bulk update attendance
  const handleBulkUpdate = (date: string, updates: Record<string, AttendanceStatus>) => {
    setAttendanceRecords((prev) => {
      const existing = prev[date] || {
        date,
        records: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedRecords = {
        ...existing.records,
        ...updates,
      };

      return {
        ...prev,
        [date]: {
          ...existing,
          records: updatedRecords,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Student CRUD operations
  const handleAddStudent = (newStudentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...newStudentData,
      id: `std-${Date.now()}`,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetToDefault = () => {
    setStudents(INITIAL_STUDENTS);
    saveStudents(INITIAL_STUDENTS);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Noto_Sans_Gujarati','Outfit',sans-serif]">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        school={school}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAddStudent={() => {
          setSelectedStudentForEdit(null);
          setOpenAddDirectly(true);
          setIsStudentModalOpen(true);
        }}
        onOpenEditSchool={() => setIsEditSchoolModalOpen(true)}
        totalStudents={students.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'daily' && (
          <DailyAttendanceView
            students={students}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            dayRecord={attendanceRecords[currentDate]}
            onUpdateAttendance={handleUpdateAttendance}
            onBulkUpdate={handleBulkUpdate}
            school={school}
            soundEnabled={soundEnabled}
            onNavigateToMonthly={() => setActiveTab('monthly')}
            onOpenAddStudent={() => {
              setSelectedStudentForEdit(null);
              setOpenAddDirectly(true);
              setIsStudentModalOpen(true);
            }}
            onEditStudent={(student) => {
              setSelectedStudentForEdit(student);
              setOpenAddDirectly(false);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportView
            students={students}
            allRecords={attendanceRecords}
            onUpdateAttendance={handleUpdateAttendance}
            school={school}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            students={students}
            allRecords={attendanceRecords}
            school={school}
          />
        )}

        {activeTab === 'students' && (
          <StudentDirectoryView
            students={students}
            allRecords={attendanceRecords}
            onEditStudent={(student) => {
              setSelectedStudentForEdit(student);
              setOpenAddDirectly(false);
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={handleDeleteStudent}
            onOpenAddModal={() => {
              setSelectedStudentForEdit(null);
              setOpenAddDirectly(true);
              setIsStudentModalOpen(true);
            }}
            school={school}
          />
        )}
      </main>

      {/* Student Management Modal */}
      <StudentManagerModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudentForEdit(null);
          setOpenAddDirectly(false);
        }}
        students={students}
        onAddStudent={handleAddStudent}
        onUpdateStudent={handleUpdateStudent}
        onDeleteStudent={handleDeleteStudent}
        onResetToDefault={handleResetToDefault}
        studentToEdit={selectedStudentForEdit}
        openAddDirectly={openAddDirectly}
      />

      {/* School Profile Edit Modal */}
      <EditSchoolModal
        isOpen={isEditSchoolModalOpen}
        onClose={() => setIsEditSchoolModalOpen(false)}
        school={school}
        onSave={handleSaveSchoolProfile}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {school.schoolName} - {school.standard} ({school.academicYear})
          </span>
          <span className="text-slate-400">
            બધા અધિકારો સુરક્ષિત · સ્માર્ટ ડિજિટલ હાજરી પ્રણાલી
          </span>
        </div>
      </footer>
    </div>
  );
}
