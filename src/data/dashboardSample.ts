export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  accent: string;
  trend?: string;
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: 'Total students', value: '248', detail: 'Across 14 active classes', accent: 'metric-blue', trend: '+12 this term' },
  { label: 'Attendance rate', value: '94.8%', detail: 'Average this academic year', accent: 'metric-green', trend: '+2.4% vs last month' },
  { label: 'Fees collected', value: 'GH₵ 84,620', detail: 'Of GH₵ 112,400 expected', accent: 'metric-amber', trend: '75.3% collected' },
  { label: 'Staff members', value: '32', detail: '28 teaching · 4 admin', accent: 'metric-coral' },
];

export const attendanceData = [
  { day: 'Mon', value: 96 },
  { day: 'Tue', value: 91 },
  { day: 'Wed', value: 94 },
  { day: 'Thu', value: 98 },
  { day: 'Fri', value: 95 },
];

export const recentActivities = [
  { title: 'New student admitted', detail: 'Amara Mensah · Primary 4', time: '12 min ago', type: 'student' },
  { title: 'Term fees payment recorded', detail: 'Kwame Boateng · GH₵ 1,250', time: '48 min ago', type: 'finance' },
  { title: 'Assessment results published', detail: 'JHS 2 · Mathematics', time: '2 hrs ago', type: 'result' },
];
