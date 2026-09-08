import https from 'https';

const BASE = 'https://api-4hjf.onrender.com';

let T_TOKEN = '';
let S_TOKEN = '';

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers, hostname: url.hostname, path: url.pathname + url.search, timeout: 30000 };
    
    const startTime = Date.now();
    const r = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const ms = Date.now() - startTime;
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, body: json || data, ms });
      });
    });
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, body: 'TIMEOUT', ms: 30000 }); });
    r.on('error', (e) => resolve({ status: 0, body: e.message, ms: 0 }));
    if (body) r.write(typeof body === 'string' ? body : JSON.stringify(body));
    r.end();
  });
}

function test(num, method, path, desc, auth, body, expectStatus) {
  const token = auth === 't' ? T_TOKEN : auth === 's' ? S_TOKEN : '';
  return req(method, path, body, token).then(r => {
    const ok = r.status >= 200 && r.status < 300;
    const expected = expectStatus ? `${expectStatus}` : '2xx';
    let status = ok ? '✅' : '❌';
    if (expectStatus && r.status === expectStatus) status = '✅';
    else if (expectStatus && r.status !== expectStatus) status = '⚠️';
    
    const methodStr = method.padEnd(7);
    const numStr = String(num).padStart(2);
    console.log(`  ${numStr}. ${status} ${methodStr} ${path.padEnd(55)} → ${r.status} (${r.ms}ms)`);
    if (!ok && typeof r.body === 'object') {
      const detail = JSON.stringify(r.body).substring(0, 200);
      console.log(`      ${detail}`);
    } else if (!ok && typeof r.body === 'string') {
      console.log(`      ${r.body.substring(0, 200)}`);
    }
    return r;
  });
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('  🔍 FULL API ENDPOINT TEST (Node.js)');
  console.log('  🌐 Base URL: ' + BASE);
  console.log('  📅 ' + new Date().toISOString());
  console.log('============================================================');
  console.log('');

  // ======================== COLD START ========================
  console.log('⏳ Backend cold start...');
  await req('GET', '/', null, null);
  console.log('');

  // ======================== AUTH (no auth) ========================
  console.log('━━━ 1. AUTH/USER (no auth) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  let r;
  
  r = await test(1, 'GET', '/', 'Default Route');
  r = await test(2, 'POST', '/login', 'Login (wrong creds)', null, { email: 'wrong@wrong.com', password: 'wrongpass' });
  r = await test(3, 'POST', '/register', 'Register (short pwd)', null, { full_name: 'test', email: 'test999@x.com', password: 'short' }, 422);
  r = await test(4, 'POST', '/register-teacher', 'Reg Teacher (short)', null, { full_name: 'test', email: 'testt999@x.com', password: 'short', teacher_secret_code: 'bad' }, 422);
  r = await test(5, 'GET', '/me', 'Me (no auth)', null, null, 401);
  r = await test(6, 'POST', '/refresh', 'Refresh (no cookie)', null, null, 401);
  console.log('');

  // ======================== TEACHER LOGIN ========================
  console.log('━━━ 2. TEACHER LOGIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  r = await test(7, 'POST', '/login', 'Teacher Login', null, { email: 'shaxruzsohibnazarov2@gmail.com', password: '22082011' });
  if (r.status === 200 && r.body && r.body.access_token) {
    T_TOKEN = r.body.access_token;
    console.log(`  ✅ Teacher token obtained (length: ${T_TOKEN.length})`);
  } else {
    console.log('  ❌ FAILED to get teacher token');
    console.log('  Response:', JSON.stringify(r.body).substring(0, 300));
  }
  console.log('');

  // ======================== STUDENT LOGIN ========================
  console.log('━━━ 3. STUDENT LOGIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  r = await test(8, 'POST', '/login', 'Student Login (20112011)', null, { email: 'world@gmail.com', password: '20112011' });
  if (r.status === 200 && r.body && r.body.access_token) {
    S_TOKEN = r.body.access_token;
    console.log(`  ✅ Student token obtained (length: ${S_TOKEN.length})`);
  } else {
    console.log('  ⚠️  Trying second password...');
    r = await test(8.5, 'POST', '/login', 'Student Login (12345678)', null, { email: 'world@gmail.com', password: '12345678' });
    if (r.status === 200 && r.body && r.body.access_token) {
      S_TOKEN = r.body.access_token;
      console.log(`  ✅ Student token obtained with 12345678`);
    } else {
      console.log('  ❌ Both passwords failed for student');
    }
  }
  console.log('');

  // ======================== /me with tokens ========================
  console.log('━━━ 4. /me WITH TOKENS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  r = await test(9, 'GET', '/me', 'Teacher /me', 't');
  const teacherId = r.body?.id;
  const teacherName = r.body?.full_name;
  console.log(`  👤 Teacher: ID=${teacherId}, Name=${teacherName}, Teacher=${r.body?.teacher}, Role=${r.body?.role}`);
  
  r = await test(10, 'GET', '/me', 'Student /me', 's');
  const studentId = r.body?.id;
  const studentName = r.body?.full_name;
  console.log(`  👤 Student: ID=${studentId}, Name=${studentName}, Teacher=${r.body?.teacher}, Role=${r.body?.role}`);
  console.log('');

  // ======================== USER PROFILE ========================
  console.log('━━━ 5. USER PROFILE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await test(11, 'PATCH', '/users/me', 'Update Profile (teacher)', 't', { full_name: r.body?.full_name || 'test' });
  await test(12, 'POST', '/users/me/password', 'Change Password (wrong old)', 't', { old_password: 'wrong', new_password: 'test12345678' }, 400);
  
  // Avatar
  console.log('  (avatar upload skipped - needs multipart)');
  console.log('');

  // ======================== GROUPS ========================
  console.log('━━━ 6. GROUPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Create test group
  r = await test(13, 'POST', '/create-group', 'Create Group', 't', { name: `API_TEST_${Date.now()}` });
  const testGroupId = r.body?.id;
  console.log(`  🏫 Test Group ID: ${testGroupId}`);
  
  await test(14, 'GET', '/groups', 'Get Groups (teacher)', 't');
  await test(15, 'GET', '/groups', 'Get Groups (student)', 's');
  await test(16, 'GET', '/me/groups', 'My Groups (student)', 's');
  await test(17, 'GET', '/me/group', 'My Group (student)', 's');
  
  if (testGroupId) {
    await test(18, 'GET', `/group/${testGroupId}`, 'Get Single Group', 't');
    await test(19, 'GET', `/group/${testGroupId}/members', 'Get Members', 't');
    
    if (studentId) {
      r = await test(20, 'POST', `/group/${testGroupId}/members`, 'Add Student to Group', 't', { user_id: studentId });
      await test(21, 'GET', `/group/${testGroupId}/members', 'Members After Add', 't');
      await test(22, 'POST', `/group/${testGroupId}/members/${studentId}/admin`, 'Promote to Admin', 't');
      await test(23, 'DELETE', `/group/${testGroupId}/members/${studentId}/admin', 'Demote Admin', 't');
    }
    
    await test(24, 'PATCH', `/group/${testGroupId}`, 'Update Group', 't', { name: `API_TEST_UPDATED_${Date.now()}` });
  }
  
  // 404s
  await test(25, 'GET', '/group/99999', 'Get Non-existent Group', 't', null, 404);
  await test(26, 'DELETE', '/group/99999', 'Delete Non-existent Group', 't', null, 404);
  console.log('');

  // ======================== LESSONS ========================
  console.log('━━━ 7. LESSONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let testLessonId = null;
  if (testGroupId) {
    r = await test(27, 'POST', `/groups/${testGroupId}/lessons`, 'Create Lesson', 't', { title: 'API Test Lesson', date: '2026-09-07' });
    testLessonId = r.body?.id;
    console.log(`  📚 Test Lesson ID: ${testLessonId}`);
    
    await test(28, 'GET', `/groups/${testGroupId}/lessons`, 'Get Group Lessons (teacher)', 't');
    await test(29, 'GET', `/groups/${testGroupId}/lessons', 'Get Group Lessons (student)', 's');
    
    if (testLessonId) {
      await test(30, 'GET', `/lessons/${testLessonId}`, 'Get Lesson', 't');
      await test(31, 'PATCH', `/lessons/${testLessonId}`, 'Update Lesson', 't', { title: 'Updated Lesson' });
      await test(32, 'GET', `/lessons/${testLessonId}/activities', 'Get Activities (teacher)', 't');
      await test(33, 'GET', `/lessons/${testLessonId}/activities', 'Get Activities (student)', 's');
      
      // Create activities
      await test(34, 'POST', `/lessons/${testLessonId}/homework`, 'Create HW', 't', { title: 'Test HW', description: 'do this' });
      await test(35, 'POST', `/lessons/${testLessonId}/exam`, 'Create Exam', 't', { title: 'Test Exam', description: 'exam desc' });
      await test(36, 'POST', `/lessons/${testLessonId}/quiz`, 'Create Quiz', 't', { title: 'Test Quiz', description: 'quiz desc' });
      await test(37, 'POST', `/lessons/${testLessonId}/materials`, 'Create Material', 't', { title: 'Test Material', url: 'https://example.com' });
      
      // Re-check activities
      const acts = await req('GET', `/lessons/${testLessonId}/activities`, null, T_TOKEN);
      if (acts.body && Array.isArray(acts.body)) {
        console.log(`  📋 Activities created: ${acts.body.length}`);
        for (const a of acts.body) {
          console.log(`     - ID=${a.id} type=${a.activity_type || a.type} title=${a.title}`);
        }
        
        // Find homework item to delete
        const hwItem = acts.body.find(a => (a.activity_type || a.type) === 'homework');
        if (hwItem) {
          await test(38, 'DELETE', `/lessons/${testLessonId}/homework/${hwItem.id}`, 'Delete HW Item', 't');
        }
      }
    }
  }
  
  // 404s
  await test(39, 'GET', '/lessons/99999', 'Get Non-existent Lesson', 't', null, 404);
  await test(40, 'DELETE', '/lessons/99999', 'Delete Non-existent Lesson', 't', null, 404);
  console.log('');

  // ======================== ATTENDANCE ========================
  console.log('━━━ 8. ATTENDANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let testAttId = null;
  if (testLessonId && studentId) {
    r = await test(41, 'POST', `/lessons/${testLessonId}/attendance`, 'Create Attendance', 't', { user_id: studentId, status: 'present', score: 10 });
    testAttId = r.body?.id;
    
    await test(42, 'GET', `/lessons/${testLessonId}/attendance', 'Get Attendance (teacher)', 't');
    await test(43, 'GET', `/lessons/${testLessonId}/attendance', 'Get Attendance (student)', 's');
    
    if (testAttId) {
      await test(44, 'PATCH', `/attendance/${testAttId}`, 'Update Attendance', 't', { status: 'late', score: 7 });
    }
  }
  
  await test(45, 'GET', '/lessons/99999/attendance', 'Attendance Non-existent', 't', null, 404);
  await test(46, 'PATCH', '/attendance/99999', 'Update Non-existent Attendance', 't', { status: 'absent' }, 404);
  console.log('');

  // ======================== OBJECTS / HOMEWORK ========================
  console.log('━━━ 9. OBJECTS + HOMEWORK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let testObjId = null;
  if (testGroupId) {
    r = await test(47, 'POST', '/add-object', 'Add Object', 't', { name: 'Test Assignment', description: 'test desc', deadline: '2026-12-31T23:59:00', group_id: testGroupId });
    testObjId = r.body?.id;
  }
  
  await test(48, 'GET', '/objects', 'Get Objects (teacher)', 't');
  await test(49, 'GET', '/objects', 'Get Objects (student)', 's');
  
  if (testObjId) {
    await test(50, 'GET', `/object/${testObjId}`, 'Get Object (teacher)', 't');
    await test(51, 'GET', `/object/${testObjId}`, 'Get Object (student)', 's');
    if (S_TOKEN) {
      await test(52, 'POST', `/object/${testObjId}/submit`, 'Submit Object (student)', 's', { url: 'https://github.com/test/submission' });
    }
  }
  
  await test(53, 'GET', '/teacher/homework', 'Teacher HW Submissions', 't');
  await test(54, 'GET', '/me/homework', 'My HW (student)', 's');
  await test(55, 'GET', '/homework', 'HW Alias', 't');
  
  // Try to grade a submission
  const hwList = await req('GET', '/teacher/homework', null, T_TOKEN);
  if (hwList.body && Array.isArray(hwList.body) && hwList.body.length > 0) {
    const hwSub = hwList.body[0];
    await test(56, 'PATCH', `/teacher/homework/${hwSub.id}/grade`, 'Grade HW', 't', { grade: 95 });
  } else {
    console.log('  ⚠️  No homework submissions to grade');
  }
  
  await test(57, 'POST', '/homework/99999/submit', 'Submit Non-existent HW', 's', { url: 'https://x.com' }, 404);
  console.log('');

  // ======================== TEACHER STATS ========================
  console.log('━━━ 10. STUDENT STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await test(58, 'GET', '/teacher/students', 'Teacher Students', 't');
  await test(59, 'GET', '/student/grades', 'Student Grades (teacher)', 't', null, 403);
  await test(60, 'GET', '/student/grades', 'Student Grades (student)', 's');
  await test(61, 'GET', '/student/rating', 'Student Rating (teacher)', 't', null, 403);
  await test(62, 'GET', '/student/rating', 'Student Rating (student)', 's');
  console.log('');

  // ======================== NOTIFICATIONS ========================
  console.log('━━━ 11. NOTIFICATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let testNotifId = null;
  if (studentId) {
    r = await test(63, 'POST', '/notifications', 'Create Notification', 't', { title: 'Test', message: 'Hello', user_id: studentId });
    testNotifId = r.body?.id;
  }
  
  await test(64, 'GET', '/notifications', 'Get Notifications (teacher)', 't');
  await test(65, 'GET', '/notifications', 'Get Notifications (student)', 's');
  await test(66, 'GET', '/notifications/unread-count', 'Unread Count (teacher)', 't');
  await test(67, 'GET', '/notifications/unread-count', 'Unread Count (student)', 's');
  
  if (studentId) {
    await test(68, 'POST', '/notifications/bulk', 'Bulk Notification', 't', { title: 'Bulk', message: 'bulk msg', user_ids: [studentId] });
  }
  
  if (testNotifId) {
    await test(69, 'PATCH', `/notifications/${testNotifId}`, 'Mark Read', 't', { is_read: true });
    await test(70, 'DELETE', `/notifications/${testNotifId}`, 'Delete Notification', 't');
  }
  
  await test(71, 'POST', '/notifications', 'Notif to non-existent user', 't', { title: 'X', message: 'X', user_id: 99999 });
  await test(72, 'DELETE', '/notifications/99999', 'Delete Non-existent Notif', 't', null, 404);
  console.log('');

  // ======================== REFRESH TOKEN ========================
  console.log('━━━ 12. REFRESH TOKEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  r = await test(73, 'POST', '/refresh', 'Refresh (no token)', null, null, 401);
  console.log('');

  // ======================== CLEANUP ========================
  console.log('━━━ CLEANUP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (testGroupId) {
    const delR = await req('DELETE', `/group/${testGroupId}`, null, T_TOKEN);
    console.log(`  🗑️  DELETE /group/${testGroupId} → ${delR.status}`);
  }
  
  console.log('');
  console.log('============================================================');
  console.log('  📊 TEST COMPLETE');
  console.log('============================================================');
  console.log('');
}

main().catch(e => console.error('FATAL:', e));
