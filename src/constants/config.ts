export const Config = {
  USE_MOCK: true,
  API_BASE_URL: 'https://api.silcharmunicipal.gov.in/safai',
  MOCK_DELAY_MIN: 300,
  MOCK_DELAY_MAX: 800,

  SILCHAR_BASE_COORDS: {
    latitude: 24.8333,
    longitude: 92.7789,
    accuracy: 15,
  },

  STORAGE_KEYS: {
    AUTH_USER: '@safai_auth_user',
    REGISTERED_USERS: '@safai_registered_users',
    ATTENDANCE_RECORDS: '@safai_attendance_records',
    WORK_PHOTOS: '@safai_work_photos',
  },
};
