#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# LUMO API — Comprehensive Test Suite
# Tests every endpoint including shared rooms, bulk canvas save,
# AI visual generation, multi-user collaboration, and edge cases.
# ═══════════════════════════════════════════════════════════════════

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# Config
BASE_URL="${API_URL:-https://lumo-api-m7w6.onrender.com}"
TS=$(date +%s)
USER_A_EMAIL="tester_a_${TS}@lumoboard.com"
USER_B_EMAIL="tester_b_${TS}@lumoboard.com"
PASSWORD="T3stP@ss!99"

# State
TOKEN_A=""
TOKEN_B=""
USER_A_ID=""
USER_B_ID=""
ROOM_ID=""
ROOM_ID_2=""
OBJECT_ID=""
OBJECT_ID_2=""

# Counters
PASS=0
FAIL=0
SKIP=0
SECTION=0

# ── Helpers ──────────────────────────────────────────────────────

print_header() {
    ((SECTION++))
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  ${SECTION}. $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

ok() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASS++))
}

fail() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAIL++))
}

skip() {
    echo -e "  ${DIM}⊘ $1 (skipped)${NC}"
    ((SKIP++))
}

info() {
    echo -e "  ${DIM}  ↳ $1${NC}"
}

# Generic request helper
# Usage: do_req METHOD ENDPOINT [BODY] [TOKEN]
# Sets: HTTP_CODE, BODY
do_req() {
    local method="$1" endpoint="$2" data="$3" token="$4"
    local curl_args=(-s -w "\n%{http_code}" -X "$method")

    [[ -n "$token" ]] && curl_args+=(-H "Authorization: Bearer $token")
    if [[ -n "$data" ]]; then
        curl_args+=(-H "Content-Type: application/json" -d "$data")
    fi
    curl_args+=("${BASE_URL}${endpoint}")

    local raw
    raw=$(curl "${curl_args[@]}" 2>/dev/null)
    HTTP_CODE=$(echo "$raw" | tail -n1)
    BODY=$(echo "$raw" | sed '$d')
}

# Extract JSON field (simple grep-based, works for flat keys)
json_val() {
    echo "$1" | grep -o "\"$2\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

json_num() {
    echo "$1" | grep -o "\"$2\":[0-9]*" | head -1 | cut -d: -f2
}

assert_code() {
    local expected="$1" desc="$2"
    if [ "$HTTP_CODE" = "$expected" ]; then
        ok "$desc"
    else
        fail "$desc  (expected $expected, got $HTTP_CODE)"
        info "Response: ${BODY:0:200}"
    fi
}

assert_code_range() {
    local lo="$1" hi="$2" desc="$3"
    if [ "$HTTP_CODE" -ge "$lo" ] 2>/dev/null && [ "$HTTP_CODE" -le "$hi" ] 2>/dev/null; then
        ok "$desc"
    else
        fail "$desc  (expected ${lo}–${hi}, got $HTTP_CODE)"
        info "Response: ${BODY:0:200}"
    fi
}

# ═════════════════════════════════════════════════════════════════
clear
echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════════════╗"
echo "  ║        LUMO  API  —  Full  Test  Suite            ║"
echo "  ╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Server : $BASE_URL"
echo "  User A : $USER_A_EMAIL"
echo "  User B : $USER_B_EMAIL"
echo ""

# ═════════════════════════════════════════════════════════════════
# 1. HEALTH / ROOT
# ═════════════════════════════════════════════════════════════════
print_header "Health & Root Endpoints"

do_req GET "/"
assert_code 200 "GET / — root info"

do_req GET "/health"
assert_code 200 "GET /health — health check"

do_req GET "/db-status"
assert_code 200 "GET /db-status — database status"
info "Tables: $(echo "$BODY" | grep -o '"tables":\[[^]]*\]' | head -c 120)"

# ═════════════════════════════════════════════════════════════════
# 2. AUTH — REGISTER + LOGIN (User A)
# ═════════════════════════════════════════════════════════════════
print_header "Auth — Register & Login (User A)"

do_req POST "/auth/register" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Alice Test\"}"
assert_code 200 "POST /auth/register — create user A"
USER_A_ID=$(json_val "$BODY" "id")
info "User A ID: $USER_A_ID"

# Duplicate registration should fail
do_req POST "/auth/register" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Dup\"}"
assert_code 400 "POST /auth/register — duplicate email rejected"

# Bad email format
do_req POST "/auth/register" "{\"email\":\"not-an-email\",\"password\":\"$PASSWORD\",\"name\":\"Bad\"}"
assert_code_range 400 422 "POST /auth/register — invalid email rejected"

# Login
do_req POST "/auth/login" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"$PASSWORD\"}"
assert_code 200 "POST /auth/login — user A login"
TOKEN_A=$(json_val "$BODY" "access_token")
info "Token A: ${TOKEN_A:0:40}…"

# Wrong password
do_req POST "/auth/login" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"wrongpass\"}"
assert_code 401 "POST /auth/login — wrong password rejected"

# Non-existent user
do_req POST "/auth/login" "{\"email\":\"ghost_${TS}@lumoboard.com\",\"password\":\"$PASSWORD\"}"
assert_code 401 "POST /auth/login — unknown user rejected"

# Get me
do_req GET "/auth/me" "" "$TOKEN_A"
assert_code 200 "GET /auth/me — user A profile"
info "Name: $(json_val "$BODY" "name"), Email: $(json_val "$BODY" "email")"

# Unauthenticated access
do_req GET "/auth/me"
assert_code_range 401 403 "GET /auth/me — no token → 401/403"

# Logout (stateless — always 200)
do_req POST "/auth/logout"
assert_code 200 "POST /auth/logout — logout"

# ═════════════════════════════════════════════════════════════════
# 3. AUTH — REGISTER + LOGIN (User B — for shared room tests)
# ═════════════════════════════════════════════════════════════════
print_header "Auth — Register & Login (User B)"

do_req POST "/auth/register" "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Bob Test\"}"
assert_code 200 "POST /auth/register — create user B"
USER_B_ID=$(json_val "$BODY" "id")
info "User B ID: $USER_B_ID"

do_req POST "/auth/login" "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$PASSWORD\"}"
assert_code 200 "POST /auth/login — user B login"
TOKEN_B=$(json_val "$BODY" "access_token")
info "Token B: ${TOKEN_B:0:40}…"

# ═════════════════════════════════════════════════════════════════
# 4. ROOMS — CRUD (User A)
# ═════════════════════════════════════════════════════════════════
print_header "Rooms — CRUD (User A)"

# Create room
do_req POST "/rooms/" "{\"name\":\"Test Board ${TS}\"}" "$TOKEN_A"
assert_code 200 "POST /rooms/ — create room"
ROOM_ID=$(json_val "$BODY" "id")
info "Room ID: $ROOM_ID"

# Create a second room for later tests
do_req POST "/rooms/" "{\"name\":\"Second Board ${TS}\"}" "$TOKEN_A"
assert_code 200 "POST /rooms/ — create second room"
ROOM_ID_2=$(json_val "$BODY" "id")
info "Room ID 2: $ROOM_ID_2"

# List rooms
do_req GET "/rooms/" "" "$TOKEN_A"
assert_code 200 "GET /rooms/ — list user A rooms"
info "Body contains room: $(echo "$BODY" | grep -c "$ROOM_ID") match(es)"

# Get specific room
if [ -n "$ROOM_ID" ]; then
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 200 "GET /rooms/{id} — get room by ID"
    info "Room name: $(json_val "$BODY" "name")"
else
    skip "GET /rooms/{id} — no ROOM_ID"
fi

# Update room name
if [ -n "$ROOM_ID" ]; then
    do_req PUT "/rooms/$ROOM_ID" "{\"name\":\"Renamed Board ${TS}\"}" "$TOKEN_A"
    assert_code 200 "PUT /rooms/{id} — rename room"
    info "New name: $(json_val "$BODY" "name")"
else
    skip "PUT /rooms/{id} — no ROOM_ID"
fi

# Get non-existent room
do_req GET "/rooms/00000000-0000-0000-0000-000000000000" "" "$TOKEN_A"
assert_code 404 "GET /rooms/{id} — non-existent room → 404"

# Unauthenticated room access
do_req GET "/rooms/"
assert_code_range 401 403 "GET /rooms/ — no token → 401/403"

# ═════════════════════════════════════════════════════════════════
# 5. SHARED ROOMS — User B accesses User A's room
# ═════════════════════════════════════════════════════════════════
print_header "Shared Rooms — Cross-User Access"

if [ -n "$ROOM_ID" ] && [ -n "$TOKEN_B" ]; then
    # User B should NOT see room in their own list yet
    do_req GET "/rooms/" "" "$TOKEN_B"
    assert_code 200 "GET /rooms/ — user B room list (before share)"
    if echo "$BODY" | grep -q "$ROOM_ID"; then
        fail "User B should not see room A in their list yet"
    else
        ok "User B room list does NOT contain room A (correct)"
    fi

    # User B accesses room directly via ID (auto-join)
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_B"
    assert_code 200 "GET /rooms/{id} — user B auto-joins user A room"
    info "Room name: $(json_val "$BODY" "name")"

    # Now user B should see the room in their list
    do_req GET "/rooms/" "" "$TOKEN_B"
    assert_code 200 "GET /rooms/ — user B room list (after auto-join)"
    if echo "$BODY" | grep -q "$ROOM_ID"; then
        ok "User B room list NOW contains shared room"
    else
        fail "User B room list should contain shared room after auto-join"
    fi

    # Explicit join endpoint
    do_req POST "/rooms/$ROOM_ID/join" "" "$TOKEN_B"
    assert_code 200 "POST /rooms/{id}/join — explicit join (idempotent)"

    # Join non-existent room
    do_req POST "/rooms/00000000-0000-0000-0000-000000000000/join" "" "$TOKEN_B"
    assert_code 404 "POST /rooms/{id}/join — non-existent room → 404"
else
    skip "Shared room tests — missing ROOM_ID or TOKEN_B"
fi

# ═════════════════════════════════════════════════════════════════
# 6. DRAWING OBJECTS — CRUD
# ═════════════════════════════════════════════════════════════════
print_header "Drawing Objects — CRUD"

if [ -n "$ROOM_ID" ]; then
    # Add a rectangle
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"rect\",\"x\":100,\"y\":150,\"data\":{\"width\":200,\"height\":120},\"color\":\"#3b82f6\",\"stroke_width\":2}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add rect"
    OBJECT_ID=$(json_val "$BODY" "id")
    info "Object ID: $OBJECT_ID"

    # Add a pen stroke
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"pen\",\"x\":0,\"y\":0,\"data\":{\"points\":[10,20,30,40,50,60]},\"color\":\"#ffffff\",\"stroke_width\":3}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add pen stroke"
    OBJECT_ID_2=$(json_val "$BODY" "id")

    # Add an ellipse
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"ellipse\",\"x\":300,\"y\":200,\"data\":{\"width\":150,\"height\":100},\"color\":\"#22c55e\",\"stroke_width\":2}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add ellipse"

    # Add a text element
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"text\",\"x\":50,\"y\":50,\"data\":{\"text\":\"Hello LUMO\"},\"color\":\"#f97316\",\"stroke_width\":0}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add text"

    # Add an arrow
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"arrow\",\"x\":0,\"y\":0,\"data\":{\"points\":[100,100,300,200]},\"color\":\"#a855f7\",\"stroke_width\":2}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add arrow"

    # Add an image (SVG data URI)
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"image\",\"x\":400,\"y\":50,\"data\":{\"width\":300,\"height\":200,\"src\":\"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=\"},\"color\":\"#ffffff\",\"stroke_width\":0}" \
        "$TOKEN_A"
    assert_code 200 "POST /rooms/{id}/objects — add image element"

    # User B adds an object to the shared room
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"rect\",\"x\":500,\"y\":500,\"data\":{\"width\":80,\"height\":80},\"color\":\"#ef4444\",\"stroke_width\":2}" \
        "$TOKEN_B"
    assert_code 200 "POST /rooms/{id}/objects — user B adds to shared room"

    # Verify room has objects
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 200 "GET /rooms/{id} — room with objects loaded"
    OBJ_COUNT=$(echo "$BODY" | grep -o '"type":' | wc -l)
    info "Total objects in response: $OBJ_COUNT"

    # Update object
    if [ -n "$OBJECT_ID" ]; then
        do_req PUT "/rooms/$ROOM_ID/objects/$OBJECT_ID" \
            "{\"type\":\"rect\",\"x\":200,\"y\":250,\"data\":{\"width\":250,\"height\":140},\"color\":\"#ef4444\",\"stroke_width\":4}" \
            "$TOKEN_A"
        assert_code 200 "PUT /rooms/{id}/objects/{oid} — update object"
    else
        skip "PUT object — no OBJECT_ID"
    fi

    # Update non-existent object
    do_req PUT "/rooms/$ROOM_ID/objects/00000000-0000-0000-0000-000000000000" \
        "{\"type\":\"rect\",\"x\":0,\"y\":0,\"data\":{},\"color\":\"#000\",\"stroke_width\":1}" \
        "$TOKEN_A"
    assert_code 404 "PUT /rooms/{id}/objects/{oid} — non-existent → 404"

    # Delete one object
    if [ -n "$OBJECT_ID_2" ]; then
        do_req DELETE "/rooms/$ROOM_ID/objects/$OBJECT_ID_2" "" "$TOKEN_A"
        assert_code 200 "DELETE /rooms/{id}/objects/{oid} — delete object"
    else
        skip "DELETE object — no OBJECT_ID_2"
    fi

    # Delete non-existent object
    do_req DELETE "/rooms/$ROOM_ID/objects/00000000-0000-0000-0000-000000000000" "" "$TOKEN_A"
    assert_code 404 "DELETE /rooms/{id}/objects/{oid} — non-existent → 404"
else
    skip "Drawing object tests — no ROOM_ID"
fi

# ═════════════════════════════════════════════════════════════════
# 7. BULK CANVAS SAVE  (PUT /rooms/{id}/canvas)
# ═════════════════════════════════════════════════════════════════
print_header "Bulk Canvas Save"

if [ -n "$ROOM_ID" ]; then
    # Save a fresh canvas state (replaces everything)
    CANVAS_PAYLOAD='{
        "objects": [
            {"type":"rect","x":10,"y":10,"data":{"width":100,"height":80},"color":"#3b82f6","stroke_width":2},
            {"type":"pen","x":0,"y":0,"data":{"points":[5,5,50,50,100,25]},"color":"#ffffff","stroke_width":3},
            {"type":"ellipse","x":200,"y":100,"data":{"width":120,"height":90},"color":"#22c55e","stroke_width":2},
            {"type":"text","x":300,"y":10,"data":{"text":"Canvas saved!"},"color":"#eab308","stroke_width":0},
            {"type":"arrow","x":0,"y":0,"data":{"points":[10,10,200,200]},"color":"#a855f7","stroke_width":2},
            {"type":"image","x":400,"y":300,"data":{"width":250,"height":180,"src":"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="},"color":"#fff","stroke_width":0}
        ]
    }'
    do_req PUT "/rooms/$ROOM_ID/canvas" "$CANVAS_PAYLOAD" "$TOKEN_A"
    assert_code 200 "PUT /rooms/{id}/canvas — bulk save (6 objects)"
    SAVED_COUNT=$(json_num "$BODY" "count")
    if [ "$SAVED_COUNT" = "6" ]; then
        ok "Canvas save returned count=6"
    else
        fail "Canvas save count mismatch (expected 6, got $SAVED_COUNT)"
    fi

    # Verify saved state by reloading room
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 200 "GET /rooms/{id} — reload after canvas save"
    RELOAD_OBJS=$(echo "$BODY" | grep -o '"type":' | wc -l)
    info "Objects after bulk save: $RELOAD_OBJS"

    # User B can also save canvas (shared room)
    CANVAS_B='{
        "objects": [
            {"type":"rect","x":50,"y":50,"data":{"width":60,"height":60},"color":"#ef4444","stroke_width":2}
        ]
    }'
    do_req PUT "/rooms/$ROOM_ID/canvas" "$CANVAS_B" "$TOKEN_B"
    assert_code 200 "PUT /rooms/{id}/canvas — user B bulk save on shared room"

    # Save empty canvas (clear all)
    do_req PUT "/rooms/$ROOM_ID/canvas" '{"objects":[]}' "$TOKEN_A"
    assert_code 200 "PUT /rooms/{id}/canvas — save empty (clear canvas)"
    CLEAR_COUNT=$(json_num "$BODY" "count")
    if [ "$CLEAR_COUNT" = "0" ]; then
        ok "Empty canvas save returned count=0"
    else
        fail "Empty canvas save count mismatch (expected 0, got $CLEAR_COUNT)"
    fi

    # Verify empty
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    EMPTY_OBJS=$(echo "$BODY" | grep -o '"type":' | wc -l)
    if [ "$EMPTY_OBJS" = "0" ]; then
        ok "Room is empty after clearing canvas"
    else
        fail "Room should be empty but has $EMPTY_OBJS objects"
    fi

    # Canvas save on non-existent room
    do_req PUT "/rooms/00000000-0000-0000-0000-000000000000/canvas" '{"objects":[]}' "$TOKEN_A"
    assert_code 404 "PUT /rooms/{id}/canvas — non-existent room → 404"
else
    skip "Canvas save tests — no ROOM_ID"
fi

# ═════════════════════════════════════════════════════════════════
# 8. AI — TEXT DIAGRAM
# ═════════════════════════════════════════════════════════════════
print_header "AI — Text Diagram Generation"

do_req POST "/ai/diagram" \
    "{\"prompt\":\"Microservices: API Gateway, Auth Service, User Service, PostgreSQL, Redis\"}" \
    "$TOKEN_A"
assert_code 200 "POST /ai/diagram — generate text diagram"
info "Result preview: ${BODY:0:150}…"

# ═════════════════════════════════════════════════════════════════
# 9. AI — ANALYZE SKETCH
# ═════════════════════════════════════════════════════════════════
print_header "AI — Analyze Sketch"

do_req POST "/ai/analyze" \
    "{\"prompt\":\"Analyze a whiteboard sketch of a CI/CD pipeline\"}" \
    "$TOKEN_A"
assert_code 200 "POST /ai/analyze — analyze sketch"
info "Result preview: ${BODY:0:150}…"

# ═════════════════════════════════════════════════════════════════
# 10. AI — SUGGEST EDITS
# ═════════════════════════════════════════════════════════════════
print_header "AI — Suggest Edits"

do_req POST "/ai/suggest" \
    "{\"prompt\":\"Improve my network topology diagram with three servers and a load balancer\"}" \
    "$TOKEN_A"
assert_code 200 "POST /ai/suggest — suggest edits"
info "Result preview: ${BODY:0:150}…"

# ═════════════════════════════════════════════════════════════════
# 11. AI — SVG VISUAL DIAGRAM
# ═════════════════════════════════════════════════════════════════
print_header "AI — SVG Visual Diagram (diagram-visual)"

do_req POST "/ai/diagram-visual" \
    "{\"prompt\":\"E-commerce architecture: React frontend, Node API, PostgreSQL, Stripe, S3\"}" \
    "$TOKEN_A"
assert_code 200 "POST /ai/diagram-visual — generate SVG diagram"
if echo "$BODY" | grep -q '"svg"'; then
    ok "Response contains 'svg' field"
else
    fail "Response missing 'svg' field"
fi
if echo "$BODY" | grep -q '"message"'; then
    ok "Response contains 'message' field (humanized)"
else
    fail "Response missing 'message' field"
fi
if echo "$BODY" | grep -q '"width"'; then
    ok "Response contains 'width' field"
else
    fail "Response missing 'width' field"
fi
if echo "$BODY" | grep -q '"height"'; then
    ok "Response contains 'height' field"
else
    fail "Response missing 'height' field"
fi
SVG_SNIPPET=$(echo "$BODY" | grep -o '"svg":"[^"]*' | head -c 100)
info "SVG preview: ${SVG_SNIPPET}…"
MSG_SNIPPET=$(json_val "$BODY" "message")
info "Message: ${MSG_SNIPPET:0:100}…"

# AI endpoint without auth
do_req POST "/ai/diagram" "{\"prompt\":\"test\"}"
assert_code_range 401 403 "POST /ai/diagram — no token → 401/403"

do_req POST "/ai/diagram-visual" "{\"prompt\":\"test\"}"
assert_code_range 401 403 "POST /ai/diagram-visual — no token → 401/403"

# AI with empty prompt
do_req POST "/ai/diagram" "{\"prompt\":\"\"}" "$TOKEN_A"
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -le 422 ]; then
    ok "POST /ai/diagram — empty prompt handled (HTTP $HTTP_CODE)"
else
    fail "POST /ai/diagram — empty prompt unexpected (HTTP $HTTP_CODE)"
fi

# ═════════════════════════════════════════════════════════════════
# 12. PERSISTENCE — Save & Reload end-to-end
# ═════════════════════════════════════════════════════════════════
print_header "Persistence — Save & Reload End-to-End"

if [ -n "$ROOM_ID" ]; then
    # Save a known canvas state
    PERSIST_PAYLOAD='{
        "objects": [
            {"type":"rect","x":42,"y":84,"data":{"width":200,"height":100},"color":"#3b82f6","stroke_width":2},
            {"type":"pen","x":0,"y":0,"data":{"points":[1,2,3,4,5,6,7,8]},"color":"#ffffff","stroke_width":2},
            {"type":"image","x":500,"y":100,"data":{"width":300,"height":200,"src":"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="},"color":"#fff","stroke_width":0}
        ]
    }'
    do_req PUT "/rooms/$ROOM_ID/canvas" "$PERSIST_PAYLOAD" "$TOKEN_A"
    assert_code 200 "Save 3 objects for persistence test"

    # Reload as user A
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 200 "Reload room as user A"
    if echo "$BODY" | grep -q '"rect"'; then
        ok "Persisted rect found after reload"
    else
        fail "Persisted rect NOT found after reload"
    fi
    if echo "$BODY" | grep -q '"pen"'; then
        ok "Persisted pen stroke found after reload"
    else
        fail "Persisted pen stroke NOT found after reload"
    fi
    if echo "$BODY" | grep -q '"image"'; then
        ok "Persisted image element found after reload"
    else
        fail "Persisted image element NOT found after reload"
    fi

    # Reload as user B (shared room — should also see data)
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_B"
    assert_code 200 "Reload room as user B (shared)"
    if echo "$BODY" | grep -q '"rect"'; then
        ok "User B sees persisted data in shared room"
    else
        fail "User B cannot see persisted data in shared room"
    fi
else
    skip "Persistence tests — no ROOM_ID"
fi

# ═════════════════════════════════════════════════════════════════
# 13. EDGE CASES & ERROR HANDLING
# ═════════════════════════════════════════════════════════════════
print_header "Edge Cases & Error Handling"

# Invalid JSON body
raw=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN_A" \
    -d "this is not json" \
    "${BASE_URL}/rooms/" 2>/dev/null)
ec=$(echo "$raw" | tail -n1)
if [ "$ec" = "422" ] || [ "$ec" = "400" ]; then
    ok "POST /rooms/ — invalid JSON → $ec"
else
    fail "POST /rooms/ — invalid JSON (expected 422/400, got $ec)"
fi

# Missing required field
do_req POST "/rooms/" "{}" "$TOKEN_A"
assert_code 422 "POST /rooms/ — missing 'name' field → 422"

# Expired / garbage token
do_req GET "/rooms/" "" "garbage.token.here"
assert_code_range 401 403 "GET /rooms/ — garbage token → 401/403"

# Very long room name
LONG_NAME=$(python3 -c "print('A'*500)" 2>/dev/null || echo "AAAAAAAAAAAAAAAAAAAA")
do_req POST "/rooms/" "{\"name\":\"$LONG_NAME\"}" "$TOKEN_A"
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -le 422 ]; then
    ok "POST /rooms/ — very long name handled (HTTP $HTTP_CODE)"
    # Cleanup if created
    LONG_ROOM_ID=$(json_val "$BODY" "id")
    if [ -n "$LONG_ROOM_ID" ]; then
        do_req DELETE "/rooms/$LONG_ROOM_ID" "" "$TOKEN_A"
    fi
else
    fail "POST /rooms/ — very long name unexpected (HTTP $HTTP_CODE)"
fi

# Object with zero dimensions
if [ -n "$ROOM_ID" ]; then
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"rect\",\"x\":0,\"y\":0,\"data\":{\"width\":0,\"height\":0},\"color\":\"#000\",\"stroke_width\":0}" \
        "$TOKEN_A"
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -le 422 ]; then
        ok "POST objects — zero-size object handled (HTTP $HTTP_CODE)"
    else
        fail "POST objects — zero-size object unexpected (HTTP $HTTP_CODE)"
    fi

    # Negative coordinates
    do_req POST "/rooms/$ROOM_ID/objects" \
        "{\"type\":\"rect\",\"x\":-100,\"y\":-200,\"data\":{\"width\":50,\"height\":50},\"color\":\"#000\",\"stroke_width\":1}" \
        "$TOKEN_A"
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -le 422 ]; then
        ok "POST objects — negative coords handled (HTTP $HTTP_CODE)"
    else
        fail "POST objects — negative coords unexpected (HTTP $HTTP_CODE)"
    fi
fi

# 404 on unknown route
do_req GET "/nonexistent-route"
assert_code_range 404 405 "GET /nonexistent-route → 404/405"

# ═════════════════════════════════════════════════════════════════
# 14. CLEANUP
# ═════════════════════════════════════════════════════════════════
print_header "Cleanup"

if [ -n "$ROOM_ID" ]; then
    do_req DELETE "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 200 "DELETE /rooms/{id} — delete test room"
fi

if [ -n "$ROOM_ID_2" ]; then
    do_req DELETE "/rooms/$ROOM_ID_2" "" "$TOKEN_A"
    assert_code 200 "DELETE /rooms/{id} — delete second test room"
fi

# Verify deleted room is gone
if [ -n "$ROOM_ID" ]; then
    do_req GET "/rooms/$ROOM_ID" "" "$TOKEN_A"
    assert_code 404 "GET /rooms/{id} — deleted room → 404"
fi

# ═════════════════════════════════════════════════════════════════
# SUMMARY
# ═════════════════════════════════════════════════════════════════
TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                   TEST SUMMARY${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Passed : $PASS${NC}"
echo -e "  ${RED}Failed : $FAIL${NC}"
echo -e "  ${DIM}Skipped: $SKIP${NC}"
echo -e "  Total  : $TOTAL"
echo ""
if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}🎉  ALL TESTS PASSED!${NC}"
    echo ""
    exit 0
else
    echo -e "  ${RED}⚠  $FAIL test(s) failed — review output above${NC}"
    echo ""
    exit 1
fi
