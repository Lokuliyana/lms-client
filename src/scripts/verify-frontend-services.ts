/**
 * Frontend Service API Integration Test Harness
 * Exercises all 8 frontend API services against the backend.
 */
import API from '../lib/axios';
import { authService } from '../services/authService';
import { classService, fetchClasses, fetchClassById, createClass } from '../services/classService';
import { quizService, fetchQuizzes, createQuiz } from '../services/quizService';
import { recordingService, getRecordingsByClass, getRecordingById } from '../services/recordingService';
import { examService, fetchClassExams, createExam } from '../services/examService';
import { attendanceService, fetchSessionRoster, fetchMyAttendanceStats } from '../services/attendanceService';
import { deliveryService, fetchMyDeliveries, fetchAllDeliveries } from '../services/deliveryService';
import { storeService, fetchProducts, fetchProductById } from '../services/storeService';

let passed = 0;
let failed = 0;

function assert(description: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${description}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${description} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

async function ensureBackendReachable(): Promise<string> {
  const targetBase = process.env.API_URL || process.env.API_ORIGIN || 'http://127.0.0.1:4002/api';
  try {
    const res = await fetch(targetBase.replace('/api', '') + '/api/system/health', { method: 'GET' });
    if (res.status === 200) {
      return targetBase;
    }
  } catch {}

  // If server is not yet running on port 5000, dynamically initialize in-process from lms-server
  try {
    const path = require('path');
    const serverRoot = path.resolve(__dirname, '../../../lms-server');
    const mongoose = require(path.join(serverRoot, 'node_modules/mongoose'));
    const http = require('http');
    const { app } = require(path.join(serverRoot, 'src/app'));

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms');
    const srv = http.createServer(app);
    await new Promise<void>((resolve) => {
      srv.listen(5000, () => resolve()).on('error', () => {
        srv.listen(0, () => resolve());
      });
    });
    const addr = srv.address();
    const port = typeof addr === 'object' && addr ? addr.port : 5000;
    return `http://127.0.0.1:${port}/api`;
  } catch (err: any) {
    console.warn('Could not launch in-process fallback server:', err?.message || err);
    return targetBase;
  }
}

async function run() {
  console.log('====================================================');
  console.log('    FRONTEND SERVICES API INTEGRATION TEST HARNESS  ');
  console.log('====================================================\n');

  const resolvedBaseUrl = await ensureBackendReachable();
  API.defaults.baseURL = resolvedBaseUrl;
  console.log(`Connected to API Base URL: ${resolvedBaseUrl}\n`);

  let teacherToken = '';
  let studentToken = '';
  let createdClassId = '';
  let createdQuizId = '';
  let createdRecordingId = '';
  let createdExamId = '';
  let testProductId = '';

  // 1. authService
  console.log('--- 1. Testing authService ---');
  try {
    const teacherLoginRes = await authService.login({
      email: 'teacher@lms.com',
      password: 'password123',
    });
    teacherToken = (teacherLoginRes as any).token || (teacherLoginRes as any).data?.token;
    assert('authService: teacher login succeeds', !!teacherToken, 'Token missing');

    // Attach token to axios for subsequent authenticated requests
    API.defaults.headers.common['Authorization'] = `Bearer ${teacherToken}`;

    const profileRes = await authService.getProfile();
    const profile = profileRes.data?.user || profileRes.data?.data || profileRes.data;
    assert('authService: getProfile() resolves current user', !!profile && (profile.email === 'teacher@lms.com' || !!profile.role), JSON.stringify(profile));
  } catch (err: any) {
    assert('authService tests', false, err?.message || String(err));
  }

  // 2. classService
  console.log('\n--- 2. Testing classService ---');
  try {
    const newClassData = await createClass({
      title: 'Batch 06 Test Class',
      description: 'Testing canonical route and taxonomy resolution',
      subject: 'mathematics',
      grade: '10',
      type: 'regular',
      format: 'theory',
      fees: 2500, // tests fees -> price mapping
      delivery_type: 'both',
      batch_schedule: [{ batch_name: 'Regular Batch', day: 'Saturday', start: '09:00', end: '11:00' }], // tests batch_schedule -> batches mapping
    });
    const cls = newClassData?.data || newClassData;
    createdClassId = cls?._id || cls?.id;
    assert('classService: createClass() responds with created class', !!createdClassId, 'Class ID missing');
    assert('classService: creates class with delivery_type and price mapping', cls?.price === 2500 && cls?.delivery_type === 'both', JSON.stringify(cls));

    const allClasses = await fetchClasses();
    assert('classService: fetchClasses() returns class list', Array.isArray(allClasses) && allClasses.length > 0, `Count: ${allClasses?.length}`);

    if (createdClassId) {
      const singleClass = await fetchClassById(createdClassId);
      const single = (singleClass as any)?.data || singleClass;
      assert('classService: fetchClassById() retrieves created class', single?._id === createdClassId, 'ID mismatch');
    }
  } catch (err: any) {
    assert('classService tests', false, err?.message || String(err));
  }

  // 3. quizService
  console.log('\n--- 3. Testing quizService ---');
  try {
    // Note: passing "Chemistry" and "10" as strings tests taxonomy resolution!
    const newQuizData = await createQuiz({
      title: 'Batch 06 Chemistry Quiz',
      instructions: 'Taxonomy binding test quiz',
      class_id: createdClassId,
      subject: 'Chemistry',
      grade: '10',
      difficulty: 'Medium',
      time_limit_sec: 1200,
      question_count: 5,
    });
    const qz = (newQuizData as any)?.quiz || (newQuizData as any)?.data || newQuizData;
    createdQuizId = qz?._id || qz?.id;
    assert('quizService: createQuiz() with string subject succeeds without CastError', !!createdQuizId, 'Quiz ID missing');

    const quizzes = await fetchQuizzes();
    assert('quizService: fetchQuizzes() returns playable quiz list', Array.isArray(quizzes), 'Expected array');
  } catch (err: any) {
    assert('quizService tests', false, err?.message || String(err));
  }

  // 4. recordingService
  console.log('\n--- 4. Testing recordingService ---');
  try {
    if (createdClassId) {
      const recPayload = {
        class_id: createdClassId,
        title: 'Offline Local Media Session 1',
        driveUrl: 'http://127.0.0.1:5000/uploads/recordings/test-session.mp4',
        session_date: '2026-10-02',
        batch_name: 'Regular Batch',
      };
      const recRes = await recordingService.createRecording(recPayload);
      const recDoc = (recRes as any)?.recording || recRes;
      createdRecordingId = recDoc?._id;
      assert('recordingService: createRecording() handles direct/local media URL', !!createdRecordingId, 'Recording ID missing');

      const classRecs = await getRecordingsByClass(createdClassId);
      assert('recordingService: getRecordingsByClass() retrieves class recordings', Array.isArray(classRecs) && classRecs.length > 0, `Count: ${classRecs?.length}`);

      if (createdRecordingId) {
        const singleRec = await getRecordingById(createdRecordingId);
        assert('recordingService: getRecordingById() returns populated recording', !!singleRec && singleRec._id === createdRecordingId, 'Recording missing or mismatch');
      }
    } else {
      assert('recordingService: class recordings', false, 'Skipped due to missing createdClassId');
    }
  } catch (err: any) {
    assert('recordingService tests', false, err?.message || String(err));
  }

  // 5. examService
  console.log('\n--- 5. Testing examService ---');
  try {
    if (createdClassId) {
      const examRes = await createExam({
        title: 'Mid-Term Paper Exam',
        class_id: createdClassId,
        exam_type: 'paper',
        total_marks: 100,
        pass_marks: 40,
        held_date: '2026-10-02',
        is_published: true,
      });
      const ex = examRes?.data || examRes;
      createdExamId = ex?._id;
      assert('examService: createExam() creates paper exam', !!createdExamId, 'Exam ID missing');

      const classExams = await fetchClassExams(createdClassId);
      const examList = Array.isArray(classExams) ? classExams : (classExams as any)?.data || [];
      assert('examService: fetchClassExams() lists class exams', Array.isArray(examList) && examList.length > 0, `Count: ${examList?.length}`);
    }
  } catch (err: any) {
    assert('examService tests', false, err?.message || String(err));
  }

  // 6. attendanceService
  console.log('\n--- 6. Testing attendanceService ---');
  try {
    if (createdClassId) {
      const rosterRes = await fetchSessionRoster(createdClassId, '2026-10-02');
      assert('attendanceService: fetchSessionRoster() responds for class', !!rosterRes, 'No response');

      const myStats = await fetchMyAttendanceStats();
      assert('attendanceService: fetchMyAttendanceStats() returns attendance records', !!myStats, 'No stats');
    }
  } catch (err: any) {
    assert('attendanceService tests', false, err?.message || String(err));
  }

  // 7. deliveryService
  console.log('\n--- 7. Testing deliveryService ---');
  try {
    const allDeliveries = await fetchAllDeliveries();
    assert('deliveryService: fetchAllDeliveries() returns deliveries list', !!allDeliveries, 'No response');

    const myDeliveries = await fetchMyDeliveries();
    assert('deliveryService: fetchMyDeliveries() returns user delivery orders', !!myDeliveries, 'No response');
  } catch (err: any) {
    assert('deliveryService tests', false, err?.message || String(err));
  }

  // 8. storeService
  console.log('\n--- 8. Testing storeService ---');
  try {
    const productsRes = await fetchProducts();
    const products = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];
    assert('storeService: fetchProducts() retrieves product list', Array.isArray(products), 'Expected array');

    if (products.length > 0) {
      testProductId = products[0]._id;
    } else {
      const createdProd = await storeService.createProduct({
        title: 'Science Revision Tute Pack',
        description: 'Comprehensive term 3 revision pack',
        price: 1200,
        category: 'tute',
        inventory_count: 50,
        thumbnail_url: 'http://localhost:5000/uploads/products/pack.jpg',
        is_active: true,
      });
      testProductId = (createdProd as any)?.data?._id || (createdProd as any)?._id;
    }

    if (testProductId) {
      const productDetail = await fetchProductById(testProductId);
      const p = (productDetail as any)?.data || productDetail;
      assert('storeService: fetchProductById() returns product details', p?._id === testProductId, 'ID mismatch');
    }
  } catch (err: any) {
    assert('storeService tests', false, err?.message || String(err));
  }

  console.log('\n====================================================');
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('Test harness failed uncaught:', e);
  process.exit(1);
});
