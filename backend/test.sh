#!/bin/bash

# LUMO API Endpoint Testing Script
# Tests all available endpoints with proper authentication flow

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${API_URL:-https://lumo-api-m7w6.onrender.com}"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Test User"

# Variables to store during testing
TOKEN=""
USER_ID=""
ROOM_ID=""
OBJECT_ID=""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
print_header() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local auth_required=${5:-false}
    
    echo "Testing: $description"
    
    local headers="Content-Type: application/json"
    if [ "$auth_required" = true ] && [ -n "$TOKEN" ]; then
        headers="$headers\nAuthorization: Bearer $TOKEN"
    fi
    
    if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
        if [ "$auth_required" = true ] && [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Authorization: Bearer $TOKEN" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
        fi
    else
        if [ "$auth_required" = true ] && [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data" \
                "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$BASE_URL$endpoint")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Response Code: $http_code"
    echo "Response Body: $body" | head -c 200
    echo ""
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        print_success "$description"
        echo "$body"
    else
        print_error "$description (HTTP $http_code)"
        echo ""
    fi
}

# Start testing
clear
print_header "LUMO API TESTING SUITE"
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# ==========================================
# 1. HEALTH & ROOT ENDPOINTS
# ==========================================
print_header "1. Testing Health & Root Endpoints"

response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
if [ "$http_code" = "200" ]; then
    print_success "GET / - Root endpoint"
    echo "$body"
else
    print_error "GET / - Root endpoint (HTTP $http_code)"
fi
echo ""

response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    print_success "GET /health - Health check"
else
    print_error "GET /health - Health check (HTTP $http_code)"
fi
echo ""

# ==========================================
# 2. AUTHENTICATION ENDPOINTS
# ==========================================
print_header "2. Testing Authentication Endpoints"

# Register
echo "Testing: POST /auth/register"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
    "$BASE_URL/auth/register")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body"
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /auth/register - User registration"
    USER_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "User ID: $USER_ID"
else
    print_error "POST /auth/register - User registration (HTTP $http_code)"
fi
echo ""

# Login
echo "Testing: POST /auth/login"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "$BASE_URL/auth/login")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body"
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /auth/login - User login"
    TOKEN=$(echo "$body" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:50}..."
else
    print_error "POST /auth/login - User login (HTTP $http_code)"
fi
echo ""

# Get current user
echo "Testing: GET /auth/me"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/auth/me")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body"
echo ""
if [ "$http_code" = "200" ]; then
    print_success "GET /auth/me - Get current user"
else
    print_error "GET /auth/me - Get current user (HTTP $http_code)"
fi
echo ""

# Logout
echo "Testing: POST /auth/logout"
response=$(curl -s -w "\n%{http_code}" -X POST \
    "$BASE_URL/auth/logout")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    print_success "POST /auth/logout - User logout"
else
    print_error "POST /auth/logout - User logout (HTTP $http_code)"
fi
echo ""

# ==========================================
# 3. ROOM ENDPOINTS
# ==========================================
print_header "3. Testing Room Endpoints"

# Create room
echo "Testing: POST /rooms/ - Create room"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"name\":\"Test Room $(date +%s)\"}" \
    "$BASE_URL/rooms/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body"
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /rooms/ - Create room"
    ROOM_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Room ID: $ROOM_ID"
else
    print_error "POST /rooms/ - Create room (HTTP $http_code)"
fi
echo ""

# Get all rooms
echo "Testing: GET /rooms/ - Get all rooms"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/rooms/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body" | head -c 200
echo ""
if [ "$http_code" = "200" ]; then
    print_success "GET /rooms/ - Get all rooms"
else
    print_error "GET /rooms/ - Get all rooms (HTTP $http_code)"
fi
echo ""

# Get specific room
if [ -n "$ROOM_ID" ]; then
    echo "Testing: GET /rooms/{room_id} - Get specific room"
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/rooms/$ROOM_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body" | head -c 200
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "GET /rooms/{room_id} - Get specific room"
    else
        print_error "GET /rooms/{room_id} - Get specific room (HTTP $http_code)"
    fi
    echo ""
fi

# Update room
if [ -n "$ROOM_ID" ]; then
    echo "Testing: PUT /rooms/{room_id} - Update room"
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"name\":\"Updated Room $(date +%s)\"}" \
        "$BASE_URL/rooms/$ROOM_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body" | head -c 200
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "PUT /rooms/{room_id} - Update room"
    else
        print_error "PUT /rooms/{room_id} - Update room (HTTP $http_code)"
    fi
    echo ""
fi

# ==========================================
# 4. DRAWING OBJECT ENDPOINTS
# ==========================================
print_header "4. Testing Drawing Object Endpoints"

# Add object to room
if [ -n "$ROOM_ID" ]; then
    echo "Testing: POST /rooms/{room_id}/objects - Add object"
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"type\":\"rectangle\",\"x\":100,\"y\":100,\"data\":{\"width\":50,\"height\":30},\"color\":\"#000000\",\"stroke_width\":2}" \
        "$BASE_URL/rooms/$ROOM_ID/objects")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body" | head -c 200
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "POST /rooms/{room_id}/objects - Add object"
        OBJECT_ID=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "Object ID: $OBJECT_ID"
    else
        print_error "POST /rooms/{room_id}/objects - Add object (HTTP $http_code)"
    fi
    echo ""
fi

# Update object
if [ -n "$ROOM_ID" ] && [ -n "$OBJECT_ID" ]; then
    echo "Testing: PUT /rooms/{room_id}/objects/{object_id} - Update object"
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"type\":\"rectangle\",\"x\":150,\"y\":150,\"data\":{\"width\":60,\"height\":40},\"color\":\"#FF0000\",\"stroke_width\":3}" \
        "$BASE_URL/rooms/$ROOM_ID/objects/$OBJECT_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body" | head -c 200
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "PUT /rooms/{room_id}/objects/{object_id} - Update object"
    else
        print_error "PUT /rooms/{room_id}/objects/{object_id} - Update object (HTTP $http_code)"
    fi
    echo ""
fi

# Delete object
if [ -n "$ROOM_ID" ] && [ -n "$OBJECT_ID" ]; then
    echo "Testing: DELETE /rooms/{room_id}/objects/{object_id} - Delete object"
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/rooms/$ROOM_ID/objects/$OBJECT_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body"
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "DELETE /rooms/{room_id}/objects/{object_id} - Delete object"
    else
        print_error "DELETE /rooms/{room_id}/objects/{object_id} - Delete object (HTTP $http_code)"
    fi
    echo ""
fi

# ==========================================
# 5. AI ENDPOINTS
# ==========================================
print_header "5. Testing AI Endpoints"

# Generate diagram
echo "Testing: POST /ai/diagram - Generate diagram"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"prompt\":\"Create a simple flowchart for user authentication\"}" \
    "$BASE_URL/ai/diagram")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body" | head -c 300
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /ai/diagram - Generate diagram"
else
    print_error "POST /ai/diagram - Generate diagram (HTTP $http_code)"
fi
echo ""

# Analyze sketch
echo "Testing: POST /ai/analyze - Analyze sketch"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"prompt\":\"Analyze this diagram structure\"}" \
    "$BASE_URL/ai/analyze")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body" | head -c 300
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /ai/analyze - Analyze sketch"
else
    print_error "POST /ai/analyze - Analyze sketch (HTTP $http_code)"
fi
echo ""

# Suggest edits
echo "Testing: POST /ai/suggest - Suggest edits"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"prompt\":\"Suggest improvements for my workflow diagram\"}" \
    "$BASE_URL/ai/suggest")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
echo "Response Code: $http_code"
echo "Response: $body" | head -c 300
echo ""
if [ "$http_code" = "200" ]; then
    print_success "POST /ai/suggest - Suggest edits"
else
    print_error "POST /ai/suggest - Suggest edits (HTTP $http_code)"
fi
echo ""

# ==========================================
# 6. CLEANUP - Delete room
# ==========================================
print_header "6. Cleanup"

if [ -n "$ROOM_ID" ]; then
    echo "Testing: DELETE /rooms/{room_id} - Delete room"
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/rooms/$ROOM_ID")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    echo "Response Code: $http_code"
    echo "Response: $body"
    echo ""
    if [ "$http_code" = "200" ]; then
        print_success "DELETE /rooms/{room_id} - Delete room"
    else
        print_error "DELETE /rooms/{room_id} - Delete room (HTTP $http_code)"
    fi
    echo ""
fi

# ==========================================
# FINAL SUMMARY
# ==========================================
print_header "TEST SUMMARY"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi
