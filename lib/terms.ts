import { Prisma, PrismaClient, TermUserRole } from "@prisma/client";

export const ACTIVE_TERM_KEY = "ACTIVE_TERM";

export type TermUserInput = {
  userId: string;
  role: TermUserRole;
};

export type CreateTermInput = {
  name: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  users?: TermUserInput[];
};

type TxClient = Prisma.TransactionClient;

export function normalizeCreateTermInput(body: unknown): CreateTermInput {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be an object.");
  }

  const payload = body as {
    name?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    isActive?: unknown;
    users?: unknown;
  };

  const name =
    typeof payload.name === "string" ? payload.name.trim() : "";
  if (!name) {
    throw new Error("Term name is required.");
  }

  const startDate = new Date(String(payload.startDate || ""));
  const endDate = new Date(String(payload.endDate || ""));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("startDate and endDate must be valid ISO date values.");
  }
  if (startDate >= endDate) {
    throw new Error("startDate must be before endDate.");
  }

  const users: TermUserInput[] = Array.isArray(payload.users)
    ? payload.users.map((item) => {
        if (!item || typeof item !== "object") {
          throw new Error("Each users item must be an object.");
        }
        const parsed = item as { userId?: unknown; role?: unknown };
        const userId =
          typeof parsed.userId === "string" ? parsed.userId.trim() : "";
        if (!userId) {
          throw new Error("Each users item must include userId.");
        }
        const role = parsed.role;
        if (
          role !== TermUserRole.ADMIN &&
          role !== TermUserRole.MEMBER &&
          role !== TermUserRole.VISITOR
        ) {
          throw new Error("Each users item must include a valid role.");
        }
        return { userId, role };
      })
    : [];

  const uniqueUsers = new Map<string, TermUserInput>();
  for (const user of users) {
    uniqueUsers.set(user.userId, user);
  }

  return {
    name,
    startDate,
    endDate,
    isActive: Boolean(payload.isActive),
    users: Array.from(uniqueUsers.values()),
  };
}

export async function createTermWithTransaction(
  prisma: PrismaClient,
  input: CreateTermInput
) {
  return prisma.$transaction(
    async (tx) => {
      if (input.isActive) {
        await deactivateAllTerms(tx);
      }

      const created = await tx.term.create({
        data: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: Boolean(input.isActive),
          activeKey: input.isActive ? ACTIVE_TERM_KEY : null,
          termUsers: input.users?.length
            ? {
                create: input.users.map((user) => ({
                  role: user.role,
                  user: {
                    connect: {
                      id: user.userId,
                    },
                  },
                })),
              }
            : undefined,
        },
        include: {
          termUsers: true,
        },
      });

      return created;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

export async function activateTermWithTransaction(
  prisma: PrismaClient,
  termId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const term = await tx.term.findUnique({
        where: { id: termId },
      });

      if (!term) {
        return null;
      }

      await deactivateAllTerms(tx);

      const activated = await tx.term.update({
        where: { id: termId },
        data: {
          isActive: true,
          activeKey: ACTIVE_TERM_KEY,
        },
        include: {
          termUsers: true,
        },
      });

      return activated;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

async function deactivateAllTerms(tx: TxClient) {
  await tx.term.updateMany({
    where: {
      isActive: true,
    },
    data: {
      isActive: false,
      activeKey: null,
    },
  });
}
