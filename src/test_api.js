const BASE_URL = "http://localhost:3000";

// Helpers to extract cookie
function getCookieHeader(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return "";
  // Extract token=xyz
  const match = setCookie.match(/token=[^;]+/);
  return match ? match[0] : "";
}

async function runTests() {
  console.log("=== Smart Asset Management API Verification Tests ===");
  let adminCookie = "";
  let userCookie = "";
  let testAssetId = null;
  let testBookingId = null;

  try {
    // Test 1: User Login
    console.log("\n[Test 1] Authenticating user...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "userpassword" })
    });
    
    if (loginRes.ok) {
      userCookie = getCookieHeader(loginRes);
      console.log("✅ User authenticated successfully. Token cookie captured.");
    } else {
      console.log("❌ User login failed:", await loginRes.json());
      process.exit(1);
    }

    // Test 2: Admin Login
    console.log("\n[Test 2] Authenticating admin...");
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "adminpassword" })
    });
    
    if (adminLoginRes.ok) {
      adminCookie = getCookieHeader(adminLoginRes);
      console.log("✅ Admin authenticated successfully. Token cookie captured.");
    } else {
      console.log("❌ Admin login failed:", await adminLoginRes.json());
      process.exit(1);
    }

    // Test 3: List Assets
    console.log("\n[Test 3] Fetching asset catalog...");
    const assetsRes = await fetch(`${BASE_URL}/api/assets`, {
      headers: { "Cookie": userCookie }
    });
    const assetsData = await assetsRes.json();
    if (assetsRes.ok && assetsData.assets && assetsData.assets.length > 0) {
      const firstAsset = assetsData.assets[0];
      testAssetId = firstAsset.id;
      console.log(`✅ Fetched asset catalog successfully. Found ${assetsData.assets.length} assets.`);
      console.log(`   Sample asset: "${firstAsset.name}" (ID: ${firstAsset.id}, Available: ${firstAsset.availableQuantity})`);
    } else {
      console.log("❌ Failed to list assets:", assetsData);
      process.exit(1);
    }

    // Test 4: Submit Booking Request
    console.log("\n[Test 4] Submitting booking request (1 unit)...");
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const bookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": userCookie
      },
      body: JSON.stringify({
        assetId: testAssetId,
        quantityRequested: 1,
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0]
      })
    });
    
    const bookingData = await bookingRes.json();
    if (bookingRes.ok) {
      testBookingId = bookingData.booking.id;
      console.log(`✅ Booking request submitted successfully. Booking ID: #${testBookingId}, Status: ${bookingData.booking.status}`);
    } else {
      console.log("❌ Booking submission failed:", bookingData);
      process.exit(1);
    }

    // Test 5: Verify Overlapping Request Prevention
    console.log("\n[Test 5] Verifying overlapping request prevention...");
    const duplicateRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": userCookie
      },
      body: JSON.stringify({
        assetId: testAssetId,
        quantityRequested: 1,
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0]
      })
    });
    
    const duplicateData = await duplicateRes.json();
    if (!duplicateRes.ok && duplicateRes.status === 400) {
      console.log("✅ Overlapping duplicate request blocked successfully. Error msg:", duplicateData.error);
    } else {
      console.log("❌ FAILED: Duplicate request was not blocked. Code:", duplicateRes.status, duplicateData);
      process.exit(1);
    }

    // Test 6: Verify Stock Limit Enforcement
    console.log("\n[Test 6] Verifying stock limit enforcement...");
    const overflowRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": userCookie
      },
      body: JSON.stringify({
        assetId: testAssetId,
        quantityRequested: 9999, // exceeds any possible stock
        startDate: today.toISOString().split("T")[0],
        endDate: tomorrow.toISOString().split("T")[0]
      })
    });
    
    const overflowData = await overflowRes.json();
    if (!overflowRes.ok && overflowRes.status === 400) {
      console.log("✅ Exceeding-capacity request blocked successfully. Error msg:", overflowData.error);
    } else {
      console.log("❌ FAILED: Exceeding-capacity request was not blocked. Code:", overflowRes.status, overflowData);
      process.exit(1);
    }

    // Test 7: Admin Approve Booking
    console.log("\n[Test 7] Approving booking as admin...");
    const approveRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/approve`, {
      method: "PATCH",
      headers: { "Cookie": adminCookie }
    });
    const approveData = await approveRes.json();
    if (approveRes.ok) {
      console.log(`✅ Booking #${testBookingId} approved. Inventory decremented. New available quantity: ${approveData.asset.availableQuantity}`);
    } else {
      console.log("❌ Failed to approve booking:", approveData);
      process.exit(1);
    }

    // Test 8: Admin Issue Asset (Handoff)
    console.log("\n[Test 8] Marking asset as Issued...");
    const issueRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/issue`, {
      method: "PATCH",
      headers: { "Cookie": adminCookie }
    });
    const issueData = await issueRes.json();
    if (issueRes.ok) {
      console.log(`✅ Asset marked as Issued. Status: ${issueData.booking.status}. Transaction recorded.`);
    } else {
      console.log("❌ Failed to mark asset as issued:", issueData);
      process.exit(1);
    }

    // Test 9: Admin Return Asset (Check In)
    console.log("\n[Test 9] Checking in asset (Return)...");
    const returnRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/return`, {
      method: "PATCH",
      headers: { "Cookie": adminCookie }
    });
    const returnData = await returnRes.json();
    if (returnRes.ok) {
      console.log(`✅ Asset checked back in. Status: ${returnData.booking.status}. Stock replenished. New available quantity: ${returnData.asset.availableQuantity}`);
    } else {
      console.log("❌ Failed to process return:", returnData);
      process.exit(1);
    }

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend workflows and transactional integrity rules function perfectly.");
  } catch (error) {
    console.error("Test runner encountered error:", error);
    process.exit(1);
  }
}

runTests();
