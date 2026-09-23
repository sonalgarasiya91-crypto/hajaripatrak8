import React, { useMemo } from 'react';
import { Award, Users, TrendingUp, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { Student, DayAttendance, SchoolProfile } from '../types';

interface AnalyticsViewProps {
  students: Student[];
  allRecords: Record<string, DayAttendance>;
  school: SchoolProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  allRecords,
}) => {
  // Compute overall stats across all recorded days
  const analyticsData = useMemo(() => {
    const dates = Object.keys(allRecords).sort();
    const totalRecordedDays = dates.length;

    // Student performance rankings
    const studentPerformance = students.map((s) => {
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;

      dates.forEach((d) => {
        const status = allRecords[d].records[s.id] || 'present';
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'leave') leaveCount++;
      });

      const total = totalRecordedDays || 1;
      const pct = Number(((presentCount / total) * 100).toFixed(1));

      return {
        student: s,
        presentCount,
        absentCount,
        leaveCount,
        pct,
      };
    });

    studentPerformance.sort((a, b) => b.pct - a.pct);

    const topStudents = studentPerformance.filter((s) => s.pct >= 90).slice(0, 8);
    const lowStudents = studentPerformance.filter((s) => s.pct < 75);

    // Boy vs Girl comparison
    const boys = studentPerformance.filter((s) => s.student.gender === 'boy');
    const girls = studentPerformance.filter((s) => s.student.gender === 'girl');

    const boyAvg = boys.length > 0 ? (boys.reduce((acc, c) => acc + c.pct, 0) / boys.length).toFixed(1) : '0';
    const girlAvg = girls.length > 0 ? (girls.reduce((acc, c) => acc + c.pct, 0) / girls.length).toFixed(1) : '0';

    // Recent 7 days trend
    const recent7Dates = dates.slice(-7);
    const dayTrends = recent7Dates.map((d) => {
      const rec = allRecords[d];
      let p = 0;
      students.forEach((st) => {
        if ((rec.records[st.id] || 'present') === 'present') p++;
      });
      const pct = students.length > 0 ? ((p / students.length) * 100).toFixed(0) : '0';
      const [, m, day] = d.split('-');
      return {
        date: `${day}/${m}`,
        present: p,
        pct: Number(pct),
      };
    });

    return {
      totalRecordedDays,
      topStudents,
      lowStudents,
      boyAvg,
      girlAvg,
      dayTrends,
      totalStudents: students.length,
      boyCount: boys.length,
      girlCount: girls.length,
    };
  }, [students, allRecords]);

  return (
    <div className="space-y-6 pb-16">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Boy vs Girl Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>કુમાર અને કન્યા હાજરી સરખામણી</span>
            </h3>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">કુમાર ({analyticsData.boyCount})</span>
                <span className="text-blue-800">{analyticsData.boyAvg}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${analyticsData.boyAvg}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-pink-700">કન્યા ({analyticsData.girlCount})</span>
                <span className="text-pink-800">{analyticsData.girlAvg}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-pink-600 h-full rounded-full"
                  style={{ width: `${analyticsData.girlAvg}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance Trend */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>છેલ્લા ૭ દિવસનો હાજરી ટ્રેન્ડ</span>
            </h3>
          </div>

          <div className="flex items-end justify-between h-28 pt-4 px-2 gap-2">
            {analyticsData.dayTrends.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold text-emerald-700">{d.pct}%</span>
                <div
                  className="w-full max-w-[28px] bg-emerald-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(15, (d.pct / 100) * 80)}px` }}
                />
                <span className="text-[9px] text-slate-500 truncate">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Days Recorded */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-950 text-white rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-200">કુલ નોંધાયેલ દિવસો</span>
              <Calendar className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-3xl font-bold">{analyticsData.totalRecordedDays} દિવસો</div>
            <p className="text-xs text-emerald-100/80 mt-1">
              ધોરણ ૮ - સાથરોટા પ્રાથમિક શાળા
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 text-xs text-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>દરેક દિવસનો ડેટા એક્સેલમાં સુરક્ષિત છે</span>
          </div>
        </div>
      </div>

      {/* Top Performers Section (નિયમિત વિદ્યાર્થીઓ) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              સૌથી નિયમિત વિદ્યાર્થીઓ (ટોચના તારલાઓ)
            </h3>
          </div>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            ૯૦% થી વધુ હાજરી
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {analyticsData.topStudents.map(({ student, pct }, idx) => (
            <div
              key={student.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3"
            >
              <div className="relative shrink-0">
                <img
                  src={student.photo}
                  alt={student.nameGu}
                  className="w-10 h-10 rounded-full object-cover border border-amber-300"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 text-slate-900 rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {idx + 1}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-slate-900 truncate">{student.nameGu}</h4>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-slate-400 font-mono">#{student.rollNo}</span>
                  <span className="font-bold text-emerald-700">{pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Required (<75% attendance) */}
      {analyticsData.lowStudents.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-rose-900 text-sm">
              ધ્યાન આપવા જેવી હાજરી (૭૫% થી ઓછી - વાલી મુલાકાત)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {analyticsData.lowStudents.map(({ student, pct, absentCount }) => (
              <div
                key={student.id}
                className="bg-white border border-rose-200 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={student.photo}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-rose-300"
                  />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{student.nameGu}</h5>
                    <p className="text-[10px] text-slate-400 font-mono">#{student.rollNo} · GR: {student.grNo}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-rose-700 block">{pct}%</span>
                  <span className="text-[10px] text-rose-500">{absentCount} ગેરહાજર</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
