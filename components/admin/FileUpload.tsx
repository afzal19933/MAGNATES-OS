"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import Button from "@/components/ui/Button";

type FileUploadProps = {
  file: File | null;
  isLoading: boolean;
  onFileSelect: (file: File | null) => void;
};

export default function FileUpload({
  file,
  isLoading,
  onFileSelect,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");

  function handleFiles(selectedFile: File | null) {
    if (!selectedFile) {
      setFileError("");
      onFileSelect(null);
      return;
    }

    const fileName = selectedFile.name.toLowerCase();
    const isExcelFile =
      fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isExcelFile) {
      setFileError("Only .xlsx or .xls files are allowed");
      onFileSelect(null);
      return;
    }

    setFileError("");
    onFileSelect(selectedFile);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-[156px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition ${
          isDragging
            ? "border-slate-900 bg-slate-100"
            : "border-slate-300 bg-slate-50"
        }`}
      >
        <p className="text-sm font-medium text-slate-900">
          Drag and drop your Excel file
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Accepts `.xlsx` and `.xls` files
        </p>
        <div className="mt-4">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            {file ? "Re-upload File" : "Choose File"}
          </Button>
        </div>
        {file ? (
          <p className="mt-3 text-sm text-slate-600">{file.name}</p>
        ) : null}
        {isLoading ? (
          <p className="mt-2 text-sm text-slate-500">Parsing file...</p>
        ) : null}
      </div>

      {fileError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {fileError}
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
