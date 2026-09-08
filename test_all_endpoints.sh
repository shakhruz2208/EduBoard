#!/bin/bash
# =============================================================================
# FULL API ENDPOINT TESTER - 56 Endpoints
# =============================================================================

BASE="https://api-4hjf.onrender.com"
TEACHER_EMAIL="${1:-}"
TEACHER_PASS="${2:-}"
STUDENT_EMAIL="${3:-}"
STUDENT_PASS="${4:-}"

PASS=0
FAIL=0
SKIP=0
RESULTS=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

test_endpoint() {
    local num="$1"
    local method="$2"
    local endpoint="$3"
    local desc="$4"
    local auth="$5"
    local data="$6"
    local extra_flags="$7"

    local url="${BASE}${endpoint}"
    local curl_args=(-s -o /tmp/api_resp.txt -w "%{http_code}" --max-time 30 -X "$method")

    if [ "$auth" = "teacher" ] && [ -n "$TEACHER_TOKEN" ]; then
        curl_args+=(-H "Authorization: Bearer $TEACHER_TOKEN")
    elif [ "$auth" = "student" ] && [ -n "$STUDENT_TOKEN" ]; then
        curl_args+=(-H "Authorization: Bearer $STUDENT_TOKEN")
    fi

    if [ -n "$data" ]; then
        curl_args+=(-H "Content-Type: application/json" -d "$data")
    fi

    if [ -n "$extra_flags" ]; then
        curl_args+=($extra_flags)
    fi

    curl_args+=("$url")

    local http_code
    http_code=$(curl "${curl_args[@]}" 2>/dev/null)
    local body
    body=$(cat /tmp/api_resp.txt 2>/dev/null)

    local status=""
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        status="${GREEN}✅ WORKS${NC}"
        ((PASS++))
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        status="${RED}❌ CLIENT ERROR ($http_code)${NC}"
        ((FAIL++))
    elif [ "$http_code" -ge 500 ]; then
        status="${RED}🔥 SERVER ERROR ($http_code)${NC}"
        ((FAIL++))
    elif [ "$http_code" = "000" ]; then
        status="${YELLOW}⚠️  TIMEOUT/NO RESPONSE${NC}"
        ((FAIL++))
    else
        status="${YELLOW}⚠️  HTTP $http_code${NC}"
        ((FAIL++))
    fi

    # Truncate body for display
    local short_body
    short_body=$(echo "$body" | head -c 200 | tr '\n' ' ')

    printf "%-3s | %-8s | %-50s | %b\n" "$num" "$method" "$endpoint" "$status"
    if [ "$http_code" -ge 400 ] || [ "$http_code" = "000" ] || [ "$http_code" -ge 500 ]; then
        printf "     Response: %s\n" "$short_body"
    fi

    RESULTS+="|$num|$method|$desc|$endpoint|HTTP $http_code|$([ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ] && echo "✅" || echo "❌")|\n"
}

echo ""
echo "============================================================"
echo "  🔍 FULL API ENDPOINT TEST - $(date)"
echo "  🌐 Base URL: $BASE"
echo "============================================================"
echo ""

# Wait for Render cold start
echo "⏳ Backend iliq tayyorlanmoqda (Render cold start)..."
curl -s -o /dev/null -w "%{http_code}" --max-time 60 "${BASE}/" > /dev/null 2>&1
echo ""

# ============================================================================
# AUTH / USER (9 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 1. AUTH / USER ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 1 GET "/" "Default Route" "none" ""
test_endpoint 2 POST "/login" "Login User" "none" "{\"email\":\"test@test.com\",\"password\":\"wrong\"}"
test_endpoint 3 POST "/register" "Register User" "none" "{\"full_name\":\"test\",\"email\":\"test_check_999@test.com\",\"password\":\"test123\"}"
test_endpoint 4 POST "/register-teacher" "Register Teacher" "none" "{\"full_name\":\"test\",\"email\":\"test_teacher_999@test.com\",\"password\":\"test123\",\"teacher_secret_code\":\"wrong\"}"
test_endpoint 5 GET "/me" "Me" "none" ""
test_endpoint 6 DELETE "/users/me" "Delete Current User" "none" ""
test_endpoint 7 PATCH "/users/me" "Update Profile" "none" "{\"full_name\":\"test\"}"
test_endpoint 8 POST "/users/me/password" "Change Password" "none" "{\"old_password\":\"x\",\"new_password\":\"x\"}"
test_endpoint 9 POST "/refresh" "Refresh Token" "none" ""

echo ""
# ============================================================================
# LOGIN - Get tokens for further tests
# ============================================================================
echo -e "${CYAN}━━━ LOGIN TOKENS OLISH ━━━${NC}"
echo "-----------------------------------------------------------"

if [ -n "$TEACHER_EMAIL" ] && [ -n "$TEACHER_PASS" ]; then
    echo "🔑 Teacher login qilmoqda..."
    TEACHER_RESP=$(curl -s -X POST "${BASE}/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${TEACHER_EMAIL}\",\"password\":\"${TEACHER_PASS}\"}" \
        --max-time 30)
    TEACHER_TOKEN=$(echo "$TEACHER_RESP" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
    TEACHER_REFRESH=$(echo "$TEACHER_RESP" | grep -o '"refresh_token":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$TEACHER_TOKEN" ]; then
        echo -e "${GREEN}✅ Teacher token olindi${NC}"
        # Extract teacher user data
        echo "$TEACHER_RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    u = d.get('user', {})
    print(f'   ID: {u.get(\"id\")}, Name: {u.get(\"full_name\")}, Role: {u.get(\"role\")}, Email: {u.get(\"email\")}')
    print(f'   Teacher flag: {u.get(\"teacher\")}')
except: print('   (parse error)')
" 2>/dev/null || echo "   (parse info unavailable)"
    else
        echo -e "${RED}❌ Teacher login xatosi${NC}"
        echo "   Response: $(echo "$TEACHER_RESP" | head -c 300)"
    fi
else
    echo -e "${YELLOW}⚠️  Teacher credentials berilmagan — teacher endpointlari limited test qilinadi${NC}"
fi

if [ -n "$STUDENT_EMAIL" ] && [ -n "$STUDENT_PASS" ]; then
    echo "🔑 Student login qilmoqda..."
    STUDENT_RESP=$(curl -s -X POST "${BASE}/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"${STUDENT_PASS}\"}" \
        --max-time 30)
    STUDENT_TOKEN=$(echo "$STUDENT_RESP" | grep -o '"access_token":"[^"]*"' | head -1 | cut -d'"' -f4)
    STUDENT_REFRESH=$(echo "$STUDENT_RESP" | grep -o '"refresh_token":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$STUDENT_TOKEN" ]; then
        echo -e "${GREEN}✅ Student token olindi${NC}"
        echo "$STUDENT_RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    u = d.get('user', {})
    print(f'   ID: {u.get(\"id\")}, Name: {u.get(\"full_name\")}, Role: {u.get(\"role\")}, Email: {u.get(\"email\")}')
    print(f'   Teacher flag: {u.get(\"teacher\")}')
except: print('   (parse error)')
" 2>/dev/null || echo "   (parse info unavailable)"
    else
        echo -e "${RED}❌ Student login xatosi${NC}"
        echo "   Response: $(echo "$STUDENT_RESP" | head -c 300)"
    fi
else
    echo -e "${YELLOW}⚠️  Student credentials berilmagan — student endpointlari limited test qilinadi${NC}"
fi

echo ""
# ============================================================================
# OBJECT / AVATAR (6 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 2. OBJECT / AVATAR ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 10 POST "/add-object" "Add Object" "teacher" '{"title":"test object","description":"test"}'
test_endpoint 11 GET "/objects" "Get Objects" "teacher" ""
test_endpoint 12 GET "/objects" "Get Objects (student)" "student" ""
test_endpoint 13 POST "/users/me/avatar" "Upload Avatar" "teacher" "" "-F 'file=@/dev/null;filename=test.png;type=image/png'"
test_endpoint 14 GET "/object/1" "Get Single Object" "teacher" ""
test_endpoint 15 DELETE "/object/1" "Delete Object" "teacher" ""
test_endpoint 16 POST "/object/1/submit" "Submit Object" "student" '{"url":"https://example.com"}'

echo ""
# ============================================================================
# HOMEWORK (5 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 3. HOMEWORK ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 17 GET "/me/homework" "Get My Homework (student)" "student" ""
test_endpoint 18 GET "/me/homework" "Get My Homework (teacher)" "teacher" ""
test_endpoint 19 GET "/homework" "Get Homework Alias" "student" ""
test_endpoint 20 POST "/homework/1/submit" "Submit Homework" "student" '{"url":"https://example.com"}'
test_endpoint 21 GET "/teacher/homework" "Get Teacher Homework Submissions" "teacher" ""
test_endpoint 22 PATCH "/teacher/homework/1/grade" "Grade Homework" "teacher" '{"score":5}'

echo ""
# ============================================================================
# GROUP (13 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 4. GROUP ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

# First create a test group
echo -n "   Creating test group..."
GROUP_RESP=$(curl -s -X POST "${BASE}/create-group" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TEACHER_TOKEN}" \
    -d '{"name":"API_TEST_GROUP_x9z"}' \
    --max-time 30)
TEST_GROUP_ID=$(echo "$GROUP_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$TEST_GROUP_ID" ]; then
    echo -e " ${GREEN}OK${NC} (id=$TEST_GROUP_ID)"
else
    echo -e " ${RED}FAIL${NC}"
    echo "   Response: $(echo "$GROUP_RESP" | head -c 300)"
fi

test_endpoint 23 POST "/create-group" "Create Group" "teacher" '{"name":"API_TEST_2"}'
test_endpoint 24 GET "/groups" "Get Groups (teacher)" "teacher" ""
test_endpoint 25 GET "/groups" "Get Groups (student)" "student" ""
test_endpoint 26 GET "/me/groups" "Get My Groups (student)" "student" ""
test_endpoint 27 GET "/me/group" "Get Current User Group" "student" ""
test_endpoint 28 GET "/group/1" "Get Single Group" "teacher" ""

if [ -n "$TEST_GROUP_ID" ]; then
    test_endpoint 29 PATCH "/group/${TEST_GROUP_ID}" "Update Group" "teacher" '{"name":"API_TEST_GROUP_UPDATED"}'
    test_endpoint 30 GET "/group/${TEST_GROUP_ID}/members" "Get Group Members" "teacher" ""
    test_endpoint 31 POST "/group/${TEST_GROUP_ID}/members" "Add User To Group" "teacher" '{"user_id":1}'
fi

test_endpoint 32 DELETE "/group/99999" "Delete Non-existent Group" "teacher" ""
test_endpoint 33 POST "/group/99999/members" "Add to Non-existent Group" "teacher" '{"user_id":1}'
test_endpoint 34 DELETE "/group/99999/members/1" "Remove from Non-existent Group" "teacher" ""
test_endpoint 35 POST "/group/99999/members/1/admin" "Promote in Non-existent Group" "teacher" ""
test_endpoint 36 DELETE "/group/99999/members/1/admin" "Demote in Non-existent Group" "teacher" ""

echo ""
# ============================================================================
# LESSONS (11 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 5. LESSONS ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

# Create a test lesson if we have a group
if [ -n "$TEST_GROUP_ID" ]; then
    echo -n "   Creating test lesson..."
    LESSON_RESP=$(curl -s -X POST "${BASE}/groups/${TEST_GROUP_ID}/lessons" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${TEACHER_TOKEN}" \
        -d '{"title":"API Test Lesson","date":"2026-01-01"}' \
        --max-time 30)
    TEST_LESSON_ID=$(echo "$LESSON_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
    if [ -n "$TEST_LESSON_ID" ]; then
        echo -e " ${GREEN}OK${NC} (id=$TEST_LESSON_ID)"
    else
        echo -e " ${RED}FAIL${NC}"
        echo "   Response: $(echo "$LESSON_RESP" | head -c 300)"
    fi
fi

test_endpoint 37 POST "/groups/${TEST_GROUP_ID:-1}/lessons" "Create Lesson" "teacher" '{"title":"test lesson","date":"2026-01-01"}'
test_endpoint 38 GET "/groups/${TEST_GROUP_ID:-1}/lessons" "Get Group Lessons (teacher)" "teacher" ""
test_endpoint 39 GET "/groups/${TEST_GROUP_ID:-1}/lessons" "Get Group Lessons (student)" "student" ""
test_endpoint 40 GET "/lessons/${TEST_LESSON_ID:-1}" "Get Lesson" "teacher" ""
test_endpoint 41 PATCH "/lessons/${TEST_LESSON_ID:-1}" "Update Lesson" "teacher" '{"title":"Updated Lesson"}'
test_endpoint 42 GET "/lessons/${TEST_LESSON_ID:-1}/activities" "Get Lesson Activities (teacher)" "teacher" ""
test_endpoint 43 GET "/lessons/${TEST_LESSON_ID:-1}/activities" "Get Lesson Activities (student)" "student" ""
test_endpoint 44 POST "/lessons/${TEST_LESSON_ID:-1}/homework" "Create Lesson Homework" "teacher" '{"title":"test hw","description":"test"}'
test_endpoint 45 POST "/lessons/${TEST_LESSON_ID:-1}/exam" "Create Lesson Exam" "teacher" '{"title":"test exam","description":"test"}'
test_endpoint 46 POST "/lessons/${TEST_LESSON_ID:-1}/quiz" "Create Lesson Quiz" "teacher" '{"title":"test quiz","description":"test"}'
test_endpoint 47 POST "/lessons/${TEST_LESSON_ID:-1}/materials" "Create Lesson Material" "teacher" '{"title":"test material","url":"https://example.com"}'
test_endpoint 48 DELETE "/lessons/99999" "Delete Non-existent Lesson" "teacher" ""
test_endpoint 49 DELETE "/lessons/${TEST_LESSON_ID:-1}/homework/99999" "Delete Non-existent HW Item" "teacher" ""

echo ""
# ============================================================================
# ATTENDANCE (3 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 6. ATTENDANCE ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 50 POST "/lessons/${TEST_LESSON_ID:-1}/attendance" "Create Attendance" "teacher" '{"user_id":1,"status":"present","score":10}'
test_endpoint 51 GET "/lessons/${TEST_LESSON_ID:-1}/attendance" "Get Lesson Attendance (teacher)" "teacher" ""
test_endpoint 52 GET "/lessons/${TEST_LESSON_ID:-1}/attendance" "Get Lesson Attendance (student)" "student" ""
test_endpoint 53 PATCH "/attendance/99999" "Update Non-existent Attendance" "teacher" '{"status":"absent"}'

echo ""
# ============================================================================
# STUDENT STATS (3 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 7. STUDENT STATS ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 54 GET "/teacher/students" "Get Teacher Students" "teacher" ""
test_endpoint 55 GET "/student/grades" "Get Student Grades (teacher)" "teacher" ""
test_endpoint 56 GET "/student/grades" "Get Student Grades (student)" "student" ""
test_endpoint 57 GET "/student/rating" "Get Student Rating (teacher)" "teacher" ""
test_endpoint 58 GET "/student/rating" "Get Student Rating (student)" "student" ""

echo ""
# ============================================================================
# NOTIFICATIONS (7 endpoints)
# ============================================================================
echo -e "${CYAN}━━━ 8. NOTIFICATIONS ENDPOINTLARI ━━━${NC}"
echo "-----------------------------------------------------------"

test_endpoint 59 POST "/notifications" "Create Notification" "teacher" '{"title":"test","message":"test notification","user_id":1}'
test_endpoint 60 GET "/notifications" "Get Notifications (teacher)" "teacher" ""
test_endpoint 61 GET "/notifications" "Get Notifications (student)" "student" ""
test_endpoint 62 GET "/notifications/unread-count" "Get Unread Count (teacher)" "teacher" ""
test_endpoint 63 GET "/notifications/unread-count" "Get Unread Count (student)" "student" ""
test_endpoint 64 POST "/notifications/bulk" "Create Bulk Notification" "teacher" '{"title":"bulk","message":"bulk test","user_ids":[1]}'
test_endpoint 65 PATCH "/notifications/99999" "Mark Non-existent Notification Read" "teacher" '{"is_read":true}'
test_endpoint 66 DELETE "/notifications/99999" "Delete Non-existent Notification" "teacher" ""

echo ""
# ============================================================================
# CLEANUP
# ============================================================================
echo -e "${CYAN}━━━ TOZALASH ━━━${NC}"
echo "-----------------------------------------------------------"

if [ -n "$TEST_GROUP_ID" ]; then
    echo -n "   Deleting test group $TEST_GROUP_ID..."
    CLEAN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE}/group/${TEST_GROUP_ID}" \
        -H "Authorization: Bearer ${TEACHER_TOKEN}" --max-time 30)
    echo " HTTP $CLEAN_CODE"
fi

echo ""
echo "============================================================"
echo "  📊 NATIJALAR"
echo "============================================================"
echo -e "  ${GREEN}✅ ISHLAYDI: $PASS${NC}"
echo -e "  ${RED}❌ XATO: $FAIL${NC}"
echo -e "  Total: $((PASS + FAIL))"
echo "============================================================"
echo ""
