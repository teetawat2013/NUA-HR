import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Employee, AttendanceRecord, ReportHistoryItem, LatePermissionRequest, JobApplication, JobApplicationSettings } from './types';

// Initialize Firebase App and Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test Connection on initial boot as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Required Error Handling as specified in Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Authentication
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Save user profile to Firestore
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      try {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          createdAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
      }
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Clean data helper to prevent undefined values in Firestore documents
export function cleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Subscribe to User's Employees collection
export function subscribeEmployees(
  userId: string,
  onData: (employees: Employee[]) => void,
  onError?: (err: Error) => void
) {
  const collPath = `users/${userId}/employees`;
  const q = query(collection(db, collPath));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Employee);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Subscribe to User's Attendance Records collection
export function subscribeAttendanceRecords(
  userId: string,
  onData: (records: AttendanceRecord[]) => void,
  onError?: (err: Error) => void
) {
  const collPath = `users/${userId}/attendance_records`;
  const q = query(collection(db, collPath));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: AttendanceRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as AttendanceRecord);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Save or Update an Employee
export async function saveEmployeeToFirestore(userId: string, employee: Employee): Promise<void> {
  const path = `users/${userId}/employees/${employee.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...employee,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'employees', employee.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete an Employee
export async function deleteEmployeeFromFirestore(userId: string, employeeId: string): Promise<void> {
  const path = `users/${userId}/employees/${employeeId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'employees', employeeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save Attendance Record
export async function saveAttendanceRecordToFirestore(userId: string, record: AttendanceRecord): Promise<void> {
  const path = `users/${userId}/attendance_records/${record.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...record,
      userId,
      createdAt: record.recordedAt || new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'attendance_records', record.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Subscribe to User's Report History collection
export function subscribeReportHistory(
  userId: string,
  onData: (history: ReportHistoryItem[]) => void,
  onError?: (err: Error) => void
) {
  const collPath = `users/${userId}/report_history`;
  const q = query(collection(db, collPath));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ReportHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ReportHistoryItem);
      });
      list.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Save Report History Item
export async function saveReportHistoryToFirestore(userId: string, item: ReportHistoryItem): Promise<void> {
  const path = `users/${userId}/report_history/${item.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...item,
      userId,
    });
    await setDoc(doc(db, 'users', userId, 'report_history', item.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Report History Item
export async function deleteReportHistoryFromFirestore(userId: string, reportId: string): Promise<void> {
  const path = `users/${userId}/report_history/${reportId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'report_history', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Subscribe to Late Permission Requests
export function subscribeLateRequests(
  userId: string,
  onData: (requests: LatePermissionRequest[]) => void,
  onError?: (error: Error) => void
) {
  const collPath = `users/${userId}/late_requests`;
  const q = query(collection(db, 'users', userId, 'late_requests'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: LatePermissionRequest[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as LatePermissionRequest);
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collPath);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}

// Save Late Permission Request
export async function saveLateRequestToFirestore(userId: string, req: LatePermissionRequest): Promise<void> {
  const path = `users/${userId}/late_requests/${req.id}`;
  try {
    const cleaned = cleanForFirestore({
      ...req,
      userId,
    });
    await setDoc(doc(db, 'users', userId, 'late_requests', req.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Late Permission Request
export async function deleteLateRequestFromFirestore(userId: string, reqId: string): Promise<void> {
  const path = `users/${userId}/late_requests/${reqId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'late_requests', reqId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Purge all demo records from Firestore collections for the user
export async function purgeAllDemoDataFromFirestore(userId: string): Promise<void> {
  const demoEmpIds = ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'];
  const demoAttIds = ['ATT-001', 'ATT-002', 'ATT-003', 'ATT-004', 'ATT-005', 'ATT-006', 'ATT-007', 'ATT-008'];
  const demoRptIds = ['RPT-2026-08'];

  for (const empId of demoEmpIds) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'employees', empId));
    } catch {
      // Ignore not found
    }
  }

  for (const attId of demoAttIds) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'attendance_records', attId));
    } catch {
      // Ignore not found
    }
  }

  for (const rptId of demoRptIds) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'report_history', rptId));
    } catch {
      // Ignore not found
    }
  }
}

// Clear all records from Firestore collections for the user
export async function clearAllUserDataFromFirestore(userId: string): Promise<void> {
  try {
    const empSnap = await getDocs(collection(db, 'users', userId, 'employees'));
    for (const d of empSnap.docs) {
      await deleteDoc(d.ref);
    }
    const attSnap = await getDocs(collection(db, 'users', userId, 'attendance_records'));
    for (const d of attSnap.docs) {
      await deleteDoc(d.ref);
    }
    const rptSnap = await getDocs(collection(db, 'users', userId, 'report_history'));
    for (const d of rptSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    console.error('Error clearing all user data from Firestore:', error);
  }
}

// Seed function - disabled to prevent unwanted demo data
export async function seedUserDataIfEmpty(
  _userId: string,
  _initialEmployees: Employee[],
  _initialRecords: AttendanceRecord[],
  _initialReports?: ReportHistoryItem[]
): Promise<void> {
  // Demo seeding disabled. The system runs cleanly with 0 demo data.
  return;
}

// ==========================================
// Job Applications & Recruitment Settings
// ==========================================

export async function submitJobApplicationToFirestore(application: JobApplication): Promise<void> {
  try {
    const docRef = doc(db, 'job_applications', application.id);
    const cleaned = cleanForFirestore(application);
    await setDoc(docRef, cleaned);
  } catch (error) {
    console.error('Failed to submit job application to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, `job_applications/${application.id}`);
  }
}

export function subscribeJobApplications(
  onData: (apps: JobApplication[]) => void,
  onError?: (err: Error) => void
) {
  const collPath = 'job_applications';
  const q = query(collection(db, collPath));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: JobApplication[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as JobApplication);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      onData(list);
    },
    (error) => {
      console.error('Firestore job applications subscription error:', error);
      if (onError) onError(error);
    }
  );
}

export async function updateJobApplicationInFirestore(application: JobApplication): Promise<void> {
  try {
    const docRef = doc(db, 'job_applications', application.id);
    const cleaned = cleanForFirestore(application);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to update job application in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `job_applications/${application.id}`);
  }
}

export async function deleteJobApplicationFromFirestore(appId: string): Promise<void> {
  try {
    const docRef = doc(db, 'job_applications', appId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to delete job application from Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `job_applications/${appId}`);
  }
}

export async function saveJobSettingsToFirestore(settings: JobApplicationSettings): Promise<void> {
  try {
    const docRef = doc(db, 'job_settings', 'company_default');
    const cleaned = cleanForFirestore({
      ...settings,
      lastUpdated: new Date().toISOString()
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    console.error('Failed to save job settings to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, 'job_settings/company_default');
  }
}

export function subscribeJobSettings(
  onData: (settings: JobApplicationSettings) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, 'job_settings', 'company_default');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as JobApplicationSettings);
      }
    },
    (error) => {
      console.warn('Firestore job settings subscription notice:', error);
      if (onError) onError(error);
    }
  );
}

