import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const ttlDays = Number(process.env.RAW_LLM_AUDIT_TTL_DAYS ?? '180');

async function main() {
  if (!Number.isFinite(ttlDays) || ttlDays < 1) {
    throw new Error('RAW_LLM_AUDIT_TTL_DAYS must be a positive integer');
  }

  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - Math.trunc(ttlDays));

  const result = await prisma.invoiceProcessing.updateMany({
    where: {
      createdAt: {
        lte: cutoffDate,
      },
    },
    data: {
      rawLlmJson: Prisma.DbNull,
      redactedLlmJson: Prisma.DbNull,
    },
  });

  process.stdout.write(
    `[retention] purged ${result.count} InvoiceProcessing audit record(s) older than ${ttlDays} day(s)\n`,
  );
}

main()
  .catch((error) => {
    process.stderr.write(
      `[retention] purge failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
