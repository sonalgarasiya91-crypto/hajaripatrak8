import { Student, DayAttendance, SchoolProfile, AttendanceStatus } from '../types';
import { INITIAL_STUDENTS, DEFAULT_SCHOOL } from '../data/initialStudents';

const STORAGE_KEYS = {
  STUDENTS: 'sathrota_std8_students_v1',
  ATTENDANCE: 'sathrota_std8_attendance_v1',
  SCHOOL: 'sathrota_std8_school_v1',
  SOUND_ENABLED: 'sathrota_sound_enabled',
};

// Seed realistic previous days in the current month so the monthly report has real data
function generateSeedAttendance(students: Student[]): Record<string, DayAttendance> {
  const records: Record<string, DayAttendance> = {};
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDate = today.getDate();

  // Seed from 1st of the month up to yesterday
  for (let day = 1; day < currentDate; day++) {
    const d = new Date(currentYear, currentMonth, day);
    if (d.getDay() === 0) continue; // Skip Sunday

    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRecords: Record<string, AttendanceStatus> = {};

    students.forEach((s, idx) => {
      // Create realistic attendance pattern (mostly present, occasional absent/leave)
      // Some students have 100% attendance, some miss 1 or 2 days
      const rand = (idx * 17 + day * 13) % 100;
      if (rand < 88) {
        dayRecords[s.id] = 'present';
      } else if (rand < 95) {
        dayRecords[s.id] = 'absent';
      } else {
        dayRecords[s.id] = 'leave';
      }
    });

    records[dateStr] = {
      date: dateStr,
      records: dayRecords,
      updatedAt: new Date(d.setHours(9, 30, 0, 0)).toISOString(),
    };
  }

  return records;
}

export function loadStudents(): Student[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If older seed was present with less than 34 students (e.g. initial 20),
        // upgrade to the requested 16 boys + 18 girls roster:
        const boyCount = parsed.filter((s: Student) => s.gender === 'boy').length;
        const girlCount = parsed.filter((s: Student) => s.gender === 'girl').length;
        if (parsed.length < 34 || (boyCount !== 16 && parsed.length === 20)) {
          saveStudents(INITIAL_STUDENTS);
          return INITIAL_STUDENTS;
        }

        const initialMap = new Map(INITIAL_STUDENTS.map((s) => [s.id, s.category]));
        const scBoys = parsed.filter((s: Student) => s.gender === 'boy' && s.category === 'SC').length;
        const scGirls = parsed.filter((s: Student) => s.gender === 'girl' && s.category === 'SC').length;
        const stBoys = parsed.filter((s: Student) => s.gender === 'boy' && s.category === 'ST').length;
        const stGirls = parsed.filter((s: Student) => s.gender === 'girl' && s.category === 'ST').length;

        // If categories need sync to the requested 1 SC boy, 1 SC girl, 2 ST boys, 1 ST girl distribution:
        const needsCategorySync = scBoys !== 1 || scGirls !== 1 || stBoys !== 2 || stGirls !== 1;

        const migrated = parsed.map((s: Student) => {
          if (!s.category || (needsCategorySync && initialMap.has(s.id))) {
            return {
              ...s,
              category: initialMap.get(s.id) || s.category || 'OBC',
            };
          }
          return s;
        });
        saveStudents(migrated);
        return migrated;
      }
    }
  } catch (e) {
    console.error('Error loading students from localStorage', e);
  }
  saveStudents(INITIAL_STUDENTS);
  return INITIAL_STUDENTS;
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students', e);
  }
}

export function loadAttendanceRecords(students: Student[]): Record<string, DayAttendance> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading attendance', e);
  }

  const seeded = generateSeedAttendance(students);
  saveAttendanceRecords(seeded);
  return seeded;
}

export function saveAttendanceRecords(records: Record<string, DayAttendance>) {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving attendance', e);
  }
}

export function loadSchoolProfile(): SchoolProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old default location to Halol, Panchmahal and DISE code 24170309204
      if (
        parsed.taluka === 'હિંમતનગર' ||
        parsed.district === 'સાબરકાંઠા' ||
        parsed.diseCode === '24070601201' ||
        parsed.diseCode === '24180402801'
      ) {
        parsed.taluka = 'હાલોલ';
        parsed.district = 'પંચમહાલ';
        parsed.diseCode = '24170309204';
        saveSchoolProfile(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading school profile', e);
  }
  saveSchoolProfile(DEFAULT_SCHOOL);
  return DEFAULT_SCHOOL;
}

export function saveSchoolProfile(school: SchoolProfile) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(school));
  } catch (e) {
    console.error('Error saving school profile', e);
  }
}

export function getSoundPreference(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setSoundPreference(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  } catch {
    // Ignore
  }
}
