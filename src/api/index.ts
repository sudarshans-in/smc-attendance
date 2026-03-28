import { Config } from '../constants/config';
import * as mockApi from '../mock/mockApi';

// To switch to the real backend, set USE_MOCK = false in src/constants/config.ts
// and implement the functions below pointing to Config.API_BASE_URL
const realApi = {
  loginUser: mockApi.loginUser,
  signupUser: mockApi.signupUser,
  markAttendanceLogin: mockApi.markAttendanceLogin,
  markAttendanceLogout: mockApi.markAttendanceLogout,
  getTodayAttendance: mockApi.getTodayAttendance,
  getAttendanceHistory: mockApi.getAttendanceHistory,
  uploadWorkPhoto: mockApi.uploadWorkPhoto,
  getTodayPhotos: mockApi.getTodayPhotos,
  getAllWorkers: mockApi.getAllWorkers,
  getTodayAllAttendance: mockApi.getTodayAllAttendance,
};

export const api = Config.USE_MOCK ? mockApi : realApi;
