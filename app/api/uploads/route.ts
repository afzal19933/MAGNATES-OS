import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const allowedMimeTypes = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

const allowedExtensions = new Set(["xls", "xlsx", "png", "jpg", "jpeg"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({
        success: false,
        message: "File is required",
      });
    }

    const fileName = fileEntry.name.trim();
    const extension = fileName.includes(".")
      ? fileName.split(".").pop()?.toLowerCase()
      : undefined;

    if (!extension || !allowedExtensions.has(extension)) {
      return NextResponse.json({
        success: false,
        message: "Invalid file type",
      });
    }

    if (!allowedMimeTypes.has(fileEntry.type)) {
      return NextResponse.json({
        success: false,
        message: "Invalid file type",
      });
    }

    const isExcelFile = extension === "xls" || extension === "xlsx";
    let detectedType = "UNKNOWN";
    let rows: Record<string, unknown>[] = [];

    if (isExcelFile) {
      const fileBuffer = await fileEntry.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (firstSheetName) {
        const firstSheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
        const headers = Object.keys(rows[0] || {});

        if (headers.includes("Referral")) {
          detectedType = "REFERRAL";
        } else if (
          headers.includes("1-2-1") ||
          headers.includes("One to One")
        ) {
          detectedType = "ONE_TO_ONE";
        } else if (headers.includes("TYFCB")) {
          detectedType = "TYFCB";
        }

      }
    }

    const fileUrl = `/uploads/${fileName}`;

    const upload = await prisma.upload.create({
      data: {
        fileUrl,
        fileType: fileEntry.type,
        detectedType,
      },
    });

    if (detectedType === "REFERRAL") {
      const members = await prisma.member.findMany();

      function normalize(name: string) {
        return name.trim().toLowerCase();
      }

      function findMemberId(name: string) {
        const normalized = normalize(name);

        return members.find((m) =>
          normalize(m.name).includes(normalized) ||
          normalized.includes(normalize(m.name))
        )?.id;
      }

      for (const row of rows) {
        const fromName = String(row["From"] || "");
        const toName = String(row["To"] || "");
        const description = String(row["Referral"] || "");
        const insideOutside = String(row["Inside/Outside"] || "");
        const detail = String(row["Detail"] || "");
        const sourceType = insideOutside.toLowerCase().includes("outside")
          ? "OUTSIDE"
          : "INSIDE";
        const chapterType = detail
          ? detail.toLowerCase().includes("magnates")
            ? "SAME_CHAPTER"
            : "CROSS_CHAPTER"
          : "SAME_CHAPTER";
        const fromMemberId = findMemberId(fromName);
        const toMemberId = findMemberId(toName);

        if (!fromName || !toName) continue;

        await prisma.referral.create({
          data: {
            fromName,
            toName,
            description,
            sourceType,
            chapterType,
            fromMemberId,
            toMemberId,
            uploadId: upload.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: upload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}
