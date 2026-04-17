"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

export type GeneratedCredential = {
  name: string;
  username: string;
  password: string;
  role: string;
};

type CredentialsTableProps = {
  rows: GeneratedCredential[];
};

export default function CredentialsTable({ rows }: CredentialsTableProps) {
  const [showPasswords, setShowPasswords] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleCopy(row: GeneratedCredential, index: number) {
    if (copiedIndex === index) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `Username: ${row.username}\nPassword: ${row.password}`
      );

      setCopiedIndex(index);

      window.setTimeout(() => {
        setCopiedIndex((current) => (current === index ? null : current));
      }, 2000);
    } catch {
      alert("Failed to copy. Please copy manually.");
    }
  }

  async function handleCopyAll() {
    try {
      const text = rows
        .map(
          (row) =>
            `Name: ${row.name}\nUsername: ${row.username}\nPassword: ${row.password}\nRole: ${row.role}`
        )
        .join("\n\n");

      await navigator.clipboard.writeText(text);
      setCopiedAll(true);

      window.setTimeout(() => {
        setCopiedAll(false);
      }, 2000);
    } catch {
      alert("Failed to copy. Please copy manually.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          onClick={() => void handleCopyAll()}
        >
          {copiedAll ? "Copied All!" : "Copy All Credentials"}
        </Button>
        <Button
          className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          onClick={() => setShowPasswords((current) => !current)}
        >
          {showPasswords ? "Hide Passwords" : "Show Passwords"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.username}-${index}`}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.username}</TableCell>
              <TableCell>
                {showPasswords ? row.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
              </TableCell>
              <TableCell>{row.role}</TableCell>
              <TableCell>
                <Button
                  className="bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                  onClick={() => void handleCopy(row, index)}
                >
                  {copiedIndex === index ? "Copied!" : "Copy"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
