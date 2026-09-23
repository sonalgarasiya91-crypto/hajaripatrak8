import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  Search,
  CheckCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Student, DayAttendance, SchoolProfile, AttendanceStatus, StudentCategory } from '../types';
import { exportMonthlyAttendanceToExcel } from '../utils/excelExport';

interface MonthlyReportViewProps {
  students: Student[];
  allRecords: Record<string, DayAttendance>;
  onUpdateAttendance: (date: string, studentId: string, status: AttendanceStatus) => void;
  school: SchoolProfile;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  students,
  allRecords,
  onUpdateAttendance,
  school,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedGender, setSelectedGender] = useState<'all' | 'boy' | 'girl'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | StudentCategory>('all');
  const [viewType, setViewType] = useState<'matrix' | 'cards'>('matrix');

  const monthNamesGu = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  const dayNamesGu = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Handle month prev/next
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Calculate monthly stats per student
  const studentStats = useMemo(() => {
    return students.map((student) => {
      let present = 0;
      let absent = 0;
      let leave = 0;
      let workingDays = 0;
      const dayStatuses: Record<number, AttendanceStatus | 'sunday' | 'unmarked'> = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(selectedYear, selectedMonth - 1, d);
        const isSunday = dateObj.getDay() === 0;

        if (isSunday) {
          dayStatuses[d] = 'sunday';
        } else {
          workingDays++;
          const dStr = String(d).padStart(2, '0');
          const mStr = String(selectedMonth).padStart(2, '0');
          const dateKey = `${selectedYear}-${mStr}-${dStr}`;
          const dayRecord = allRecords[dateKey];

          if (dayRecord) {
            const st = dayRecord.records[student.id] || 'present';
            dayStatuses[d] = st;
            if (st === 'present') present++;
            else if (st === 'absent') absent++;
            else if (st === 'leave') leave++;
          } else {
            dayStatuses[d] = 'unmarked';
          }
        }
      }

      const percentage = workingDays > 0 ? Number(((present / workingDays) * 100).toFixed(1)) : 0;

      return {
        student,
        present,
        absent,
        leave,
        workingDays,
        percentage,
        dayStatuses,
      };
    });
  }, [students, allRecords, selectedYear, selectedMonth, daysInMonth]);

  // Overall Month High-Level KPIs
  const overallKPIs = useMemo(() => {
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(selectedYear, selectedMonth - 1, d).getDay() !== 0) {
        totalWorkingDays++;
      }
    }

    const catBreakdown: Record<StudentCategory, { count: number; avgPct: string }> = {
      OBC: { count: 0, avgPct: '0' },
      ST: { count: 0, avgPct: '0' },
      SC: { count: 0, avgPct: '0' },
      GEN: { count: 0, avgPct: '0' },
    };

    (['OBC', 'ST', 'SC', 'GEN'] as StudentCategory[]).forEach((cat) => {
      const list = studentStats.filter((s) => (s.student.category || 'OBC') === cat);
      const count = list.length;
      const avgPct = count > 0 ? (list.reduce((a, b) => a + b.percentage, 0) / count).toFixed(1) : '0';
      catBreakdown[cat] = { count, avgPct };
    });

    if (studentStats.length === 0) {
      return {
        totalWorkingDays,
        avgPct: '0',
        fullAttendanceCount: 0,
        lowAttendanceCount: 0,
        boyPct: '0',
        girlPct: '0',
        catBreakdown,
      };
    }

    const totalPct = studentStats.reduce((acc, curr) => acc + curr.percentage, 0);
    const avgPct = (totalPct / studentStats.length).toFixed(1);

    const fullAttendanceCount = studentStats.filter((s) => s.percentage >= 95).length;
    const lowAttendanceCount = studentStats.filter((s) => s.percentage < 75).length;

    const boys = studentStats.filter((s) => s.student.gender === 'boy');
    const girls = studentStats.filter((s) => s.student.gender === 'girl');

    const boyPct = boys.length > 0 ? (boys.reduce((a, b) => a + b.percentage, 0) / boys.length).toFixed(1) : '0';
    const girlPct = girls.length > 0 ? (girls.reduce((a, b) => a + b.percentage, 0) / girls.length).toFixed(1) : '0';

    return {
      totalWorkingDays,
      avgPct,
      fullAttendanceCount,
      lowAttendanceCount,
      boyPct,
      girlPct,
      catBreakdown,
    };
  }, [studentStats, daysInMonth, selectedYear, selectedMonth]);

  // Filter students based on search, gender, and category
  const filteredStudentStats = useMemo(() => {
    return studentStats.filter(({ student }) => {
      const q = searchFilter.toLowerCase().trim();
      const match =
        !q ||
        student.nameGu.toLowerCase().includes(q) ||
        student.nameEn.toLowerCase().includes(q) ||
        String(student.rollNo).includes(q) ||
        student.grNo.toLowerCase().includes(q);

      if (!match) return false;
      if (selectedGender !== 'all' && student.gender !== selectedGender) return false;
      if (selectedCategory !== 'all' && (student.category || 'OBC') !== selectedCategory) return false;
      return true;
    });
  }, [studentStats, searchFilter, selectedGender, selectedCategory]);

  // Daily totals row
  const dailyColumns = useMemo(() => {
    const list: {
      day: number;
      dayOfWeek: number;
      isSunday: boolean;
      presentCount: number;
      absentCount: number;
      totalPct: string;
      hasRecord: boolean;
    }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dObj = new Date(selectedYear, selectedMonth - 1, d);
      const isSunday = dObj.getDay() === 0;
      const dStr = String(d).padStart(2, '0');
      const mStr = String(selectedMonth).padStart(2, '0');
      const dateKey = `${selectedYear}-${mStr}-${dStr}`;
      const dayRec = allRecords[dateKey];

      let p = 0;
      let a = 0;
      if (dayRec && !isSunday) {
        students.forEach((st) => {
          const s = dayRec.records[st.id] || 'present';
          if (s === 'present') p++;
          else if (s === 'absent') a++;
        });
      }

      const total = students.length;
      const totalPct = total > 0 && dayRec ? ((p / total) * 100).toFixed(0) : '-';

      list.push({
        day: d,
        dayOfWeek: dObj.getDay(),
        isSunday,
        presentCount: p,
        absentCount: a,
        totalPct,
        hasRecord: Boolean(dayRec),
      });
    }

    return list;
  }, [daysInMonth, selectedYear, selectedMonth, allRecords, students]);

  // Quick toggle inline on monthly matrix cell
  const handleCellClick = (d: number, studentId: string, currentStatus: AttendanceStatus | 'sunday' | 'unmarked') => {
    if (currentStatus === 'sunday') return; // Cannot edit Sunday

    const dStr = String(d).padStart(2, '0');
    const mStr = String(selectedMonth).padStart(2, '0');
    const dateKey = `${selectedYear}-${mStr}-${dStr}`;

    let nextStatus: AttendanceStatus = 'present';
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'leave';
    else nextStatus = 'present';

    onUpdateAttendance(dateKey, studentId, nextStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Month Selector & Controls Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Month Navigator */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="અગાઉનો મહિનો"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 font-bold text-slate-800 text-sm sm:text-base">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>
                  {monthNamesGu[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-colors cursor-pointer"
                title="આગામી મહિનો"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                const now = new Date();
                setSelectedYear(now.getFullYear());
                setSelectedMonth(now.getMonth() + 1);
              }}
              className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              ચાલુ માસ
            </button>
          </div>

          {/* Action Buttons: Export to Excel & Print */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() =>
                exportMonthlyAttendanceToExcel(
                  selectedYear,
                  selectedMonth,
                  students,
                  allRecords,
                  school
                )
              }
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>માસિક પત્રક એક્સેલમાં ડાઉનલોડ (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-200" />
              <span>પ્રિન્ટ / PDF</span>
            </button>
          </div>
        </div>

        {/* View Mode Toggle & Filter */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">દેખાવ:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewType('matrix')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  viewType === 'matrix' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                સંપૂર્ણ રજીસ્ટર ગ્રીડ (૧ થી ૩૧)
              </button>
              <button
                onClick={() => setViewType('cards')}
                className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                  viewType === 'cards' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600'
                }`}
              >
                વિદ્યાર્થીવાર સારાંશ
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="નામ / રોલ નં..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 rounded-md ${selectedCategory === 'all' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-500'}`}
              >
                બધી જાતિ
              </button>
              <button
                onClick={() => setSelectedCategory('OBC')}
                className={`px-2 py-1 rounded-md ${selectedCategory === 'OBC' ? 'bg-white text-amber-800 font-bold shadow-2xs' : 'text-slate-500'}`}
              >
                OBC ({overallKPIs.catBreakdown.OBC.count})
              </button>
              <button
                onClick={() => setSelectedCategory('ST')}
                className={`px-2 py-1 rounded-md ${selectedCategory === 'ST' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-500'}`}
              >
                ST ({overallKPIs.catBreakdown.ST.count})
              </button>
              <button
                onClick={() => setSelectedCategory('SC')}
                className={`px-2 py-1 rounded-md ${selectedCategory === 'SC' ? 'bg-white text-purple-800 font-bold shadow-2xs' : 'text-slate-500'}`}
              >
                SC ({overallKPIs.catBreakdown.SC.count})
              </button>
              <button
                onClick={() => setSelectedCategory('GEN')}
                className={`px-2 py-1 rounded-md ${selectedCategory === 'GEN' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-500'}`}
              >
                GEN ({overallKPIs.catBreakdown.GEN.count})
              </button>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedGender('all')}
                className={`px-2 py-1 rounded-md ${selectedGender === 'all' ? 'bg-white text-slate-800 font-bold' : 'text-slate-500'}`}
              >
                બધા
              </button>
              <button
                onClick={() => setSelectedGender('boy')}
                className={`px-2 py-1 rounded-md ${selectedGender === 'boy' ? 'bg-white text-blue-700 font-bold' : 'text-slate-500'}`}
              >
                કુમાર
              </button>
              <button
                onClick={() => setSelectedGender('girl')}
                className={`px-2 py-1 rounded-md ${selectedGender === 'girl' ? 'bg-white text-pink-700 font-bold' : 'text-slate-500'}`}
              >
                કન્યા
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable School Header (Only visible when printing or in formal view) */}
      <div className="hidden print:block bg-white p-4 border-b-2 border-black text-center mb-4">
        <h2 className="text-xl font-bold text-black">{school.schoolName}</h2>
        <p className="text-sm text-black">
          તા: {school.taluka}, જિ: {school.district} | ડાયસ કોડ: {school.diseCode}
        </p>
        <h3 className="text-base font-bold mt-1 text-black">
          માસિક વિદ્યાર્થી હાજરી પત્રક - {school.standard} ({school.division})
        </h3>
        <p className="text-xs text-black mt-0.5">
          માસ: {monthNamesGu[selectedMonth - 1]} {selectedYear} | વર્ગ શિક્ષક: {school.teacherName}
        </p>
      </div>

      {/* Monthly KPI Overview Cards (Hidden on print) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>કુલ કામકાજના દિવસો</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overallKPIs.totalWorkingDays} દિવસ</div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {monthNamesGu[selectedMonth - 1]} માસ
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>સરેરાશ વર્ગ હાજરી</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{overallKPIs.avgPct}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            કુમાર: {overallKPIs.boyPct}% · કન્યા: {overallKPIs.girlPct}%
          </p>
        </div>

        <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs mb-1 font-medium">
            <span>ઉત્તમ હાજરી (≥95%)</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">
            {overallKPIs.fullAttendanceCount}
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            તેજસ્વી નિયમિત વિદ્યાર્થીઓ
          </p>
        </div>

        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-medium">
            <span>ધ્યાન આપવા જેવી (&lt;75%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">
            {overallKPIs.lowAttendanceCount}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
            વાલી સંપર્ક જરૂરી
          </p>
        </div>
      </div>

      {/* Social Category-wise Monthly Breakdown Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs print:hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              જાતિવાર માસિક સરેરાશ હાજરી (Social Category Performance)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">સરકારી રિટર્ન મુજબ</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            onClick={() => setSelectedCategory(selectedCategory === 'OBC' ? 'all' : 'OBC')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === 'OBC' ? 'border-amber-500 bg-amber-100/80 shadow-2xs ring-2 ring-amber-400/40' : 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">ઓબીસી (OBC)</span>
              <span className="font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded text-[11px]">
                {overallKPIs.catBreakdown.OBC.avgPct}%
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              વિદ્યાર્થીઓ: <b className="text-slate-800">{overallKPIs.catBreakdown.OBC.count}</b>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'ST' ? 'all' : 'ST')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === 'ST' ? 'border-emerald-500 bg-emerald-100/80 shadow-2xs ring-2 ring-emerald-400/40' : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">એસ.ટી. (ST)</span>
              <span className="font-bold text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded text-[11px]">
                {overallKPIs.catBreakdown.ST.avgPct}%
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              વિદ્યાર્થીઓ: <b className="text-slate-800">{overallKPIs.catBreakdown.ST.count}</b>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'SC' ? 'all' : 'SC')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === 'SC' ? 'border-purple-500 bg-purple-100/80 shadow-2xs ring-2 ring-purple-400/40' : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900">એસ.સી. (SC)</span>
              <span className="font-bold text-purple-800 bg-purple-200/70 px-1.5 py-0.5 rounded text-[11px]">
                {overallKPIs.catBreakdown.SC.avgPct}%
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              વિદ્યાર્થીઓ: <b className="text-slate-800">{overallKPIs.catBreakdown.SC.count}</b>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory(selectedCategory === 'GEN' ? 'all' : 'GEN')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === 'GEN' ? 'border-blue-500 bg-blue-100/80 shadow-2xs ring-2 ring-blue-400/40' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900">જનરલ (GEN)</span>
              <span className="font-bold text-blue-800 bg-blue-200/70 px-1.5 py-0.5 rounded text-[11px]">
                {overallKPIs.catBreakdown.GEN.avgPct}%
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              વિદ્યાર્થીઓ: <b className="text-slate-800">{overallKPIs.catBreakdown.GEN.count}</b>
            </div>
          </div>
        </div>
      </div>

      {/* MATRIX REGISTER TABLE (THE OFFICIAL HAJARI PATRAK FORMAT) */}
      {viewType === 'matrix' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
              <thead>
                {/* School Row on table top */}
                <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="py-2 px-2 sticky left-0 bg-slate-100 z-20 w-8 text-center border-r border-slate-300">
                    રોલ
                  </th>
                  <th className="py-2 px-2 sticky left-8 bg-slate-100 z-20 w-16 text-center border-r border-slate-300">
                    જી.આર.
                  </th>
                  <th className="py-2 px-3 sticky left-24 bg-slate-100 z-20 min-w-[170px] max-w-[210px] border-r border-slate-300">
                    વિદ્યાર્થીનું નામ
                  </th>
                  <th className="py-2 px-1 text-center w-10 border-r border-slate-300">
                    જાતિ
                  </th>
                  <th className="py-2 px-1 text-center w-12 border-r border-slate-300">
                    કેટેગરી
                  </th>

                  {/* Day Columns */}
                  {dailyColumns.map((col) => (
                    <th
                      key={col.day}
                      className={`py-1.5 px-0.5 text-center min-w-[24px] border-r border-slate-200 ${
                        col.isSunday
                          ? 'bg-rose-100 text-rose-800 font-bold'
                          : 'bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-[10px]">{col.day}</div>
                      <div className="text-[8px] font-normal">{dayNamesGu[col.dayOfWeek]}</div>
                    </th>
                  ))}

                  {/* Summary Columns */}
                  <th className="py-2 px-2 text-center bg-emerald-50 text-emerald-900 border-l border-emerald-300 font-bold w-12">
                    હાજર
                  </th>
                  <th className="py-2 px-2 text-center bg-rose-50 text-rose-900 border-l border-rose-200 font-bold w-12">
                    ગેર.
                  </th>
                  <th className="py-2 px-2 text-center bg-amber-50 text-amber-900 border-l border-amber-200 font-bold w-12">
                    રજા
                  </th>
                  <th className="py-2 px-2 text-center bg-slate-100 text-slate-900 border-l border-slate-300 font-bold w-14">
                    ટકા %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredStudentStats.map(({ student, present, absent, leave, percentage, dayStatuses }) => {
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Sticky Roll No */}
                      <td className="py-2 px-2 text-center font-bold text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10">
                        {student.rollNo}
                      </td>

                      {/* Sticky GR No */}
                      <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-500 sticky left-8 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10">
                        {student.grNo}
                      </td>

                      {/* Sticky Student Name with mini avatar */}
                      <td className="py-2 px-3 sticky left-24 bg-white group-hover:bg-slate-50 border-r border-slate-200 z-10">
                        <div className="flex items-center gap-2">
                          <img
                            src={student.photo}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover shrink-0 print:hidden"
                          />
                          <div className="truncate font-semibold text-slate-900 leading-tight">
                            {student.nameGu}
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-2 px-1 text-center border-r border-slate-200">
                        <span
                          className={`text-[9px] font-bold ${
                            student.gender === 'boy' ? 'text-blue-600' : 'text-pink-600'
                          }`}
                        >
                          {student.gender === 'boy' ? 'કુ' : 'ક'}
                        </span>
                      </td>

                      {/* Category (OBC / ST / SC / GEN) */}
                      <td className="py-2 px-1 text-center border-r border-slate-200">
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded border ${
                            student.category === 'OBC'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : student.category === 'ST'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : student.category === 'SC'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : 'bg-blue-50 text-blue-800 border-blue-300'
                          }`}
                        >
                          {student.category || 'OBC'}
                        </span>
                      </td>

                      {/* Days 1 to 31 */}
                      {dailyColumns.map((col) => {
                        const status = dayStatuses[col.day];
                        const isSunday = col.isSunday;

                        if (isSunday) {
                          return (
                            <td
                              key={col.day}
                              className="py-1 px-0.5 text-center bg-rose-50/60 text-rose-500 font-medium text-[9px] border-r border-slate-200 select-none"
                            >
                              ર
                            </td>
                          );
                        }

                        let cellClass = 'text-slate-400';
                        let label = '-';

                        if (status === 'present') {
                          cellClass = 'bg-emerald-100/70 text-emerald-800 font-bold';
                          label = 'P';
                        } else if (status === 'absent') {
                          cellClass = 'bg-rose-100 text-rose-800 font-bold';
                          label = 'A';
                        } else if (status === 'leave') {
                          cellClass = 'bg-amber-100 text-amber-800 font-bold';
                          label = 'L';
                        }

                        return (
                          <td
                            key={col.day}
                            onClick={() => handleCellClick(col.day, student.id, status)}
                            className={`py-1 px-0.5 text-center border-r border-slate-200 cursor-pointer select-none hover:ring-1 hover:ring-emerald-500 transition-colors ${cellClass}`}
                            title={`તારીખ ${col.day}: ${
                              status === 'present'
                                ? 'હાજર'
                                : status === 'absent'
                                ? 'ગેરહાજર'
                                : status === 'leave'
                                ? 'રજા'
                                : 'નોંધાયેલ નથી'
                            } (બદલવા ક્લિક કરો)`}
                          >
                            {label}
                          </td>
                        );
                      })}

                      {/* Total Present */}
                      <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/40 border-l border-emerald-200">
                        {present}
                      </td>

                      {/* Total Absent */}
                      <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/40 border-l border-rose-200">
                        {absent}
                      </td>

                      {/* Total Leave */}
                      <td className="py-2 px-2 text-center font-medium text-amber-700 bg-amber-50/40 border-l border-amber-200">
                        {leave}
                      </td>

                      {/* Percentage */}
                      <td className="py-2 px-2 text-center font-bold border-l border-slate-200">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            percentage >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : percentage < 75
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Bottom Daily Present Total Row */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={5} className="py-2 px-3 text-right border-r border-slate-300 sticky left-0 bg-slate-100 z-10">
                    દૈનિક હાજર સંખ્યા:
                  </td>
                  {dailyColumns.map((col) => (
                    <td
                      key={col.day}
                      className={`py-1 text-center border-r border-slate-300 text-[10px] ${
                        col.isSunday ? 'bg-rose-100 text-rose-600' : 'text-emerald-700 font-bold'
                      }`}
                    >
                      {col.isSunday ? '-' : col.hasRecord ? col.presentCount : '-'}
                    </td>
                  ))}
                  <td colSpan={4} className="py-2 px-2 text-center bg-slate-200 text-slate-800">
                    માસિક હાજરી %
                  </td>
                </tr>

                {/* Bottom Daily Absent Total Row */}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={5} className="py-2 px-3 text-right border-r border-slate-300 sticky left-0 bg-slate-50 z-10 text-slate-700">
                    દૈનિક ગેરહાજર સંખ્યા:
                  </td>
                  {dailyColumns.map((col) => (
                    <td
                      key={col.day}
                      className={`py-1 text-center border-r border-slate-200 text-[10px] ${
                        col.isSunday ? 'bg-rose-100 text-rose-600' : 'text-rose-700 font-bold'
                      }`}
                    >
                      {col.isSunday ? '-' : col.hasRecord ? col.absentCount : '-'}
                    </td>
                  ))}
                  <td colSpan={4} className="py-2 px-2 text-center text-emerald-800 font-bold text-sm bg-emerald-100">
                    {overallKPIs.avgPct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-100 border border-emerald-400 rounded text-emerald-800 text-[9px] font-bold flex items-center justify-center">
                  P
                </span>
                <span>હાજર (Present)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-rose-100 border border-rose-400 rounded text-rose-800 text-[9px] font-bold flex items-center justify-center">
                  A
                </span>
                <span>ગેરહાજર (Absent)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-amber-100 border border-amber-400 rounded text-amber-800 text-[9px] font-bold flex items-center justify-center">
                  L
                </span>
                <span>રજા (Leave)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-rose-100 rounded text-rose-700 text-[9px] font-bold flex items-center justify-center">
                  ર
                </span>
                <span>રવિવાર (Sunday)</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-500">
              * કોઈપણ ખાના (Cell) પર ક્લિક કરીને હાજરી તરત બદલી શકાય છે.
            </span>
          </div>
        </div>
      ) : (
        /* CARDS / RANKING VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStudentStats.map(({ student, present, absent, leave, workingDays, percentage }) => {
            const isTop = percentage >= 90;
            const isLow = percentage < 75;

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                  isTop
                    ? 'border-emerald-300 ring-1 ring-emerald-300/30'
                    : isLow
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={student.photo}
                      alt={student.nameGu}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          #{student.rollNo}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            student.gender === 'boy'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}
                        >
                          {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                            student.category === 'OBC'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : student.category === 'ST'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : student.category === 'SC'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {student.category || 'OBC'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                        {student.nameGu}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">GR: {student.grNo}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center mb-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">હાજર</span>
                      <span className="font-bold text-emerald-700 text-sm">{present}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ગેરહાજર</span>
                      <span className="font-bold text-rose-700 text-sm">{absent}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">રજા</span>
                      <span className="font-bold text-amber-700 text-sm">{leave}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">માસિક ટકાવારી:</span>
                    <span
                      className={`font-bold text-sm ${
                        isTop ? 'text-emerald-700' : isLow ? 'text-rose-700' : 'text-slate-800'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isTop ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400">કુલ કામકાજના {workingDays} દિવસ</span>
                    {isTop && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> નિયમિત
                      </span>
                    )}
                    {isLow && (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> ઓછી હાજરી
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official Signatures Section for Printing */}
      <div className="hidden print:flex justify-between items-end pt-16 px-8 mt-12 text-sm text-black">
        <div className="text-center">
          <div className="w-48 border-t border-black mb-1"></div>
          <p className="font-bold">વર્ગ શિક્ષકની સહી</p>
          <p className="text-xs">({school.teacherName})</p>
        </div>

        <div className="text-center">
          <div className="w-48 border-t border-black mb-1"></div>
          <p className="font-bold">આચાર્યશ્રીની સહી અને સિક્કો</p>
          <p className="text-xs">{school.schoolName}</p>
        </div>
      </div>
    </div>
  );
};
