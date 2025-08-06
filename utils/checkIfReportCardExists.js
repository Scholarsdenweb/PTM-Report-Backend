// utils/checkIfReportCardExists.js

import ReportCard from '../models/ReportCard.js';
import Student from '../models/Student.js';
import dayjs from 'dayjs';

export async function checkIfReportCardExists(rollNo, ptmDate) {
  const student = await Student.findOne({ rollNo });

  if (!student) {
    return { exists: false, reason: 'Student not found' };
  }

  const startOfDay = dayjs(ptmDate).startOf('day').toDate();
  const endOfDay = dayjs(ptmDate).endOf('day').toDate();

  const reportExists = await ReportCard.findOne({
    student: student._id,
    reportDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (reportExists) {
    return { exists: true, report: reportExists };
  }

  return { exists: false };
}
