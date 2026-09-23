import React from 'react';
import { School, Calendar, Users, BarChart3, FileSpreadsheet, Volume2, VolumeX, UserPlus, Sparkles, Settings2 } from 'lucide-react';
import { SchoolProfile } from '../types';

interface HeaderProps {
  activeTab: 'daily' | 'monthly' | 'students' | 'analytics';
  setActiveTab: (tab: 'daily' | 'monthly' | 'students' | 'analytics') => void;
  school: SchoolProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAddStudent: () => void;
  onOpenEditSchool: () => void;
  totalStudents: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  school,
  soundEnabled,
  onToggleSound,
  onOpenAddStudent,
  onOpenEditSchool,
  totalStudents,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      {/* Top Banner with School Identity */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <School className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{school.schoolName}</span>
                </h1>
                <span className="text-xs bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-medium">
                  {school.standard}
                </span>
                <span className="text-xs bg-white/15 text-emerald-50 px-2 py-0.5 rounded-full">
                  વર્ગ: {school.division}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-emerald-200 bg-emerald-950/40 px-2 py-0.5 rounded">
                  તા: {school.taluka}, જિ: {school.district}
                </span>
                <span>·</span>
                <span>ડાયસ કોડ: {school.diseCode}</span>
                <span>·</span>
                <span className="text-emerald-100 font-medium">શિક્ષક: {school.teacherName}</span>
              </p>
            </div>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={onOpenEditSchool}
              title="શાળા અને વર્ગની વિગતો બદલો"
              className="p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">શાળા વિગત</span>
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'અવાજ બંધ કરો (Mute Sound)' : 'અવાજ ચાલુ કરો (Enable Sound)'}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-700/60 border-emerald-500/40 text-emerald-100 hover:bg-emerald-700'
                  : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-300" />
                  <span className="hidden sm:inline">અવાજ ચાલુ</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-rose-300" />
                  <span className="hidden sm:inline">અવાજ બંધ</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenAddStudent}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>વિદ્યાર્થી ઉમેરો</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 py-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className={`w-4 h-4 ${activeTab === 'daily' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>દૈનિક હાજરી (ફોટો ક્લિક)</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'monthly' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>માસિક પત્રક (અહેવાલ)</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>હાજરી વિશ્લેષણ</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'students'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className={`w-4 h-4 ${activeTab === 'students' ? 'text-emerald-600' : 'text-slate-500'}`} />
              <span>વિદ્યાર્થી યાદી ({totalStudents})</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center text-xs text-slate-500 gap-1.5 shrink-0 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ફોટો પર ક્લિક કરતાં જ હાજરી પુરાશે</span>
          </div>
        </div>
      </div>
    </header>
  );
};
