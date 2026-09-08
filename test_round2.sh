#!/bin/bash
# =============================================================================
# ROUND 2: TEST WITH REAL IDs + SECOND STUDENT PASSWORD
# =============================================================================

BASE="https://api-4hjf.onrender.com"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

pass=0
fail=0

# ---- Teacher Login ----
echo -e "${CYAN}${BOLD}🔑 TEACHER LOGIN...${NC}"
T_RESP=$(curl -s -X POST "${BASE}/login" -H "Content-Type: application/json" \
    -d '{"email":"shaxruzsohibnazarov2@gmail.com","password":"22082011"}' --max-time 60)
T_TOKEN=$(echo "$T_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
if [ -z "$T_TOKEN" ]; then
    echo -e "${RED}❌ TEACHER LOGIN FAILED${NC}"
    echo "   $T_RESP"
    exit 1
fi
echo -e "${GREEN}✅ Teacher token obtained${NC}"

# ---- Student Login (password 1) ----
echo -e "${CYAN}${BOLD}🔑 STUDENT LOGIN (password: 20112011)...${NC}"
S1_RESP=$(curl -s -X POST "${BASE}/login" -H "Content-Type: application/json" \
    -d '{"email":"world@gmail.com","password":"20112011"}' --max-time 60)
S1_TOKEN=$(echo "$S1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
if [ -n "$S1_TOKEN" ]; then
    echo -e "${GREEN}✅ Student login OK with password 20112011${NC}"
else
    echo -e "${YELLOW}⚠️  Student login failed with 20112011${NC}"
    echo "   Response: $(echo "$S1_RESP" | head -c 200)"
fi

# ---- Student Login (password 2) ----
echo -e "${CYAN}${BOLD}🔑 STUDENT LOGIN (password: 12345678)...${NC}"
S2_RESP=$(curl -s -X POST "${BASE}/login" -H "Content-Type: application/json" \
    -d '{"email":"world@gmail.com","password":"12345678"}' --max-time 60)
S2_TOKEN=$(echo "$S2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
if [ -n "$S2_TOKEN" ]; then
    echo -e "${GREEN}✅ Student login OK with password 12345678${NC}"
else
    echo -e "${YELLOW}⚠️  Student login failed with 12345678${NC}"
    echo "   Response: $(echo "$S2_RESP" | head -c 200)"
fi

# Use whichever student token worked
S_TOKEN="${S1_TOKEN:-$S2_TOKEN}"
S_RESP="${S1_RESP:-$S2_RESP}"
if [ -z "$S_TOKEN" ]; then
    echo -e "${RED}❌ BOTH student passwords failed!${NC}"
fi

test_ep() {
    local num="$1" method="$2" ep="$3" desc="$4" auth="$5" data="$6"
    local url="${BASE}${ep}"
    local args=(-s -o /tmp/api_r.txt -w "%{http_code}" --max-time 30 -X "$method")
    
    if [ "$auth" = "t" ] && [ -n "$T_TOKEN" ]; then
        args+=(-H "Authorization: Bearer $T_TOKEN")
    elif [ "$auth" = "s" ] && [ -n "$S_TOKEN" ]; then
        args+=(-H "Authorization: Bearer $S_TOKEN")
    fi
    [ -n "$data" ] && args+=(-H "Content-Type: application/json" -d "$data")
    args+=("$url")
    
    local code=$(curl "${args[@]}" 2>/dev/null)
    local body=$(cat /tmp/api_r.txt 2>/dev/null)
    
    if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
        printf "  %-4s %-8s %-50s ${GREEN}✅${NC} HTTP %s\n" "$num" "$method" "$desc" "$code"
        ((pass++))
    elif [ "$code" -ge 400 ] && [ "$code" -lt 500 ]; then
        printf "  %-4s %-8s %-50s ${RED}❌${NC} HTTP %s\n" "$num" "$method" "$desc" "$code"
        echo "        → $(echo "$body" | head -c 200 | tr '\n' ' ')"
        ((fail++))
    elif [ "$code" -ge 500 ]; then
        printf "  %-4s %-8s %-50s ${RED}🔥${NC} HTTP %s\n" "$num" "$method" "$desc" "$code"
        echo "        → $(echo "$body" | head -c 200 | tr '\n' ' ')"
        ((fail++))
    else
        printf "  %-4s %-8s %-50s ${YELLOW}⚠️${NC}  HTTP %s\n" "$num" "$method" "$desc" "$code"
        ((fail++))
    fi
}

# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  📋 TEACHER'S GROUPS${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

GROUPS_RESP=$(curl -s "${BASE}/groups" -H "Authorization: Bearer $T_TOKEN" --max-time 30)
echo "$GROUPS_RESP" | python3 -c "
import sys, json
try:
    groups = json.load(sys.stdin)
    if isinstance(groups, list):
        for g in groups:
            print(f\"   ID={g.get('id')} | {g.get('name')}\")
except: pass
" 2>/dev/null

FIRST_GID=$(echo "$GROUPS_RESP" | python3 -c "
import sys, json
try:
    groups = json.load(sys.stdin)
    if isinstance(groups, list) and len(groups) > 0: print(groups[0]['id'])
except: pass
" 2>/dev/null)

# ============================================================================
# CREATE TEST GROUP + LESSONS + ATTENDANCE
# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  🏫 GROUP + LESSON + ATTENDANCE (FULL FLOW)${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CREATE_G=$(curl -s -X POST "${BASE}/create-group" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $T_TOKEN" \
    -d "{\"name\":\"API_TEST_$(date +%s)\"}" --max-time 30)
NEW_GID=$(echo "$CREATE_G" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
echo -e "  Created group: ID=${BOLD}${NEW_GID}${NC}"

# Add student to group
S_USER_ID=$(echo "$S_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('id',''))" 2>/dev/null)
echo -e "  Student user_id: ${BOLD}${S_USER_ID}${NC}"

if [ -n "$NEW_GID" ] && [ -n "$S_USER_ID" ]; then
    test_ep "G1" GET "/group/${NEW_GID}" "Get Single Group" "t" ""
    test_ep "G2" GET "/group/${NEW_GID}/members" "Get Group Members" "t" ""
    test_ep "G3" POST "/group/${NEW_GID}/members" "Add Student to Group" "t" "{\"user_id\":${S_USER_ID}}"
    test_ep "G4" GET "/group/${NEW_GID}/members" "Members After Add" "t" ""
    test_ep "G5" PATCH "/group/${NEW_GID}" "Update Group" "t" '{"name":"UPDATED_NAME"}'
    test_ep "G6" POST "/group/${NEW_GID}/members/${S_USER_ID}/admin" "Promote to Admin" "t" ""
    test_ep "G7" DELETE "/group/${NEW_GID}/members/${S_USER_ID}/admin" "Demote Admin" "t" ""
    
    # Student group access
    if [ -n "$S_TOKEN" ]; then
        test_ep "G8" GET "/me/groups" "Student My Groups" "s" ""
        test_ep "G9" GET "/me/group" "Student Current Group" "s" ""
    fi
    
    # ---- LESSONS ----
    echo ""
    echo -e "  ${BOLD}Creating lesson...${NC}"
    CREATE_L=$(curl -s -X POST "${BASE}/groups/${NEW_GID}/lessons" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $T_TOKEN" \
        -d '{"title":"Test Lesson","date":"2026-09-07"}' --max-time 30)
    NEW_LID=$(echo "$CREATE_L" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
    echo -e "  Created lesson: ID=${BOLD}${NEW_LID}${NC}"
    
    if [ -n "$NEW_LID" ]; then
        test_ep "L1" GET "/groups/${NEW_GID}/lessons" "Get Group Lessons" "t" ""
        test_ep "L2" GET "/lessons/${NEW_LID}" "Get Lesson" "t" ""
        test_ep "L3" PATCH "/lessons/${NEW_LID}" "Update Lesson" "t" '{"title":"Updated Lesson"}'
        test_ep "L4" GET "/lessons/${NEW_LID}/activities" "Get Activities" "t" ""
        
        # Create all activity types
        test_ep "L5" POST "/lessons/${NEW_LID}/homework" "Create Homework" "t" '{"title":"HW1","description":"desc"}'
        test_ep "L6" POST "/lessons/${NEW_LID}/exam" "Create Exam" "t" '{"title":"Exam1","description":"desc"}'
        test_ep "L7" POST "/lessons/${NEW_LID}/quiz" "Create Quiz" "t" '{"title":"Quiz1","description":"desc"}'
        test_ep "L8" POST "/lessons/${NEW_LID}/materials" "Create Material" "t" '{"title":"Mat1","url":"https://example.com"}'
        
        # Verify activities
        echo ""
        echo -e "  ${BOLD}Activities after creation:${NC}"
        ACTS=$(curl -s "${BASE}/lessons/${NEW_LID}/activities" -H "Authorization: Bearer $T_TOKEN" --max-time 30)
        echo "$ACTS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if isinstance(data, list):
        for a in data: print(f\"   ID={a.get('id')} type={a.get('type',a.get('activity_type','?'))} title={a.get('title','?')}\")
    else: print(f'   {str(data)[:200]}')
except: pass
" 2>/dev/null
        
        # Student activities
        if [ -n "$S_TOKEN" ]; then
            test_ep "L9" GET "/groups/${NEW_GID}/lessons" "Student Group Lessons" "s" ""
            test_ep "L10" GET "/lessons/${NEW_LID}/activities" "Student Activities" "s" ""
        fi
        
        # Delete homework item
        HW_ID=$(echo "$ACTS" | python3 -c "
import sys, json
try:
    for a in json.load(sys.stdin):
        if a.get('type')=='homework' or a.get('activity_type')=='homework':
            print(a.get('id','')); break
except: pass
" 2>/dev/null)
        [ -n "$HW_ID" ] && test_ep "L11" DELETE "/lessons/${NEW_LID}/homework/${HW_ID}" "Delete HW Item" "t" ""
        
        # ---- ATTENDANCE ----
        echo ""
        test_ep "A1" POST "/lessons/${NEW_LID}/attendance" "Create Attendance" "t" "{\"user_id\":${S_USER_ID},\"status\":\"present\",\"score\":10}"
        test_ep "A2" GET "/lessons/${NEW_LID}/attendance" "Get Attendance (teacher)" "t" ""
        
        ATT_ID=$(curl -s "${BASE}/lessons/${NEW_LID}/attendance" -H "Authorization: Bearer $T_TOKEN" --max-time 30 | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if isinstance(d, list) and d: print(d[0].get('id',''))
except: pass
" 2>/dev/null)
        [ -n "$ATT_ID" ] && test_ep "A3" PATCH "/attendance/${ATT_ID}" "Update Attendance" "t" '{"status":"late","score":8}'
        [ -n "$S_TOKEN" ] && test_ep "A4" GET "/lessons/${NEW_LID}/attendance" "Attendance (student)" "s" ""
    fi
fi

# ============================================================================
# OBJECTS / HOMEWORK
# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  📝 OBJECTS + HOMEWORK${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -n "$NEW_GID" ]; then
    test_ep "O1" POST "/add-object" "Add Object" "t" "{\"name\":\"TestObj\",\"description\":\"test\",\"deadline\":\"2026-12-31T23:59:00\",\"group_id\":${NEW_GID}}"
fi
test_ep "O2" GET "/objects" "Get Objects (teacher)" "t" ""
[ -n "$S_TOKEN" ] && test_ep "O3" GET "/objects" "Get Objects (student)" "s" ""

OBJS=$(curl -s "${BASE}/objects" -H "Authorization: Bearer $T_TOKEN" --max-time 30)
OBJ_ID=$(echo "$OBJS" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if isinstance(d, list) and d: print(d[0].get('id',''))
except: pass
" 2>/dev/null)

if [ -n "$OBJ_ID" ]; then
    test_ep "O4" GET "/object/${OBJ_ID}" "Get Single Object" "t" ""
    [ -n "$S_TOKEN" ] && test_ep "O5" GET "/object/${OBJ_ID}" "Get Object (student)" "s" ""
    [ -n "$S_TOKEN" ] && test_ep "O6" POST "/object/${OBJ_ID}/submit" "Submit Object" "s" '{"url":"https://github.com/test"}'
fi

test_ep "H1" GET "/teacher/homework" "Teacher HW Submissions" "t" ""
[ -n "$S_TOKEN" ] && test_ep "H2" GET "/me/homework" "My HW (student)" "s" ""
test_ep "H3" GET "/homework" "HW Alias" "t" ""

HW_LIST=$(curl -s "${BASE}/teacher/homework" -H "Authorization: Bearer $T_TOKEN" --max-time 30)
HW_SID=$(echo "$HW_LIST" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if isinstance(d, list) and d: print(d[0].get('id',''))
except: pass
" 2>/dev/null)
[ -n "$HW_SID" ] && test_ep "H4" PATCH "/teacher/homework/${HW_SID}/grade" "Grade HW" "t" '{"grade":90}'

# ============================================================================
# REFRESH TOKEN TEST
# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  🔄 REFRESH TOKEN${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

T_REFRESH=$(echo "$T_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)
if [ -n "$T_REFRESH" ]; then
    REF_CODE=$(curl -s -o /tmp/ref_r.txt -w "%{http_code}" -X POST "${BASE}/refresh" \
        -H "Content-Type: application/json" -d "{\"refresh_token\":\"${T_REFRESH}\"}" --max-time 30)
    echo "  POST /refresh (body token) → HTTP $REF_CODE"
    echo "  Response: $(cat /tmp/ref_r.txt | head -c 300)"
else
    REF_CODE=$(curl -s -o /tmp/ref_r.txt -w "%{http_code}" -X POST "${BASE}/refresh" --max-time 30)
    echo "  POST /refresh (cookie) → HTTP $REF_CODE"
    echo "  Response: $(cat /tmp/ref_r.txt | head -c 300)"
fi

# ============================================================================
# AVATAR
# ============================================================================
echo ""
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB\x60\x82' > /tmp/test.png
AV_CODE=$(curl -s -o /tmp/av_r.txt -w "%{http_code}" -X POST "${BASE}/users/me/avatar" \
    -H "Authorization: Bearer $T_TOKEN" -F "file=@/tmp/test.png;type=image/png" --max-time 30)
echo -e "  POST /users/me/avatar → HTTP $AV_CODE"
echo "  Response: $(cat /tmp/av_r.txt | head -c 300)"

# ============================================================================
# CLEANUP
# ============================================================================
echo ""
if [ -n "$NEW_GID" ]; then
    DEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "${BASE}/group/${NEW_GID}" \
        -H "Authorization: Bearer $T_TOKEN" --max-time 30)
    echo -e "  Cleanup: DELETE /group/${NEW_GID} → HTTP $DEL_CODE"
fi

# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}${BOLD}  📊 FINAL RESULTS${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}✅ WORKING: $pass${NC}"
echo -e "  ${RED}❌ FAILED:   $fail${NC}"
echo -e "  Total:      $((pass + fail))"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
