"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmModal from "@/components/admin/ConfirmModal";
import CredentialsTable, {
  type GeneratedCredential,
} from "@/components/admin/CredentialsTable";
import FileUpload from "@/components/admin/FileUpload";
import PreviewTable, { type PreviewRow } from "@/components/admin/PreviewTable";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type ActiveTerm = {
  id?: number;
  name?: string;
  isActive?: boolean;
} | null;

type ActiveTermResponse =
  | ActiveTerm
  | {
      success?: boolean;
      data?: ActiveTerm;
      message?: string;
    }
  | null;

function parseActiveTerm(response: ActiveTermResponse) {
  if (!response) {
    return null;
  }

  if ("data" in response) {
    return response.data ?? null;
  }

  return response;
}

function parseWorkbook(file: File) {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error("No worksheet found in the uploaded file.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    return rows;
  });
}

export default function TermsPage() {
  const [termName, setTermName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [credentials, setCredentials] = useState<GeneratedCredential[]>([]);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasRequiredColumns = useMemo(() => {
    if (previewRows.length === 0) {
      return true;
    }

    return previewRows.every((row) => "Name" in row.raw && "Role" in row.raw);
  }, [previewRows]);

  const hasInvalidRows = previewRows.some((row) => !row.isValid);

  useEffect(() => {
    async function fetchActiveTerm() {
      try {
        const response = await fetch("/api/terms/active", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as ActiveTermResponse;
        setActiveTerm(parseActiveTerm(result));
      } catch {
        setActiveTerm(null);
      }
    }

    void fetchActiveTerm();
  }, []);

  async function handleFileSelect(nextFile: File | null) {
    setFile(nextFile);
    setPreviewRows([]);
    setCredentials([]);
    setError("");
    setSuccessMessage("");

    if (!nextFile) {
      return;
    }

    setIsParsing(true);

    try {
      const rows = await parseWorkbook(nextFile);
      const parsedRows: PreviewRow[] = rows.map((row, index) => {
        const name = String(row.Name ?? "").trim();
        const role = String(row.Role ?? "").trim();

        return {
          id: index + 1,
          name,
          role,
          isValid: Boolean(name && role),
          raw: row,
        };
      });

      if (
        parsedRows.length > 0 &&
        !("Name" in parsedRows[0].raw && "Role" in parsedRows[0].raw)
      ) {
        setError("The uploaded file must include Name and Role columns.");
      }

      setPreviewRows(parsedRows);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Failed to parse the uploaded file."
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handleImport() {
    if (isSubmitting) {
      return;
    }

    if (!termName.trim()) {
      setError("Term name is required.");
      return;
    }

    if (!file) {
      setError("Please upload an Excel file.");
      return;
    }

    if (!hasRequiredColumns) {
      setError("The uploaded file must include Name and Role columns.");
      return;
    }

    if (previewRows.length === 0 || hasInvalidRows) {
      setError("Please fix invalid rows before importing.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("termName", termName.trim());
      formData.append("file", file);

      const response = await fetch("/api/terms/import", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as
        | GeneratedCredential[]
        | { message?: string };

      if (!response.ok) {
        setError(
          "message" in result && result.message
            ? result.message
            : "Import failed"
        );
        return;
      }

      setCredentials(result as GeneratedCredential[]);
      setSuccessMessage("Term imported successfully.");
      setFile(null);
      setPreviewRows([]);
      setActiveTerm({
        name: termName.trim(),
        isActive: true,
      });
    } catch {
      setError("Import failed");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }

  async function handleSubmitClick() {
    if (!termName.trim()) {
      setError("Term name is required.");
      return;
    }

    if (!file) {
      setError("Please upload an Excel file.");
      return;
    }

    if (!hasRequiredColumns) {
      setError("The uploaded file must include Name and Role columns.");
      return;
    }

    if (previewRows.length === 0 || hasInvalidRows) {
      setError("Please fix invalid rows before importing.");
      return;
    }

    try {
      const response = await fetch("/api/terms/active", {
        cache: "no-store",
      });

      if (!response.ok) {
        await handleImport();
        return;
      }

      const result = (await response.json()) as ActiveTermResponse;
      const currentActiveTerm = parseActiveTerm(result);
      setActiveTerm(currentActiveTerm);

      if (currentActiveTerm?.isActive) {
        setShowConfirm(true);
        return;
      }

      await handleImport();
    } catch {
      await handleImport();
    }
  }

  function handleDownloadCredentials() {
    if (credentials.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(credentials);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");
    XLSX.writeFile(workbook, "term-credentials.xlsx");
  }

  function handleDownloadTemplate() {
    const worksheet = XLSX.utils.aoa_to_sheet([["Name", "Role"]]);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "term-import-template.xlsx");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Management"
        description="Create a term, upload member data, preview records, and generate credentials."
      />

      <p className="text-sm text-slate-500">
        Active Term: {activeTerm?.name || "None"}
      </p>

      <Card>
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-2">
              <label
                htmlFor="termName"
                className="text-sm font-medium text-slate-700"
              >
                Term Name
              </label>
              <Input
                id="termName"
                value={termName}
                onChange={(event) => setTermName(event.target.value)}
                placeholder="Enter term name"
              />
            </div>

            <FileUpload
              file={file}
              isLoading={isParsing}
              onFileSelect={(nextFile) => {
                void handleFileSelect(nextFile);
              }}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {hasInvalidRows ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Some rows are invalid. Name and Role are required before import.
            </div>
          ) : null}

          <PreviewTable
            rows={previewRows}
            hasRequiredColumns={hasRequiredColumns}
            isLoading={isParsing}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
            <Button
              onClick={() => void handleSubmitClick()}
              disabled={
                isSubmitting ||
                isParsing ||
                !termName.trim() ||
                !file ||
                previewRows.length === 0
              }
            >
              {isSubmitting ? "Importing..." : "Submit Import"}
            </Button>
          </div>
        </div>
      </Card>

      {credentials.length > 0 ? (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Generated Credentials
                </h2>
                <p className="text-sm text-slate-500">
                  These credentials are shown once after import.
                </p>
              </div>

              <Button onClick={handleDownloadCredentials}>
                Download Excel
              </Button>
            </div>

            <CredentialsTable rows={credentials} />
          </div>
        </Card>
      ) : null}

      <ConfirmModal
        isOpen={showConfirm}
        title="Replace Active Term?"
        description="An active term already exists. Creating a new term will deactivate the current term. Do you want to continue?"
        confirmLabel={isSubmitting ? "Processing..." : "Continue"}
        cancelLabel="Cancel"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => void handleImport()}
        isLoading={isSubmitting}
      />
    </div>
  );
}
