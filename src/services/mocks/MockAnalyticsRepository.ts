export const getAnalytics = async () => {
  return [
    { studentId: 'student-A', attendance: 85, homework: 90, consistency: 85, accuracy: 88, speed: 75, atRisk: false },
    { studentId: 'student-B', attendance: 50, homework: 40, consistency: 45, accuracy: 50, speed: 60, atRisk: true } // Below 60%
  ];
};
