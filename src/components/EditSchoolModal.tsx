import React, { useState } from 'react';
import { X, School, Check } from 'lucide-react';
import { SchoolProfile } from '../types';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolProfile;
  onSave: (updated: SchoolProfile) => void;
}

export const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  isOpen,
  onClose,
  school,
  onSave,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>(school);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">શાળા અને વર્ગની વિગતો</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              શાળાનું નામ *
            </label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                તાલુકો *
              </label>
              <input
                type="text"
                required
                value={formData.taluka}
                onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                જિલ્લો *
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ધોરણ
              </label>
              <input
                type="text"
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                વર્ગ / વર્ગખંડ
              </label>
              <input
                type="text"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ડાયસ કોડ (DISE Code)
              </label>
              <input
                type="text"
                value={formData.diseCode}
                onChange={(e) => setFormData({ ...formData, diseCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                શૈક્ષણિક વર્ષ
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              વર્ગ શિક્ષકનું નામ
            </label>
            <input
              type="text"
              value={formData.teacherName}
              onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>સેવ કરો</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
