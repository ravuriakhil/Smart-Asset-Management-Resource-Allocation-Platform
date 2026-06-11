import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAction } from "@/lib/audit";

// Helper to update overdue bookings
export async function updateOverdueBookings() {
  try {
    const now = new Date();
    await prisma.booking.updateMany({
      where: {
        status: "Issued",
        dueDate: { lt: now }
      },
      data: {
        status: "Overdue"
      }
    });
  } catch (error) {
    console.error("Error auto-updating overdue bookings:", error);
  }
}

// GET /api/bookings
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-sync overdue bookings first
    await updateOverdueBookings();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = {};
    if (user.role !== "admin") {
      where.userId = user.id; // Users only see their own bookings
    }
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        asset: {
          include: { category: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { assetId, quantityRequested, startDate, endDate } = await request.json();

    if (!assetId || !quantityRequested || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedAssetId = parseInt(assetId);
    const parsedQuantity = parseInt(quantityRequested);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Basic date validations
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (start > end) {
      return NextResponse.json({ error: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return NextResponse.json({ error: "Start date cannot be in the past" }, { status: 400 });
    }

    if (parsedQuantity <= 0) {
      return NextResponse.json({ error: "Quantity requested must be greater than zero" }, { status: 400 });
    }

    // Fetch asset details
    const asset = await prisma.asset.findUnique({
      where: { id: parsedAssetId }
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status === "Unavailable" || asset.status === "Under Maintenance") {
      return NextResponse.json({
        error: `This asset is currently ${asset.status} and cannot be booked.`
      }, { status: 400 });
    }

    // FR-03.5: Reject booking if requested quantity exceeds available quantity
    if (parsedQuantity > asset.availableQuantity) {
      return NextResponse.json({
        error: `Requested quantity (${parsedQuantity}) exceeds currently available quantity (${asset.availableQuantity}).`
      }, { status: 400 });
    }

    // FR-03.6: Duplicate Prevention
    // Check if the user already has a pending booking request that overlaps with this request's time frame
    const overlappingPending = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        assetId: parsedAssetId,
        status: "Pending",
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start }
          }
        ]
      }
    });

    if (overlappingPending) {
      return NextResponse.json({
        error: "You already have a pending booking request for this asset that overlaps with the requested time period."
      }, { status: 400 });
    }

    // Create booking (status = Pending, available quantity NOT decremented yet)
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        assetId: parsedAssetId,
        quantityRequested: parsedQuantity,
        startDate: start,
        endDate: end,
        dueDate: end, // Due date is initially set to the end date of the booking
        status: "Pending"
      },
      include: {
        asset: true
      }
    });

    await logAction(user.id, "CREATE_BOOKING", "Booking", booking.id, {
      assetName: asset.name,
      quantityRequested: parsedQuantity
    });

    return NextResponse.json({ message: "Booking request submitted successfully", booking }, { status: 201 });
  } catch (error) {
    console.error("POST booking error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
