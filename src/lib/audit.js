import { prisma } from "@/lib/db";

export async function logAction(actorId, action, entityType, entityId, metadata) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata: JSON.stringify(metadata || {}),
      },
    });
  } catch (error) {
    console.error("Audit log creation failed:", error);
  }
}
