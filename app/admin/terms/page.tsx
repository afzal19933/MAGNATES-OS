"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Button from "@/components/ui/Button";
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

type Term = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
};

type TermsResponse = {
  success: boolean;
  data?: Term[];
  message?: string;
};

type User = {
  id: string;
  name: string;
};

export default function TermsPage() {
  const [termName, setTermName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [assignForm, setAssignForm] = useState<{
    userId: string;
    role: string;
    loading: boolean;
    successMessage: string | null;
    errorMessage: string | null;
  }>({
    userId: "",
    role: "MEMBER",
    loading: false,
    successMessage: null,
    errorMessage: null,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  const activeTerm = useMemo(
    () => terms.find((term) => term.isActive) || null,
    [terms]
  );

  async function fetchTerms() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/terms", { cache: "no-store" });
      const result = (await response.json()) as TermsResponse;

      if (!response.ok || !result.success) {
        setTerms([]);
        setError(result.message || "Failed to load terms.");
        return;
      }

      setTerms(Array.isArray(result.data) ? result.data : []);
    } catch {
      setTerms([]);
      setError("Failed to load terms.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchTerms();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setIsUsersLoading(true);
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        if (!response.ok) {
          setUsers([]);
          return;
        }

        const data = (await response.json()) as User[];
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setUsers([]);
      } finally {
        setIsUsersLoading(false);
      }
    }

    void fetchUsers();
  }, []);

  async function handleCreateTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCreating) {
      return;
    }

    const name = termName.trim();
    if (!name || !startDate || !endDate) {
      setError("Term name, start date, and end date are required.");
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("Start date must be before end date.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to create term.");
        return;
      }

      setTermName("");
      setStartDate("");
      setEndDate("");
      setSuccessMessage("Term created successfully.");
      await fetchTerms();
    } catch {
      setError("Failed to create term.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleActivateTerm(termId: string) {
    if (activatingId === termId) {
      return;
    }

    const isConfirmed = window.confirm(
      "Activate this term? This will deactivate the current active term."
    );
    if (!isConfirmed) {
      return;
    }

    setActivatingId(termId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/terms/${termId}/activate`, {
        method: "POST",
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(result.message || "Failed to activate term.");
        setActivatingId(null);
        return;
      }

      setSuccessMessage("Term activated successfully.");
      await fetchTerms();
      setActivatingId(null);
    } catch {
      setError("Failed to activate term.");
      setActivatingId(null);
    }
  }

  async function handleAssignUserToActiveTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (assignForm.loading) {
      return;
    }

    const selectedUserId = assignForm.userId.trim();
    const selectedRole = assignForm.role.trim();

    if (!selectedUserId) {
      setAssignForm((current) => ({
        ...current,
        errorMessage: "Please select a user.",
        successMessage: null,
      }));
      return;
    }

    if (
      selectedRole !== "ADMIN" &&
      selectedRole !== "MEMBER" &&
      selectedRole !== "VISITOR"
    ) {
      setAssignForm((current) => ({
        ...current,
        errorMessage: "Please select a valid role.",
        successMessage: null,
      }));
      return;
    }

    setAssignForm((current) => ({
      ...current,
      loading: true,
      errorMessage: null,
      successMessage: null,
    }));

    try {
      const response = await fetch("/api/terms/assign-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        const normalizedMessage = (result.message || "").toLowerCase();
        const isDuplicate =
          response.status === 409 ||
          normalizedMessage.includes("already assigned");
        const isNoActiveTerm =
          normalizedMessage.includes("no active term");

        setAssignForm((current) => ({
          ...current,
          errorMessage: isDuplicate
            ? "User already assigned to active term"
            : isNoActiveTerm
              ? "No active term found"
              : result.message || "Failed to assign user.",
          successMessage: null,
        }));
        return;
      }

      setAssignForm((current) => ({
        ...current,
        userId: "",
        role: "MEMBER",
        successMessage: "User assigned successfully",
        errorMessage: null,
      }));

      window.setTimeout(() => {
        setAssignForm((current) => ({
          ...current,
          successMessage: null,
        }));
      }, 3000);
    } catch {
      setAssignForm((current) => ({
        ...current,
        errorMessage: "Failed to assign user.",
        successMessage: null,
      }));
    } finally {
      setAssignForm((current) => ({
        ...current,
        loading: false,
      }));
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Management"
        description="Create terms, review all terms, and activate the current term."
      />

      <p className="text-sm text-slate-500">
        Active Term: {activeTerm ? activeTerm.name : "None"}
      </p>

      <Card>
        <form onSubmit={handleCreateTerm} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
                placeholder="e.g. Q3 2026"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="startDate"
                className="text-sm font-medium text-slate-700"
              >
                Start Date
              </label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="endDate"
                className="text-sm font-medium text-slate-700"
              >
                End Date
              </label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
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

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isCreating || !termName.trim() || !startDate || !endDate}
            >
              {isCreating ? "Creating..." : "Create Term"}
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <form onSubmit={handleAssignUserToActiveTerm} className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Assign User to Active Term
            </h2>
            <p className="text-sm text-slate-500">
              Assign a user role for the currently active term.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="assignUserId"
                className="text-sm font-medium text-slate-700"
              >
                Select User
              </label>
              <select
                id="assignUserId"
                value={assignForm.userId}
                onChange={(event) =>
                  setAssignForm((current) => ({
                    ...current,
                    userId: event.target.value,
                    errorMessage: null,
                    successMessage: null,
                  }))
                }
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              >
                <option value="">Choose a user</option>
                {isUsersLoading ? (
                  <option value="" disabled>
                    Loading users...
                  </option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="assignRole"
                className="text-sm font-medium text-slate-700"
              >
                Select Role
              </label>
              <select
                id="assignRole"
                value={assignForm.role}
                onChange={(event) =>
                  setAssignForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VISITOR">VISITOR</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                assignForm.loading ||
                !assignForm.userId ||
                !assignForm.role ||
                !activeTerm
              }
            >
              {assignForm.loading ? "Assigning..." : "Assign User"}
            </Button>
          </div>

          {assignForm.successMessage ? (
            <p className="text-sm text-green-600">{assignForm.successMessage}</p>
          ) : null}
          {assignForm.errorMessage ? (
            <p className="text-sm text-red-600">{assignForm.errorMessage}</p>
          ) : null}
        </form>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">All Terms</h2>
          <p className="text-sm text-slate-500">
            Active Term:{" "}
            {activeTerm
              ? `${activeTerm.name} (${formatDate(activeTerm.startDate)} - ${formatDate(
                  activeTerm.endDate
                )})`
              : "None"}
          </p>

          {isLoading ? (
            <p className="text-sm text-slate-500">Loading terms...</p>
          ) : terms.length === 0 ? (
            <p className="text-sm text-slate-500">No terms found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow
                    key={term.id}
                    className={term.isActive ? "bg-emerald-50/60" : ""}
                  >
                    <TableCell className="font-medium text-slate-900">
                      {term.name}
                    </TableCell>
                    <TableCell>{formatDate(term.startDate)}</TableCell>
                    <TableCell>{formatDate(term.endDate)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          term.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {term.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {term.isActive ? (
                        <Button disabled>Active</Button>
                      ) : (
                        <Button
                          onClick={() => void handleActivateTerm(term.id)}
                          disabled={activatingId === term.id}
                        >
                          {activatingId === term.id
                            ? "Activating..."
                            : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
