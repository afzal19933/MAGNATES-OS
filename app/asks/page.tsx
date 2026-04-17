"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  name: string;
};

type Ask = {
  id: string;
  title: string;
  status: "PENDING" | "FULFILLED";
  createdAt: string;
  owner: Member | null;
};

type MemberStat = {
  memberId: string;
  name: string;
  total: number;
  fulfilled: number;
};

type AsksResponse = {
  success: boolean;
  data: Ask[];
};

type MembersResponse = {
  success: boolean;
  data: Member[];
};

export default function AsksPage() {
  const router = useRouter();
  const [asks, setAsks] = useState<Ask[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updatingAskId, setUpdatingAskId] = useState<string | null>(null);

  async function fetchAsks() {
    const response = await fetch("/api/asks", {
      cache: "no-store",
    });

    const result = (await response.json()) as AsksResponse;

    if (result.success) {
      setAsks(result.data);
    } else {
      setAsks([]);
    }
  }

  async function fetchMembers() {
    const response = await fetch("/api/members", {
      cache: "no-store",
    });

    const result = (await response.json()) as MembersResponse;

    if (result.success) {
      setMembers(result.data);
    } else {
      setMembers([]);
    }
  }

  useEffect(() => {
    void fetchAsks();
    void fetchMembers();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/asks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          ownerId: ownerId || undefined,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
      };

      if (result.success) {
        setTitle("");
        setOwnerId("");
        await fetchAsks();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleMarkAsFulfilled(id: string) {
    setUpdatingAskId(id);

    try {
      const response = await fetch("/api/asks", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: "FULFILLED",
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
      };

      if (result.success) {
        await fetchAsks();
      }
    } finally {
      setUpdatingAskId(null);
    }
  }

  const filteredAsks = filterMemberId
    ? asks.filter((ask) => ask.owner?.id === filterMemberId)
    : asks;

  const memberStats: MemberStat[] = members.map((member) => {
    const memberAsks = asks.filter((ask) => ask.owner?.id === member.id);

    return {
      memberId: member.id,
      name: member.name,
      total: memberAsks.length,
      fulfilled: memberAsks.filter((ask) => ask.status === "FULFILLED").length,
    };
  });

  return (
    <main>
      <h1>Asks</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter ask title"
        />
        <select
          value={ownerId}
          onChange={(event) => setOwnerId(event.target.value)}
        >
          <option value="">Select owner</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isSubmitting}>
          Submit
        </button>
      </form>

      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <button type="button" onClick={() => void handleUpload()} disabled={isUploading}>
        Upload
      </button>

      <section>
        {memberStats.map((memberStat) => (
          <div key={memberStat.memberId}>
            <p>{memberStat.name}</p>
            <p>Total Asks: {memberStat.total}</p>
            <p>Fulfilled Asks: {memberStat.fulfilled}</p>
          </div>
        ))}
      </section>

      <select
        value={filterMemberId}
        onChange={(event) => setFilterMemberId(event.target.value)}
      >
        <option value="">All Members</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>

      {filteredAsks.length === 0 ? (
        <p>No asks found</p>
      ) : (
        <ul>
          {filteredAsks.map((ask) => (
            <li key={ask.id}>
              <p>{ask.title}</p>
              <p>{ask.status}</p>
              <p>{ask.owner?.name}</p>
              <p>{new Date(ask.createdAt).toLocaleString()}</p>
              {ask.status === "PENDING" ? (
                <button
                  type="button"
                  onClick={() => void handleMarkAsFulfilled(ask.id)}
                  disabled={updatingAskId === ask.id}
                >
                  Mark as Fulfilled
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
