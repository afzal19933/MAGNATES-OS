"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

type ScoringRule = {
  id: number;
  key: string;
  name: string;
  points: number;
};

export default function ScoringRulesPage() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [editedPoints, setEditedPoints] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchRules() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/scoring-rules", {
          cache: "no-store",
        });
        const data = (await response.json()) as ScoringRule[];
        setRules(Array.isArray(data) ? data : []);
        setMessage("");
      } catch {
        setRules([]);
        setMessage("Failed to load scoring rules.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchRules();
  }, []);

  const changedRules = useMemo(() => {
    return rules
      .map((rule) => {
        const value = editedPoints[rule.id];

        if (value === undefined) {
          return null;
        }

        const points = Number(value);

        if (Number.isNaN(points) || points === rule.points) {
          return null;
        }

        return {
          id: rule.id,
          points,
        };
      })
      .filter((rule): rule is { id: number; points: number } => rule !== null);
  }, [editedPoints, rules]);

  async function handleSave() {
    if (changedRules.length === 0) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/scoring-rules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changedRules),
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        setMessage(result.message || "Unable to save scoring rules.");
        return;
      }

      setRules((currentRules) =>
        currentRules.map((rule) => {
          const updatedRule = changedRules.find((item) => item.id === rule.id);

          if (!updatedRule) {
            return rule;
          }

          return {
            ...rule,
            points: updatedRule.points,
          };
        })
      );
      setEditedPoints({});
      setMessage("Scoring rules updated successfully.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scoring Rules"
        description="Manage the points assigned to each scoring rule."
      />

      <Card>
        <div className="space-y-4">
          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-8 text-sm text-slate-500">Loading scoring rules...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const currentValue = editedPoints[rule.id] ?? String(rule.points);
                  const isChanged =
                    editedPoints[rule.id] !== undefined &&
                    Number(currentValue) !== rule.points;

                  return (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.name}</TableCell>
                      <TableCell className="w-40">
                        <Input
                          type="number"
                          value={currentValue}
                          onChange={(event) => {
                            setMessage("");
                            setEditedPoints((current) => ({
                              ...current,
                              [rule.id]: event.target.value,
                            }));
                          }}
                          className={isChanged ? "border-amber-400 bg-amber-50" : ""}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!isLoading && changedRules.length > 0 ? (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
