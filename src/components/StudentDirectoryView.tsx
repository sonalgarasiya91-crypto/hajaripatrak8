import React, { useState } from 'react';
import { Search, Phone, Edit2, Trash2, UserPlus, Users, Award, ShieldCheck } from 'lucide-react';
import { Student, DayAttendance, SchoolProfile, StudentCategory } from '../types';
import { CATEGORY_CONFIG } from '../data/initialStudents';

interface StudentDirectoryViewProps {
  students: Student[];
  allRecords: Record<string, DayAttendance>;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onOpenAddModal: () => void;
  school: SchoolProfile;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  students,
  allRecords,
  onEditStudent,
  onDeleteStudent,
  onOpenAddModal,
  school,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StudentCategory>('all');

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      s.nameGu.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      String(s.rollNo).includes(q) ||
      s.grNo.toLowerCase().includes(q);

    if (!matchQuery) return false;
    if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
    if (categoryFilter !== 'all' && (s.category || 'OBC') !== categoryFilter) return false;
    return true;
  });

  // Calculate each student's attendance percentage across all records
  const dates = Object.keys(allRecords);
  const totalDays = dates.length || 1;

  const getStudentStats = (studentId: string) => {
    let present = 0;
    dates.forEach((d) => {
      if ((allRecords[d]?.records[studentId] || 'present') === 'present') {
        present++;
      }
    });
    return {
      present,
      percentage: Number(((present / totalDays) * 100).toFixed(1)),
    };
  };

  const boyCount = students.filter((s) => s.gender === 'boy').length;
  const girlCount = students.filter((s) => s.gender === 'girl').length;

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>વિદ્યાર્થી ડિરેક્ટરી - {school.standard}</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              કુલ: {students.length} (કુમાર: {boyCount} | કન્યા: {girlCount})
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            સાથરોટા પ્રાથમિક શાળા · વિદ્યાર્થી ઉમેરવા, સુધારવા અને ડિલીટ કરવાની સંપૂર્ણ સુવિધા
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ નવો વિદ્યાર્થી ઉમેરો (Add Student)</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="નામ, રોલ નંબર અથવા જી.આર. નંબરથી શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">જાતિ:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                  genderFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                બધા ({students.length})
              </button>
              <button
                onClick={() => setGenderFilter('boy')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                  genderFilter === 'boy' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                કુમાર ({boyCount})
              </button>
              <button
                onClick={() => setGenderFilter('girl')}
                className={`px-3 py-1 rounded-md font-medium cursor-pointer ${
                  genderFilter === 'girl' ? 'bg-white text-pink-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                કન્યા ({girlCount})
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium mr-1">કેટેગરી ફિલ્ટર:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-md cursor-pointer ${
                categoryFilter === 'all' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              બધી કેટેગરી
            </button>
            {(['OBC', 'ST', 'SC', 'GEN'] as StudentCategory[]).map((cat) => {
              const list = students.filter((s) => (s.category || 'OBC') === cat);
              const count = list.length;
              const boys = list.filter((s) => s.gender === 'boy').length;
              const girls = list.filter((s) => s.gender === 'girl').length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    categoryFilter === cat ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
                  }`}
                  title={`${cat}: કુલ ${count} (${boys} કુમાર, ${girls} કન્યા)`}
                >
                  {cat}: {count} ({boys} કુ + {girls} ક)
                </button>
              );
            })}
          </div>

          {(searchQuery || genderFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setGenderFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium ml-auto cursor-pointer"
            >
              ફિલ્ટર સાફ કરો
            </button>
          )}
        </div>
      </div>

      {/* Students Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStudents.map((student) => {
          const stats = getStudentStats(student.id);

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.photo}
                      alt={student.nameGu}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          #{student.rollNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            student.gender === 'boy'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
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
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">
                        GR: {student.grNo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditStudent(student)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer border border-transparent hover:border-emerald-200"
                      title="વિગતો સુધારો (Edit)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `શું તમે ખરેખર રોલ નં. ${student.rollNo} - ${student.nameGu} ને યાદીમાંથી ડિલીટ કરવા માંગો છો?`
                          )
                        ) {
                          onDeleteStudent(student.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border border-transparent hover:border-rose-200"
                      title="વિદ્યાર્થી ડિલીટ કરો (Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug">
                  {student.nameGu}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {student.nameEn}
                </p>

                {student.contactNo && (
                  <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{student.contactNo}</span>
                  </p>
                )}
              </div>

              {/* Attendance Progress summary */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">કુલ હાજરી ટકાવારી:</span>
                  <span
                    className={`font-bold ${
                      stats.percentage >= 90
                        ? 'text-emerald-700'
                        : stats.percentage < 75
                        ? 'text-rose-700'
                        : 'text-slate-800'
                    }`}
                  >
                    {stats.percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stats.percentage >= 90
                        ? 'bg-emerald-500'
                        : stats.percentage < 75
                        ? 'bg-rose-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, stats.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
