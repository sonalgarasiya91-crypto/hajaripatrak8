import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Users,
  Search,
  LayoutGrid,
  List,
  CheckCheck,
  UserX,
  Phone,
  ArrowRight,
  Info,
  Sparkles,
  UserPlus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Student, DayAttendance, SchoolProfile, AttendanceStatus, StudentCategory } from '../types';
import { exportDailyAttendanceToExcel } from '../utils/excelExport';
import { playAttendanceSound } from '../utils/audio';

interface DailyAttendanceViewProps {
  students: Student[];
  currentDate: string;
  setCurrentDate: (date: string) => void;
  dayRecord: DayAttendance | undefined;
  onUpdateAttendance: (date: string, studentId: string, status: AttendanceStatus) => void;
  onBulkUpdate: (date: string, updates: Record<string, AttendanceStatus>) => void;
  school: SchoolProfile;
  soundEnabled: boolean;
  onNavigateToMonthly: () => void;
  onOpenAddStudent?: () => void;
  onEditStudent?: (student: Student) => void;
  onDeleteStudent?: (id: string) => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  students,
  currentDate,
  setCurrentDate,
  dayRecord,
  onUpdateAttendance,
  onBulkUpdate,
  school,
  soundEnabled,
  onNavigateToMonthly,
  onOpenAddStudent,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | StudentCategory>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | AttendanceStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const records = dayRecord?.records || {};

  // Gujarati day names & months
  const dayNamesGu = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'];
  const monthNamesGu = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];

  const currentDateObj = useMemo(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [currentDate]);

  const dayOfWeekName = dayNamesGu[currentDateObj.getDay()];
  const isSunday = currentDateObj.getDay() === 0;

  // Date formatted display in Gujarati
  const formattedDateGu = useMemo(() => {
    const d = currentDateObj.getDate();
    const m = monthNamesGu[currentDateObj.getMonth()];
    const y = currentDateObj.getFullYear();
    return `${d} ${m} ${y}, ${dayOfWeekName}`;
  }, [currentDateObj, dayOfWeekName]);

  // Statistics calculation
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let boyPresent = 0;
    let girlPresent = 0;
    let boyTotal = 0;
    let girlTotal = 0;

    const categoryBreakdown: Record<StudentCategory, { total: number; boys: number; girls: number; present: number; absent: number; leave: number; pct: number }> = {
      OBC: { total: 0, boys: 0, girls: 0, present: 0, absent: 0, leave: 0, pct: 0 },
      ST: { total: 0, boys: 0, girls: 0, present: 0, absent: 0, leave: 0, pct: 0 },
      SC: { total: 0, boys: 0, girls: 0, present: 0, absent: 0, leave: 0, pct: 0 },
      GEN: { total: 0, boys: 0, girls: 0, present: 0, absent: 0, leave: 0, pct: 0 },
    };

    students.forEach((s) => {
      const st = records[s.id] || 'present';
      const cat = s.category || 'OBC';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, boys: 0, girls: 0, present: 0, absent: 0, leave: 0, pct: 0 };
      }
      categoryBreakdown[cat].total++;
      if (s.gender === 'boy') {
        categoryBreakdown[cat].boys++;
      } else {
        categoryBreakdown[cat].girls++;
      }

      if (s.gender === 'boy') boyTotal++;
      else girlTotal++;

      if (st === 'present') {
        present++;
        categoryBreakdown[cat].present++;
        if (s.gender === 'boy') boyPresent++;
        else girlPresent++;
      } else if (st === 'absent') {
        absent++;
        categoryBreakdown[cat].absent++;
      } else if (st === 'leave') {
        leave++;
        categoryBreakdown[cat].leave++;
      }
    });

    const total = students.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

    (Object.keys(categoryBreakdown) as StudentCategory[]).forEach((k) => {
      const c = categoryBreakdown[k];
      c.pct = c.total > 0 ? Number(((c.present / c.total) * 100).toFixed(1)) : 0;
    });

    return {
      total,
      present,
      absent,
      leave,
      boyTotal,
      girlTotal,
      boyPresent,
      girlPresent,
      percentage,
      categoryBreakdown,
    };
  }, [students, records]);

  // Next / Prev day navigation
  const handleDateChange = (offset: number) => {
    const nextDate = new Date(currentDateObj);
    nextDate.setDate(nextDate.getDate() + offset);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    const d = String(nextDate.getDate()).padStart(2, '0');
    setCurrentDate(`${y}-${m}-${d}`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setCurrentDate(`${y}-${m}-${d}`);
  };

  // PHOTO CLICK TOGGLE FUNCTION
  // Clicking the student photo cycles: Present -> Absent -> Leave -> Present
  const handlePhotoClick = (studentId: string, currentStatus: AttendanceStatus) => {
    let nextStatus: AttendanceStatus = 'present';
    if (currentStatus === 'present') {
      nextStatus = 'absent';
    } else if (currentStatus === 'absent') {
      nextStatus = 'leave';
    } else {
      nextStatus = 'present';
    }

    if (soundEnabled) {
      playAttendanceSound(nextStatus);
    }

    setLastClickedId(studentId);
    setTimeout(() => setLastClickedId(null), 600);

    onUpdateAttendance(currentDate, studentId, nextStatus);
  };

  const handleDirectStatusClick = (studentId: string, targetStatus: AttendanceStatus) => {
    if (soundEnabled) {
      playAttendanceSound(targetStatus);
    }
    setLastClickedId(studentId);
    setTimeout(() => setLastClickedId(null), 600);
    onUpdateAttendance(currentDate, studentId, targetStatus);
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    if (soundEnabled) playAttendanceSound('present');
    const updates: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updates[s.id] = 'present';
    });
    onBulkUpdate(currentDate, updates);
  };

  const handleMarkAllAbsent = () => {
    if (soundEnabled) playAttendanceSound('absent');
    const updates: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updates[s.id] = 'absent';
    });
    onBulkUpdate(currentDate, updates);
  };

  // Filter students based on search and selected filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nameGu.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        String(s.rollNo).includes(q) ||
        s.grNo.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Gender filter
      if (filterGender !== 'all' && s.gender !== filterGender) return false;

      // Category (Caste) filter
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;

      // Status filter
      const st = records[s.id] || 'present';
      if (filterStatus !== 'all' && st !== filterStatus) return false;

      return true;
    });
  }, [students, searchQuery, filterGender, filterCategory, filterStatus, records]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner Notice & Date Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Date Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
                title="અગાઉનો દિવસ"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
                  className="text-sm font-semibold text-slate-800 bg-transparent outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleDateChange(1)}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors"
                title="પછીનો દિવસ"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSetToday}
              className="px-3 py-2 text-xs font-semibold bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/60 rounded-xl transition-colors cursor-pointer"
            >
              આજની તારીખ
            </button>

            <div className="text-sm font-semibold text-slate-700 px-2 flex items-center gap-1.5">
              <span>{formattedDateGu}</span>
              {isSunday && (
                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md border border-rose-200">
                  રવિવાર (શાળા રજા)
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions (Export Excel & Monthly View) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => exportDailyAttendanceToExcel(currentDate, students, dayRecord, school)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>આજના ડેટા એક્સેલમાં ડાઉનલોડ (.xlsx)</span>
            </button>

            <button
              onClick={onNavigateToMonthly}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <span>માસિક પત્રક જુઓ</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Instructions strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-600 bg-amber-50/60 px-3 py-2 rounded-xl border border-amber-200/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium text-amber-900">
              સરળ પદ્ધતિ: <strong>વિદ્યાર્થીના ફોટો પર ક્લિક કરો</strong> — હાજર (લીલો) ➜ ગેરહાજર (લાલ) ➜ રજા (પીળો) બદલાશે!
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> હાજર
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ગેરહાજર
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> રજા
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
            <span className="font-medium">કુલ સંખ્યા</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">
              ({stats.boyTotal} કુમાર + {stats.girlTotal} કન્યા)
            </span>
          </div>
        </div>

        {/* Present Students */}
        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs mb-1.5 font-medium">
            <span>હાજર વિદ્યાર્થી</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.present}</span>
            <span className="text-xs font-semibold text-emerald-600">
              ({stats.boyPresent} કુ + {stats.girlPresent} ક)
            </span>
          </div>
        </div>

        {/* Absent Students */}
        <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs mb-1.5 font-medium">
            <span>ગેરહાજર</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-700">{stats.absent}</span>
            <span className="text-xs text-rose-600">વિદ્યાર્થીઓ</span>
          </div>
        </div>

        {/* Leave */}
        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs mb-1.5 font-medium">
            <span>રજા (Leave)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{stats.leave}</span>
            <span className="text-xs text-amber-600">વિદ્યાર્થીઓ</span>
          </div>
        </div>

        {/* Attendance Percentage */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-200 text-xs mb-1.5 font-medium">
            <span>હાજરી દર</span>
            <span className="text-[10px] bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-100">ધોરણ ૮</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300">{stats.percentage}%</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(stats.percentage))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Social Category Attendance Summary (OBC / ST / SC / GEN) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              જાતિવાર (કેટેગરી) દૈનિક હાજરી સારાંશ · Category Summary
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
            કુલ {stats.total} વિદ્યાર્થીઓ
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* OBC */}
          <div
            onClick={() => setFilterCategory(filterCategory === 'OBC' ? 'all' : 'OBC')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterCategory === 'OBC'
                ? 'border-amber-500 bg-amber-100/70 shadow-2xs ring-2 ring-amber-400/40'
                : 'border-amber-200/90 bg-amber-50/50 hover:bg-amber-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-900">ઓબીસી (OBC)</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                {stats.categoryBreakdown.OBC.pct}%
              </span>
            </div>
            <div className="text-[11px] text-amber-800 font-semibold mb-1">
              કુલ {stats.categoryBreakdown.OBC.total} ({stats.categoryBreakdown.OBC.boys} કુ + {stats.categoryBreakdown.OBC.girls} ક)
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-700 mt-1">
              <span>
                હાજર: <b className="text-emerald-700">{stats.categoryBreakdown.OBC.present}</b> / {stats.categoryBreakdown.OBC.total}
              </span>
              {stats.categoryBreakdown.OBC.absent > 0 && (
                <span className="text-rose-600 font-semibold text-[11px]">
                  {stats.categoryBreakdown.OBC.absent} ગેર
                </span>
              )}
            </div>
          </div>

          {/* ST */}
          <div
            onClick={() => setFilterCategory(filterCategory === 'ST' ? 'all' : 'ST')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterCategory === 'ST'
                ? 'border-emerald-500 bg-emerald-100/70 shadow-2xs ring-2 ring-emerald-400/40'
                : 'border-emerald-200/90 bg-emerald-50/50 hover:bg-emerald-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-900">એસ.ટી. (ST)</span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                {stats.categoryBreakdown.ST.pct}%
              </span>
            </div>
            <div className="text-[11px] text-emerald-800 font-semibold mb-1">
              કુલ {stats.categoryBreakdown.ST.total} ({stats.categoryBreakdown.ST.boys} કુમાર + {stats.categoryBreakdown.ST.girls} કન્યા)
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-700 mt-1">
              <span>
                હાજર: <b className="text-emerald-700">{stats.categoryBreakdown.ST.present}</b> / {stats.categoryBreakdown.ST.total}
              </span>
              {stats.categoryBreakdown.ST.absent > 0 && (
                <span className="text-rose-600 font-semibold text-[11px]">
                  {stats.categoryBreakdown.ST.absent} ગેર
                </span>
              )}
            </div>
          </div>

          {/* SC */}
          <div
            onClick={() => setFilterCategory(filterCategory === 'SC' ? 'all' : 'SC')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterCategory === 'SC'
                ? 'border-purple-500 bg-purple-100/70 shadow-2xs ring-2 ring-purple-400/40'
                : 'border-purple-200/90 bg-purple-50/50 hover:bg-purple-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-purple-900">એસ.સી. (SC)</span>
              <span className="text-[11px] font-bold text-purple-800 bg-purple-200/70 px-1.5 py-0.5 rounded">
                {stats.categoryBreakdown.SC.pct}%
              </span>
            </div>
            <div className="text-[11px] text-purple-800 font-semibold mb-1">
              કુલ {stats.categoryBreakdown.SC.total} ({stats.categoryBreakdown.SC.boys} કુમાર + {stats.categoryBreakdown.SC.girls} કન્યા)
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-700 mt-1">
              <span>
                હાજર: <b className="text-emerald-700">{stats.categoryBreakdown.SC.present}</b> / {stats.categoryBreakdown.SC.total}
              </span>
              {stats.categoryBreakdown.SC.absent > 0 && (
                <span className="text-rose-600 font-semibold text-[11px]">
                  {stats.categoryBreakdown.SC.absent} ગેર
                </span>
              )}
            </div>
          </div>

          {/* GEN */}
          <div
            onClick={() => setFilterCategory(filterCategory === 'GEN' ? 'all' : 'GEN')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              filterCategory === 'GEN'
                ? 'border-blue-500 bg-blue-100/70 shadow-2xs ring-2 ring-blue-400/40'
                : 'border-blue-200/90 bg-blue-50/50 hover:bg-blue-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-blue-900">જનરલ (GEN)</span>
              <span className="text-[11px] font-bold text-blue-800 bg-blue-200/70 px-1.5 py-0.5 rounded">
                {stats.categoryBreakdown.GEN.pct}%
              </span>
            </div>
            <div className="text-[11px] text-blue-800 font-semibold mb-1">
              કુલ {stats.categoryBreakdown.GEN.total} ({stats.categoryBreakdown.GEN.boys} કુ + {stats.categoryBreakdown.GEN.girls} ક)
            </div>
            <div className="flex items-baseline justify-between text-xs text-slate-700 mt-1">
              <span>
                હાજર: <b className="text-emerald-700">{stats.categoryBreakdown.GEN.present}</b> / {stats.categoryBreakdown.GEN.total}
              </span>
              {stats.categoryBreakdown.GEN.absent > 0 && (
                <span className="text-rose-600 font-semibold text-[11px]">
                  {stats.categoryBreakdown.GEN.absent} ગેર
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="રોલ નં, જી.આર. નં અથવા નામથી શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenAddStudent && (
              <button
                onClick={onOpenAddStudent}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                title="નવો વિદ્યાર્થી ઉમેરો (Add Student)"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ વિદ્યાર્થી ઉમેરો</span>
              </button>
            )}

            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="વર્ગના બધા વિદ્યાર્થીઓને હાજર માર્ક કરો"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>બધા હાજર (Mark All Present)</span>
            </button>

            <button
              onClick={handleMarkAllAbsent}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="બધા વિદ્યાર્થીઓને ગેરહાજર માર્ક કરો"
            >
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>બધા ગેરહાજર</span>
            </button>

            {/* Grid vs List View Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto md:ml-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="ફોટો ગ્રીડ વ્યુ"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="લિસ્ટ વ્યુ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium mr-1">ફિલ્ટર:</span>

          {/* Category Filter Chips */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterCategory === 'all' ? 'bg-white text-slate-800 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              બધી જાતિ
            </button>
            <button
              onClick={() => setFilterCategory('OBC')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterCategory === 'OBC' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              ઓબીસી ({stats.categoryBreakdown.OBC.total})
            </button>
            <button
              onClick={() => setFilterCategory('ST')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterCategory === 'ST' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              ST ({stats.categoryBreakdown.ST.total})
            </button>
            <button
              onClick={() => setFilterCategory('SC')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterCategory === 'SC' ? 'bg-white text-purple-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              SC ({stats.categoryBreakdown.SC.total})
            </button>
            <button
              onClick={() => setFilterCategory('GEN')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterCategory === 'GEN' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              જનરલ ({stats.categoryBreakdown.GEN.total})
            </button>
          </div>

          {/* Gender Filter Chips */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterGender('all')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterGender === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              બધા ({students.length})
            </button>
            <button
              onClick={() => setFilterGender('boy')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterGender === 'boy' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              કુમાર ({stats.boyTotal})
            </button>
            <button
              onClick={() => setFilterGender('girl')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterGender === 'girl' ? 'bg-white text-pink-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              કન્યા ({stats.girlTotal})
            </button>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              બધી સ્થિતિ
            </button>
            <button
              onClick={() => setFilterStatus('present')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterStatus === 'present' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              હાજર ({stats.present})
            </button>
            <button
              onClick={() => setFilterStatus('absent')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterStatus === 'absent' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              ગેરહાજર ({stats.absent})
            </button>
            <button
              onClick={() => setFilterStatus('leave')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                filterStatus === 'leave' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              રજા ({stats.leave})
            </button>
          </div>

          {(searchQuery || filterGender !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterGender('all');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-auto cursor-pointer"
            >
              ફિલ્ટર સાફ કરો
            </button>
          )}
        </div>
      </div>

      {/* STUDENT CARDS GRID (THE MAIN PHOTO CLICK ATTENDANCE REGISTER) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const status = records[student.id] || 'present';
            const isPresent = status === 'present';
            const isAbsent = status === 'absent';
            const isLeave = status === 'leave';
            const isJustClicked = lastClickedId === student.id;

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md flex flex-col ${
                  isPresent
                    ? 'border-emerald-300/80 ring-1 ring-emerald-400/20'
                    : isAbsent
                    ? 'border-rose-300 ring-2 ring-rose-400/30 bg-rose-50/20'
                    : 'border-amber-300 ring-1 ring-amber-400/30 bg-amber-50/20'
                } ${isJustClicked ? 'scale-[0.98]' : 'scale-100'}`}
              >
                {/* PHOTO CONTAINER (INTERACTIVE CLICK TARGET) */}
                <div
                  onClick={() => handlePhotoClick(student.id, status)}
                  className="relative group cursor-pointer aspect-4/3 bg-slate-100 overflow-hidden select-none"
                  title="હાજરી બદલવા ફોટો પર ક્લિક કરો (Click photo to toggle)"
                >
                  <img
                    src={student.photo}
                    alt={student.nameGu}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback to avatar if image fails to load
                      const target = e.currentTarget;
                      target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${student.id}`;
                    }}
                  />

                  {/* Gradient Overlay for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                  {/* Roll Number, Gender Badge & Social Category (OBC / ST / SC / GEN) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10 flex-wrap">
                    <span className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-xs flex items-center justify-center border border-white/20">
                      #{student.rollNo}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-md border ${
                        student.gender === 'boy'
                          ? 'bg-blue-600/70 border-blue-400/40 text-blue-100'
                          : 'bg-pink-600/70 border-pink-400/40 text-pink-100'
                      }`}
                    >
                      {student.gender === 'boy' ? 'કુ' : 'ક'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md border shadow-2xs ${
                        student.category === 'OBC'
                          ? 'bg-amber-600/90 border-amber-300 text-white'
                          : student.category === 'ST'
                          ? 'bg-emerald-600/90 border-emerald-300 text-white'
                          : student.category === 'SC'
                          ? 'bg-purple-600/90 border-purple-300 text-white'
                          : 'bg-blue-600/90 border-blue-300 text-white'
                      }`}
                    >
                      {student.category}
                    </span>
                  </div>

                  {/* GR Number */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="text-[11px] font-medium bg-black/50 backdrop-blur-md text-white/90 px-2 py-0.5 rounded-md border border-white/10">
                      GR: {student.grNo}
                    </span>
                  </div>

                  {/* BIG PROMINENT STATUS BADGE (OVER PHOTO) */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md backdrop-blur-md border transition-all ${
                        isPresent
                          ? 'bg-emerald-600/90 border-emerald-400 text-white'
                          : isAbsent
                          ? 'bg-rose-600/95 border-rose-400 text-white animate-pulse'
                          : 'bg-amber-600/90 border-amber-400 text-white'
                      }`}
                    >
                      {isPresent && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />}
                      {isAbsent && <XCircle className="w-4 h-4 shrink-0 text-rose-200" />}
                      {isLeave && <Clock className="w-4 h-4 shrink-0 text-amber-200" />}
                      <span>
                        {isPresent ? 'હાજર (Present)' : isAbsent ? 'ગેરહાજર (Absent)' : 'રજા (Leave)'}
                      </span>
                    </div>

                    <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-md opacity-90 group-hover:opacity-100 transition-opacity">
                      ક્લિક કરો ⟳
                    </span>
                  </div>
                </div>

                {/* STUDENT DETAILS BODY */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {student.nameGu}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                      {student.nameEn}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      {student.contactNo ? (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.contactNo}</span>
                        </p>
                      ) : (
                        <span />
                      )}

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1">
                        {onEditStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStudent(student);
                            }}
                            title="માહિતી સુધારો (Edit)"
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteStudent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `શું તમે ખરેખર રોલ નં. ${student.rollNo} - ${student.nameGu} ને ડિલીટ કરવા માંગો છો?`
                                )
                              ) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            title="વિદ્યાર્થી ડિલીટ કરો (Delete)"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 1-CLICK QUICK SELECTION BUTTONS */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleDirectStatusClick(student.id, 'present')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isPresent
                          ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>હાજર</span>
                    </button>

                    <button
                      onClick={() => handleDirectStatusClick(student.id, 'absent')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isAbsent
                          ? 'bg-rose-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                      }`}
                    >
                      <XCircle className="w-3 h-3" />
                      <span>ગેરહાજર</span>
                    </button>

                    <button
                      onClick={() => handleDirectStatusClick(student.id, 'leave')}
                      className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isLeave
                          ? 'bg-amber-600 text-white shadow-2xs font-bold'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>રજા</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4 w-14">રોલ</th>
                  <th className="py-3 px-4 w-16">ફોટો</th>
                  <th className="py-3 px-4">વિદ્યાર્થીનું નામ</th>
                  <th className="py-3 px-4 w-20">જી.આર.</th>
                  <th className="py-3 px-4 w-20">જાતિ</th>
                  <th className="py-3 px-4 w-24">કેટેગરી</th>
                  <th className="py-3 px-4 text-center w-64">હાજરી સ્થિતિ (ક્લિક કરો)</th>
                  <th className="py-3 px-3 text-center w-24">ક્રિયા</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const status = records[student.id] || 'present';
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        status === 'absent' ? 'bg-rose-50/30' : status === 'leave' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-800">#{student.rollNo}</td>
                      <td className="py-2.5 px-4">
                        <img
                          src={student.photo}
                          alt={student.nameGu}
                          onClick={() => handlePhotoClick(student.id, status)}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-emerald-500 cursor-pointer shadow-2xs"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{student.nameGu}</div>
                        <div className="text-xs text-slate-500">{student.nameEn}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono text-slate-600">{student.grNo}</td>
                      <td className="py-2.5 px-4 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            student.gender === 'boy'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded font-bold border ${
                            student.category === 'OBC'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : student.category === 'ST'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : student.category === 'SC'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {student.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDirectStatusClick(student.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              status === 'present'
                                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            હાજર
                          </button>
                          <button
                            onClick={() => handleDirectStatusClick(student.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              status === 'absent'
                                ? 'bg-rose-600 text-white shadow-2xs font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            ગેરહાજર
                          </button>
                          <button
                            onClick={() => handleDirectStatusClick(student.id, 'leave')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                              status === 'leave'
                                ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            રજા
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onEditStudent && (
                            <button
                              type="button"
                              onClick={() => onEditStudent(student)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              title="માહિતી સુધારો (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteStudent && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `શું તમે ખરેખર રોલ નં. ${student.rollNo} - ${student.nameGu} ને ડિલીટ કરવા માંગો છો?`
                                  )
                                ) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="વિદ્યાર્થી ડિલીટ કરો (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Info className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">કોઈ વિદ્યાર્થી મળ્યા નથી</h4>
          <p className="text-xs text-slate-500 mt-1">કૃપા કરીને સર્ચ અથવા ફિલ્ટર બદલો.</p>
        </div>
      )}
    </div>
  );
};
