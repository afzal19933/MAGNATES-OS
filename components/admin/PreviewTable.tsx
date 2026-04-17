"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export type PreviewRow = {
  id: number;
  name: string;
  role: string;
  isValid: boolean;
  raw: Record<string, unknown>;
};

type PreviewTableProps = {
  rows: PreviewRow[];
  hasRequiredColumns: boolean;
  isLoading: boolean;
};

export default function PreviewTable({
  rows,
  hasRequiredColumns,
  isLoading,
}: PreviewTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        row.name.toLowerCase().includes(query) ||
        row.role.toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery]);

  return (
    <Card className="p-0">
      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Preview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the parsed rows before importing.
            </p>
          </div>

          <div className="w-full md:w-72">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search name or role..."
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Generating preview...</p>
        ) : !hasRequiredColumns ? (
          <p className="text-sm text-rose-600">
            Missing required columns: Name and Role.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            Upload an Excel file to preview member rows.
          </p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-slate-500">No matching records found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.isValid ? "" : "bg-rose-50"}
                >
                  <TableCell className={!row.isValid ? "text-rose-700" : ""}>
                    {row.name || "Missing Name"}
                  </TableCell>
                  <TableCell className={!row.isValid ? "text-rose-700" : ""}>
                    {row.role || "Missing Role"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
