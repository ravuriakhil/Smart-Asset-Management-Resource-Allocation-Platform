import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function PATCH(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { id } = await params;
    const bookingId = parseInt(id);
    const { rejectionReason } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { asset: true }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "Pending") {
      return NextResponse.json({ error: "Only pending bookings can be rejected" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "Rejected",
          rejectionReason: rejectionReason || "No reason specified"
        }
      });

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: "booking_status",
          message: `Your booking request for "${booking.asset.name}" has been rejected. Reason: ${rejectionReason || "No reason specified"}`
        }
      });

      return updatedBooking;
    });

    await logAction(user.id, "REJECT_BOOKING", "Booking", bookingId, {
      assetId: booking.asset.id,
      rejectionReason: rejectionReason || "No reason specified"
    });

    return NextResponse.json({
      message: "Booking rejected successfully",
      booking: result
    });
  } catch (error) {
    console.error("PATCH reject booking error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
