const getAcademicSession = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;

  return `${startYear}-${String(endYear).slice(-2)}`;
};

const sessionExpression = (dateField = "$reportDate", sessionField = "$session") => ({
  $ifNull: [
    sessionField,
    {
      $let: {
        vars: {
          year: { $year: dateField },
          month: { $month: dateField },
        },
        in: {
          $let: {
            vars: {
              startYear: {
                $cond: [
                  { $gte: ["$$month", 4] },
                  "$$year",
                  { $subtract: ["$$year", 1] },
                ],
              },
            },
            in: {
              $concat: [
                { $toString: "$$startYear" },
                "-",
                {
                  $substrCP: [
                    { $toString: { $add: ["$$startYear", 1] } },
                    2,
                    2,
                  ],
                },
              ],
            },
          },
        },
      },
    },
  ],
});

module.exports = {
  getAcademicSession,
  sessionExpression,
};
