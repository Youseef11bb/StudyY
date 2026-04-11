import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yousef.study',
  appName: 'Study +',
  webDir: 'dist',
  server: {
    // السطر ده مهم جداً عشان يخلي التطبيق يتعامل مع الملفات (زي الصوت) بشكل آمن
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      // إعدادات اختيارية للإشعارات
      smallIcon: "ic_stat_icon_config_sample", 
      iconColor: "#488AFF",
    },
  },
};

export default config;