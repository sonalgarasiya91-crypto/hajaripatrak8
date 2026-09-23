import * as XLSX from 'xlsx';
import { Student, DayAttendance, SchoolProfile, StudentCategory } from '../types';

export function exportDailyAttendanceToExcel(
  date: string,
  students: Student[],
  dayRecord: DayAttendance | undefined,
  school: SchoolProfile
) {
  const records = dayRecord?.records || {};
  
  // Calculate overall stats
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  // Category wise stats
  const categoryStats: Record<StudentCategory, { total: number; present: number; absent: number; leave: number }> = {
    OBC: { total: 0, present: 0, absent: 0, leave: 0 },
    ST: { total: 0, present: 0, absent: 0, leave: 0 },
    SC: { total: 0, present: 0, absent: 0, leave: 0 },
    GEN: { total: 0, present: 0, absent: 0, leave: 0 },
  };

  students.forEach((s) => {
    const st = records[s.id] || 'present';
    const cat = s.category || 'OBC';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, present: 0, absent: 0, leave: 0 };
    }
    categoryStats[cat].total++;

    if (st === 'present') {
      presentCount++;
      categoryStats[cat].present++;
    } else if (st === 'absent') {
      absentCount++;
      categoryStats[cat].absent++;
    } else if (st === 'leave') {
      leaveCount++;
      categoryStats[cat].leave++;
    }
  });

  const total = students.length;
  const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0';

  // Format Date for display (DD/MM/YYYY)
  const [year, month, day] = date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  // Rows for Excel
  const excelData = [
    ['શાળાનું નામ:', school.schoolName, '', 'તારીખ:', formattedDate],
    ['ધોરણ / વર્ગ:', `${school.standard} - ${school.division}`, '', 'ડાયસ કોડ:', school.diseCode],
    ['તાલુકો / જિલ્લો:', `${school.taluka} / ${school.district}`, '', 'વર્ગ શિક્ષક:', school.teacherName],
    ['શૈક્ષણિક વર્ષ:', school.academicYear, '', 'નોંધણી:', `${total} વિદ્યાર્થીઓ`],
    ['', '', '', '', ''],
    ['--- દૈનિક હાજરી સારાંશ ---', '', '', '', ''],
    ['કુલ વિદ્યાર્થી:', total, 'હાજર:', presentCount, 'ગેરહાજર:', absentCount, 'રજા:', leaveCount, 'હાજરી %:', `${attendanceRate}%`],
    ['', '', '', '', ''],
    ['--- જાતિવાર (કેટેગરીવાર) હાજરી સારાંશ ---', '', '', '', ''],
    ['જાતિ / કેટેગરી', 'કુલ વિદ્યાર્થી', 'હાજર', 'ગેરહાજર', 'રજા', 'હાજરી ટકાવારી (%)'],
    [
      'ઓબીસી (OBC / સા.શૈ.પ.વ.)',
      categoryStats.OBC.total,
      categoryStats.OBC.present,
      categoryStats.OBC.absent,
      categoryStats.OBC.leave,
      categoryStats.OBC.total > 0 ? `${((categoryStats.OBC.present / categoryStats.OBC.total) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'એસ.ટી. (ST / અનુ. જનજાતિ)',
      categoryStats.ST.total,
      categoryStats.ST.present,
      categoryStats.ST.absent,
      categoryStats.ST.leave,
      categoryStats.ST.total > 0 ? `${((categoryStats.ST.present / categoryStats.ST.total) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'એસ.સી. (SC / અનુ. જાતિ)',
      categoryStats.SC.total,
      categoryStats.SC.present,
      categoryStats.SC.absent,
      categoryStats.SC.leave,
      categoryStats.SC.total > 0 ? `${((categoryStats.SC.present / categoryStats.SC.total) * 100).toFixed(1)}%` : '0%'
    ],
    [
      'જનરલ (GEN / સામાન્ય)',
      categoryStats.GEN.total,
      categoryStats.GEN.present,
      categoryStats.GEN.absent,
      categoryStats.GEN.leave,
      categoryStats.GEN.total > 0 ? `${((categoryStats.GEN.present / categoryStats.GEN.total) * 100).toFixed(1)}%` : '0%'
    ],
    ['', '', '', '', ''],
    [
      'રોલ નં.',
      'જી.આર. નં.',
      'વિદ્યાર્થીનું નામ (ગુજરાતી)',
      'Student Name (English)',
      'જાતિ (કુમાર/કન્યા)',
      'કેટેગરી (જાતિવાર)',
      'હાજરી સ્થિતિ',
      'મોબાઈલ નંબર',
      'શેરો / નોંધ'
    ]
  ];

  students.forEach((student) => {
    const status = records[student.id] || 'present';
    let statusGu = 'હાજર';
    if (status === 'absent') statusGu = 'ગેરહાજર';
    else if (status === 'leave') statusGu = 'રજા';

    const catGu = student.category === 'OBC'
      ? 'OBC (ઓબીસી)'
      : student.category === 'ST'
      ? 'ST (એસ.ટી.)'
      : student.category === 'SC'
      ? 'SC (એસ.સી.)'
      : 'GEN (જનરલ)';

    excelData.push([
      student.rollNo as unknown as string,
      student.grNo,
      student.nameGu,
      student.nameEn,
      student.gender === 'boy' ? 'કુમાર' : 'કન્યા',
      catGu,
      statusGu,
      student.contactNo || '',
      ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Column widths
  ws['!cols'] = [
    { wch: 10 }, // Roll No
    { wch: 12 }, // GR No
    { wch: 32 }, // Name Gu
    { wch: 28 }, // Name En
    { wch: 16 }, // Gender
    { wch: 16 }, // Category
    { wch: 16 }, // Status
    { wch: 16 }, // Mobile
    { wch: 20 }, // Remarks
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `દૈનિક_${day}-${month}-${year}`);

  // Download trigger
  const fileName = `હાજરી_પત્રક_સાથરોટા_ધોરણ_૮_${day}_${month}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportMonthlyAttendanceToExcel(
  year: number,
  month: number, // 1 - 12
  students: Student[],
  allRecords: Record<string, DayAttendance>,
  school: SchoolProfile
) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNamesGu = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'
  ];
  const monthName = monthNamesGu[month - 1];

  // Prepare Matrix Header
  const headerRow1 = [
    'રોલ નં.',
    'જી.આર. નં.',
    'વિદ્યાર્થીનું નામ',
    'જાતિ',
    'કેટેગરી',
  ];

  for (let d = 1; d <= daysInMonth; d++) {
    headerRow1.push(`${d}`);
  }
  headerRow1.push('કુલ હાજર', 'કુલ ગેરહાજર', 'કુલ રજા', 'હાજરી %');

  // Days of week row
  const dayNamesGu = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
  const headerRow2 = ['', '', 'વાર:', '', ''];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    headerRow2.push(dayNamesGu[dayOfWeek]);
  }
  headerRow2.push('', '', '', '');

  const rows: (string | number)[][] = [
    [`સાથરોટા પ્રાથમિક શાળા - માસિક હાજરી પત્રક`],
    [`ધોરણ: ૮ | માસ: ${monthName} ${year} | ડાયસ કોડ: ${school.diseCode} | તાલુકો: ${school.taluka} | જિલ્લો: ${school.district} | વર્ગ શિક્ષક: ${school.teacherName}`],
    [],
    headerRow1,
    headerRow2,
  ];

  // Student summary metrics
  const studentMetrics: {
    student: Student;
    present: number;
    absent: number;
    leave: number;
    workingDays: number;
    pct: number;
  }[] = [];

  students.forEach((student) => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let workingDays = 0;

    const row: (string | number)[] = [
      student.rollNo,
      student.grNo,
      student.nameGu,
      student.gender === 'boy' ? 'કુમાર' : 'કન્યા',
      student.category,
    ];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(month).padStart(2, '0');
      const dateKey = `${year}-${mStr}-${dStr}`;
      const dayOfWeek = new Date(year, month - 1, d).getDay();

      if (dayOfWeek === 0) {
        // Sunday
        row.push('રવિ');
      } else {
        workingDays++;
        const dayRecord = allRecords[dateKey];
        if (dayRecord) {
          const st = dayRecord.records[student.id] || 'present';
          if (st === 'present') {
            present++;
            row.push('P');
          } else if (st === 'absent') {
            absent++;
            row.push('A');
          } else {
            leave++;
            row.push('L');
          }
        } else {
          row.push('-');
        }
      }
    }

    const pct = workingDays > 0 ? Number(((present / workingDays) * 100).toFixed(1)) : 0;
    row.push(present, absent, leave, `${pct}%`);
    rows.push(row);

    studentMetrics.push({
      student,
      present,
      absent,
      leave,
      workingDays,
      pct,
    });
  });

  // Daily totals row
  const totalEnrolled = students.length;
  const presentTotalRow: (string | number)[] = ['કુલ', '', 'દૈનિક હાજર વિદ્યાર્થી', '', ''];
  const absentTotalRow: (string | number)[] = ['', '', 'દૈનિક ગેરહાજર વિદ્યાર્થી', '', ''];
  const pctTotalRow: (string | number)[] = ['', '', 'દૈનિક હાજરી ટકાવારી (%)', '', ''];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    const dateKey = `${year}-${mStr}-${dStr}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();

    if (dayOfWeek === 0) {
      presentTotalRow.push('-');
      absentTotalRow.push('-');
      pctTotalRow.push('-');
    } else {
      const dayRecord = allRecords[dateKey];
      if (dayRecord) {
        let pCount = 0;
        let aCount = 0;
        students.forEach((st) => {
          const s = dayRecord.records[st.id] || 'present';
          if (s === 'present') pCount++;
          else if (s === 'absent') aCount++;
        });
        presentTotalRow.push(pCount);
        absentTotalRow.push(aCount);
        const dailyPct = totalEnrolled > 0 ? ((pCount / totalEnrolled) * 100).toFixed(1) : '0';
        pctTotalRow.push(`${dailyPct}%`);
      } else {
        presentTotalRow.push('-');
        absentTotalRow.push('-');
        pctTotalRow.push('-');
      }
    }
  }

  presentTotalRow.push('', '', '', '');
  absentTotalRow.push('', '', '', '');
  pctTotalRow.push('', '', '', '');

  rows.push([]);
  rows.push(presentTotalRow);
  rows.push(absentTotalRow);
  rows.push(pctTotalRow);

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(rows);

  // Column width formatting
  const colWidths = [
    { wch: 8 },  // Roll No
    { wch: 10 }, // GR No
    { wch: 28 }, // Name
    { wch: 8 },  // Gender
    { wch: 8 },  // Category
  ];
  for (let d = 1; d <= daysInMonth; d++) {
    colWidths.push({ wch: 4.5 });
  }
  colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 9 }, { wch: 10 });
  ws1['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws1, `${monthName}_${year}_પત્રક`);

  // Sheet 2: Category Breakdown and Student Summary
  const categorySummary: Record<StudentCategory, { count: number; presentTotal: number; workingDaysTotal: number }> = {
    OBC: { count: 0, presentTotal: 0, workingDaysTotal: 0 },
    ST: { count: 0, presentTotal: 0, workingDaysTotal: 0 },
    SC: { count: 0, presentTotal: 0, workingDaysTotal: 0 },
    GEN: { count: 0, presentTotal: 0, workingDaysTotal: 0 },
  };

  studentMetrics.forEach((m) => {
    const cat = m.student.category || 'OBC';
    if (!categorySummary[cat]) {
      categorySummary[cat] = { count: 0, presentTotal: 0, workingDaysTotal: 0 };
    }
    categorySummary[cat].count++;
    categorySummary[cat].presentTotal += m.present;
    categorySummary[cat].workingDaysTotal += m.workingDays;
  });

  const summaryRows: (string | number)[][] = [
    [`સાથરોટા પ્રાથમિક શાળા - ધોરણ ૮ જાતિવાર (કેટેગરી) માસિક હાજરી સારાંશ`],
    [`માસ: ${monthName} ${year}`],
    [],
    ['જાતિ / કેટેગરી', 'કુલ વિદ્યાર્થી', 'સરેરાશ હાજરી ટકાવારી (%)'],
    [
      'ઓબીસી (OBC)',
      categorySummary.OBC.count,
      categorySummary.OBC.workingDaysTotal > 0
        ? `${((categorySummary.OBC.presentTotal / categorySummary.OBC.workingDaysTotal) * 100).toFixed(1)}%`
        : '0%'
    ],
    [
      'એસ.ટી. (ST)',
      categorySummary.ST.count,
      categorySummary.ST.workingDaysTotal > 0
        ? `${((categorySummary.ST.presentTotal / categorySummary.ST.workingDaysTotal) * 100).toFixed(1)}%`
        : '0%'
    ],
    [
      'એસ.સી. (SC)',
      categorySummary.SC.count,
      categorySummary.SC.workingDaysTotal > 0
        ? `${((categorySummary.SC.presentTotal / categorySummary.SC.workingDaysTotal) * 100).toFixed(1)}%`
        : '0%'
    ],
    [
      'જનરલ (GEN)',
      categorySummary.GEN.count,
      categorySummary.GEN.workingDaysTotal > 0
        ? `${((categorySummary.GEN.presentTotal / categorySummary.GEN.workingDaysTotal) * 100).toFixed(1)}%`
        : '0%'
    ],
    [],
    ['--- વિદ્યાર્થીવાર વિગત ---'],
    ['રોલ નં.', 'જી.આર. નં.', 'વિદ્યાર્થીનું નામ', 'જાતિ', 'કેટેગરી', 'હાજર દિવસ', 'ગેરહાજર દિવસ', 'રજા', 'હાજરી %', 'સ્થિતિ વર્ગીકરણ']
  ];

  studentMetrics.forEach((m) => {
    let category = 'નિયમિત (Regular)';
    if (m.pct >= 90) category = 'ઉત્તમ (Excellent >90%)';
    else if (m.pct < 75) category = 'ધ્યાન આપવા જેવી (Low <75%)';

    summaryRows.push([
      m.student.rollNo,
      m.student.grNo,
      m.student.nameGu,
      m.student.gender === 'boy' ? 'કુમાર' : 'કન્યા',
      m.student.category,
      m.present,
      m.absent,
      m.leave,
      `${m.pct}%`,
      category
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 12 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'જાતિવાર_અને_વિદ્યાર્થી_સારાંશ');

  const fileName = `માસિક_હાજરી_સાથરોટા_ધોરણ_૮_${monthName}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
