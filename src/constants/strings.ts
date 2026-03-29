export const Strings = {
  appName: 'SMC Karmachari',
  appSubtitle: 'Silchar Municipal Corporation',

  // Auth
  loginButton: 'LOGIN',
  mobileInvalid: 'Please enter a valid 10-digit mobile number.',
  nameLabel: 'Full Name',
  namePlaceholder: 'Enter your full name',
  addressLabel: 'Address',
  addressPlaceholder: 'Enter your home address',
  registerButton: 'REGISTER',
  alreadyRegistered: 'Already registered? Login',

  // Home
  attendanceStatus: 'Attendance Status',
  markAttendance: 'MARK ATTENDANCE',
  markLogout: 'MARK LOGOUT',
  attendanceLoginDone: 'Check-in recorded',
  attendanceLogoutDone: 'Check-out recorded',
  attendanceComplete: 'Attendance Complete',
  loginTime: 'Check-in Time',
  logoutTime: 'Check-out Time',
  fetchingLocation: 'Getting your location...',
  checkinPhotoRequired: 'A photo is required to mark attendance.',
  locationError: 'Location access is required to mark attendance. Please allow location permission in Settings.',
  uploadPhotoShortcut: 'UPLOAD WORK PHOTO',
  photosTodayCount: (n: number) => `${n} photo${n !== 1 ? 's' : ''} uploaded today`,
  logoutConfirmTitle: 'Logout',
  logoutConfirmMessage: 'Are you sure you want to logout?',
  cancel: 'Cancel',
  confirm: 'Logout',

  // Upload
  uploadTitle: 'Upload Work Photo',
  takePhoto: 'CAMERA',
  noPhotoSelected: 'No photo selected',
  notesLabel: 'Work Description (Optional)',
  notesPlaceholder: 'Describe the work done...',
  locationReady: 'Location ready',
  locationFetching: 'Fetching location...',
  locationFailed: 'Location unavailable',
  submitPhoto: 'SUBMIT PHOTO',
  uploadSuccess: 'Photo uploaded successfully!',
  uploadError: 'Failed to upload photo. Please try again.',
  uploadHint: 'Take a photo, then tap Submit',
  locationRequiredHint: 'Location required. Please allow GPS and try again.',

  // History
  historyTitle: 'History',
  tabTodayPhotos: "Today's Photos",
  tabAttendance: 'Attendance Records',
  noPhotosToday: 'No photos uploaded today',
  noAttendanceRecords: 'No attendance records found',

  // Admin
  adminTitle: 'Admin',
  allWorkers: 'All Workers',
  todayAttendance: "Today's Attendance",
  present: 'Present',
  absent: 'Absent',
  noWorkers: 'No workers registered yet',

  // Common
  loading: 'Loading...',
  retry: 'Retry',
  pullToRefresh: 'Pull down to refresh',
  errorGeneric: 'Something went wrong. Please try again.',
};
