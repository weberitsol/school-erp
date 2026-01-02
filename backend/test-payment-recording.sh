#!/bin/bash

echo "=== PAYMENT RECORDING ENDPOINT TEST ==="
echo ""

# Get token
echo "1️⃣ Getting auth token..."
TOKEN=$(curl -s -X POST "http://localhost:5000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@weberacademy.edu","password":"admin123"}' | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test recording a payment
echo "2️⃣ Recording payment..."
echo ""
echo "Request:"
echo '  POST /api/v1/fees/payments'
echo '  Student ID: be0ff7be-d10d-45c9-8395-b46717152553'
echo '  Fee Structure ID: 2e90e0ad-b502-48a4-beb9-594658483aeb'
echo '  Amount: 2500'
echo '  Payment Method: CASH'
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5000/api/v1/fees/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId":"be0ff7be-d10d-45c9-8395-b46717152553",
    "feeStructureId":"2e90e0ad-b502-48a4-beb9-594658483aeb",
    "amount":2500,
    "paymentMethod":"CASH"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "Response Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | head -500
echo ""
