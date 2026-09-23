export type AttendanceStatus = 'present' | 'absent' | 'leave';

export type StudentCategory = 'OBC' | 'ST' | 'SC' | 'GEN';

export interface Student {
  id: string;
  rollNo: number;
  grNo: string;
  nameGu: string;
  nameEn: string;
  gender: 'boy' | 'girl'; // કુમાર / કન્યા
  category: StudentCategory; // ઓબીસી / ST / SC / GEN
  photo: string;
  contactNo?: string;
}

export interface DayAttendance {
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  note?: string;
  updatedAt: string;
}

export interface SchoolProfile {
  schoolName: string;
  schoolNameEn: string;
  standard: string;
  division: string;
  diseCode: string;
  cluster: string;
  taluka: string;
  district: string;
  teacherName: string;
  academicYear: string;
}
