/**
 * دالة لتحديد فترة اليوم بناءً على الساعة المحلية للمستخدم
 * @returns {string} 'fajr' | 'morning' | 'day' | 'sunset' | 'night'
 */
function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 6) return 'fajr';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'sunset';
  return 'night'; // 19 to 4
}

/**
 * دالة لإرجاع التحية المناسبة حسب فترة اليوم
 * @returns {string} نص التحية
 */
function getGreeting() {
  const period = getTimePeriod();
  const greetings = {
    fajr: 'صباح النور 🌙',
    morning: 'صباح الخير ☀️',
    day: 'مرحباً 🌤️',
    sunset: 'مساء الجمال 🌇',
    night: 'مساء الخير ✨'
  };
  return greetings[period];
}

/**
 * دالة لإرجاع إعدادات الخلفية والألوان حسب فترة اليوم
 * @returns {object} يحتوي على فئات Tailwind CSS المناسبة
 */
function getBackgroundConfig() {
  const period = getTimePeriod();
  const configs = {
    fajr: 'bg-gradient-to-b from-navy-900 to-navy-700',
    morning: 'bg-gradient-to-b from-sky-400 to-sky-200',
    day: 'bg-gradient-to-b from-blue-300 to-blue-100',
    sunset: 'bg-gradient-to-b from-orange-400 via-pink-400 to-purple-500',
    night: 'bg-navy-900'
  };
  return configs[period];
}

module.exports = { getTimePeriod, getGreeting, getBackgroundConfig };
