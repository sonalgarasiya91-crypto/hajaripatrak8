import React, { useState } from 'react';
import { X, Upload, Plus, Trash2, Edit2, RotateCcw, Check, Users, Search } from 'lucide-react';
import { Student, StudentCategory } from '../types';
import { getStudentAvatar, CATEGORY_CONFIG } from '../data/initialStudents';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddStudent: (newStudent: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onResetToDefault: () => void;
  studentToEdit?: Student | null;
  openAddDirectly?: boolean;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onResetToDefault,
  studentToEdit = null,
  openAddDirectly = false,
}) => {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [nameGu, setNameGu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [rollNo, setRollNo] = useState<number>(students.length + 1);
  const [grNo, setGrNo] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [category, setCategory] = useState<StudentCategory>('OBC');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (studentToEdit) {
        setEditingStudent(studentToEdit);
        setNameGu(studentToEdit.nameGu);
        setNameEn(studentToEdit.nameEn);
        setRollNo(studentToEdit.rollNo);
        setGrNo(studentToEdit.grNo);
        setGender(studentToEdit.gender);
        setCategory(studentToEdit.category || 'OBC');
        setPhotoUrl(studentToEdit.photo);
        setContactNo(studentToEdit.contactNo || '');
        setIsFormOpen(true);
      } else if (openAddDirectly) {
        handleOpenAddForm();
      } else {
        setIsFormOpen(false);
        setEditingStudent(null);
      }
    }
  }, [isOpen, studentToEdit, openAddDirectly]);

  if (!isOpen) return null;

  // Handle Photo Upload (File to base64 Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddForm = () => {
    setEditingStudent(null);
    setNameGu('');
    setNameEn('');
    setRollNo(students.length + 1);
    setGrNo(String(2410 + students.length + 1));
    setGender('boy');
    setCategory('OBC');
    setContactNo('');
    setPhotoUrl(getStudentAvatar('વિદ્યાર્થી', 'boy', students.length));
    setIsFormOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setEditingStudent(student);
    setNameGu(student.nameGu);
    setNameEn(student.nameEn);
    setRollNo(student.rollNo);
    setGrNo(student.grNo);
    setGender(student.gender);
    setCategory(student.category || 'OBC');
    setPhotoUrl(student.photo);
    setContactNo(student.contactNo || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGu.trim()) return;

    const resolvedPhoto = photoUrl || getStudentAvatar(nameGu, gender, rollNo);

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        nameGu: nameGu.trim(),
        nameEn: nameEn.trim() || nameGu.trim(),
        rollNo: Number(rollNo),
        grNo: grNo.trim() || String(rollNo),
        gender,
        category,
        photo: resolvedPhoto,
        contactNo: contactNo.trim(),
      });
    } else {
      onAddStudent({
        nameGu: nameGu.trim(),
        nameEn: nameEn.trim() || nameGu.trim(),
        rollNo: Number(rollNo),
        grNo: grNo.trim() || String(rollNo),
        gender,
        category,
        photo: resolvedPhoto,
        contactNo: contactNo.trim(),
      });
    }

    setIsFormOpen(false);
  };

  const boysCount = students.filter((s) => s.gender === 'boy').length;
  const girlsCount = students.filter((s) => s.gender === 'girl').length;

  const filteredStudents = students.filter((s) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nameGu.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      String(s.rollNo).includes(q) ||
      s.grNo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 flex-wrap">
              <span>વિદ્યાર્થી સંચાલન (Add / Update / Delete)</span>
              <span className="text-xs font-semibold bg-emerald-800 text-emerald-100 px-2.5 py-0.5 rounded-full">
                કુલ {students.length} (કુમાર: {boysCount} | કન્યા: {girlsCount})
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              સાથરોટા પ્રાથમિક શાળા - ધોરણ ૮ · વિદ્યાર્થી ઉમેરો, સુધારો કે ડિલીટ કરો
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Action button bar */}
          {!isFormOpen ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <button
                onClick={handleOpenAddForm}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ નવો વિદ્યાર્થી ઉમેરો (Add Student)</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative text-xs flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="યાદીમાં શોધો..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'શું તમે ધોરણ ૮ ની યાદી ૧૬ કુમાર અને ૧૮ કન્યા (કુલ ૩૪ વિદ્યાર્થી - SC: ૧ કુ.+૧ ક., ST: ૨ કુ.+૧ ક.) સાથે મૂળ સ્થિતિ પર રીસેટ કરવા માંગો છો?'
                      )
                    ) {
                      onResetToDefault();
                    }
                  }}
                  title="૧૬ કુમાર અને ૧૮ કન્યા પર રીસેટ કરો"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>૩૪ વિદ્યાર્થી ડિફોલ્ટ રીસેટ</span>
                </button>
              </div>
            </div>
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingStudent ? `વિદ્યાર્થી સુધારો: ${editingStudent.nameGu}` : 'નવા વિદ્યાર્થીની માહિતી ઉમેરો'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 bg-white border border-slate-200 rounded-lg"
                >
                  રદ કરો
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    વિદ્યાર્થીનું પૂરું નામ (ગુજરાતીમાં) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="દા.ત. ગરાસીયા રાજવીરસિંહ મહેન્દ્રસિંહ"
                    value={nameGu}
                    onChange={(e) => setNameGu(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    વિદ્યાર્થીનું નામ (English)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Garasiya Rajvirsinh M."
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      રોલ નંબર *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={rollNo}
                      onChange={(e) => setRollNo(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      જી.આર. નંબર *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GR No."
                      value={grNo}
                      onChange={(e) => setGrNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Gender selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    જાતિ (કુમાર / કન્યા) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('boy')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        gender === 'boy'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      કુમાર (Boy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('girl')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        gender === 'girl'
                          ? 'bg-pink-600 text-white border-pink-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      કન્યા (Girl)
                    </button>
                  </div>
                </div>

                {/* Category (OBC / ST / SC / GEN) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    સામાજિક કેટેગરી (જાતિવાર વર્ગીકરણ) *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['OBC', 'ST', 'SC', 'GEN'] as StudentCategory[]).map((cat) => {
                      const cfg = CATEGORY_CONFIG[cat];
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs ring-2 ring-emerald-500/50'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    પસંદ કરેલ: <span className="font-semibold text-slate-800">{CATEGORY_CONFIG[category].labelGu}</span>
                  </p>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    વાલીનો મોબાઈલ નંબર
                  </label>
                  <input
                    type="text"
                    placeholder="98250..."
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Photo Upload & Preview */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  વિદ્યાર્થીનો ફોટો (Student Photo)
                </label>
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-600 shrink-0">
                    <img
                      src={photoUrl || getStudentAvatar(nameGu || 'વિ', gender, rollNo)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>મોબાઈલ કે કમ્પ્યુટરમાંથી ફોટો અપલોડ કરો</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      ફોટો અપલોડ ન કરો તો પણ વિદ્યાર્થીના નામના આધારે સુંદર અવતાર બની જશે.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStudent ? 'સુધારો સેવ કરો (Update)' : 'વિદ્યાર્થી ઉમેરો (Save Student)'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Student Table List with Edit & Delete */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                વિદ્યાર્થીઓની યાદી ({filteredStudents.length} વિદ્યાર્થી)
              </span>
              <span className="text-[11px] text-slate-500">
                માહિતી બદલવા પેન્સિલ (Edit) અથવા કાઢી નાખવા લાલ ડસ્ટબિન (Delete) પર ક્લિક કરો
              </span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">રોલ</th>
                    <th className="py-2.5 px-3 w-14">ફોટો</th>
                    <th className="py-2.5 px-3">વિદ્યાર્થીનું નામ</th>
                    <th className="py-2.5 px-3 w-20">જી.આર.</th>
                    <th className="py-2.5 px-3 w-16">જાતિ</th>
                    <th className="py-2.5 px-3 w-16">કેટેગરી</th>
                    <th className="py-2.5 px-3 w-28 text-center">ક્રિયા (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-800">
                        #{student.rollNo}
                      </td>
                      <td className="py-2 px-3">
                        <img
                          src={student.photo}
                          alt=""
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{student.nameGu}</div>
                        <div className="text-[11px] text-slate-400">{student.nameEn}</div>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{student.grNo}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            student.gender === 'boy'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {student.gender === 'boy' ? 'કુમાર' : 'કન્યા'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
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
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => handleEditClick(student)}
                            className="px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                            title="વિગતો સુધારો (Edit)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">સુધારો</span>
                          </button>

                          {/* DELETE BUTTON */}
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
                            className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer"
                            title="વિદ્યાર્થી ડિલીટ કરો (Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ડિલીટ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
