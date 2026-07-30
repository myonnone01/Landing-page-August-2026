"use client";

import { useActionState, useMemo, useState } from "react";
import {
  removeRegistration,
  signOut,
  type DeleteState,
} from "@/app/admin/actions";
import type { Registration } from "@/lib/registrations";
import { orDash, stamp } from "@/lib/format";

type Props = {
  registrations: Registration[];
  capacity: number;
};

type SortKey = "newest" | "name" | "company";

const initialDelete: DeleteState = { error: null, deleted: null };

export function Roster({ registrations, capacity }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [ascending, setAscending] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    removeRegistration,
    initialDelete,
  );

  const stats = useMemo(() => {
    const confirmed = registrations.filter((r) => !r.waitlisted);
    return {
      registrations: registrations.length,
      waitlisted: registrations.length - confirmed.length,
      headcount: confirmed.length,
      remaining: Math.max(0, capacity - confirmed.length),
      dietary: registrations.filter((r) => r.dietaryNeeds).length,
    };
  }, [registrations, capacity]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = needle
      ? registrations.filter((r) =>
          [r.fullName, r.company, r.email].some((field) =>
            field.toLowerCase().includes(needle),
          ),
        )
      : registrations;

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.fullName.localeCompare(b.fullName);
      if (sortKey === "company") return a.company.localeCompare(b.company);
      // Newest first is the default reading order.
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return ascending ? sorted : sorted.reverse();
  }, [registrations, query, sortKey, ascending]);

  function sortStateFor(key: SortKey): "ascending" | "descending" | "none" {
    if (sortKey !== key) return "none";
    return ascending ? "ascending" : "descending";
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setAscending((prev) => !prev);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  }

  async function copyEmails() {
    const emails = visible.map((r) => r.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      // Clipboard access can be refused outright — say so instead of silently
      // appearing to work.
      setCopyState("failed");
    }
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(visible)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `middlebank-roster-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-[95rem] px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
            Roster
          </h1>
          <p className="mt-1 font-mono text-[0.75rem] text-navy-400">
            The Middlebank · Tue Aug 25
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md px-3 py-1.5 font-sans text-[0.85rem] font-medium text-navy-800 underline decoration-navy-300 underline-offset-4 hover:decoration-navy-800"
          >
            Sign out
          </button>
        </form>
      </header>

      {/* ---------------------------------------------------------- stats */}
      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-navy-100 sm:grid-cols-4">
        <Stat label="Registrations" value={stats.registrations}>
          {stats.waitlisted > 0 ? `${stats.waitlisted} on the waitlist` : null}
        </Stat>
        <Stat label="Confirmed" value={stats.headcount}>
          Give this to the captain
        </Stat>
        <Stat label="Spots remaining" value={stats.remaining}>
          {`of ${capacity}`}
        </Stat>
        <Stat label="Dietary flags" value={stats.dietary}>
          {stats.dietary > 0 ? "Send to the galley" : "None so far"}
        </Stat>
      </dl>

      {/* -------------------------------------------------------- controls */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[16rem] flex-1">
          <label
            htmlFor="search"
            className="block font-sans text-[0.85rem] font-medium text-navy-800"
          >
            Search name, company or email
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1.5 w-full max-w-md rounded-md border-0 bg-white px-3.5 py-2 text-[0.9rem] text-navy-800 ring-1 ring-navy-200 focus:ring-2 focus:ring-ocean-500"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={copyEmails}
            className="rounded-md bg-white px-4 py-2 font-sans text-[0.85rem] font-medium text-navy-800 ring-1 ring-navy-200 hover:ring-ocean-500"
          >
            {copyState === "copied"
              ? "Copied"
              : `Copy ${visible.length} email${visible.length === 1 ? "" : "s"}`}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-md bg-ocean-600 px-4 py-2 font-display text-[0.85rem] font-semibold text-white hover:opacity-90"
          >
            Download CSV
          </button>
        </div>
      </div>

      {copyState === "failed" && (
        <p role="alert" className="mt-3 text-[0.85rem] text-navy-800">
          Your browser blocked clipboard access. Download the CSV instead, or
          select the email column by hand.
        </p>
      )}

      {(deleteState.error || deleteState.deleted) && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-white px-4 py-2.5 text-[0.85rem] text-navy-800 ring-1 ring-navy-200"
        >
          {deleteState.error ?? `Deleted ${deleteState.deleted}.`}
        </p>
      )}

      {/* ----------------------------------------------------------- table */}
      <div className="mt-6 overflow-x-auto rounded-lg ring-1 ring-navy-100">
        <table className="w-full min-w-[70rem] border-collapse bg-white text-left">
          <thead>
            <tr className="border-b border-navy-100">
              <Th>Received</Th>
              <Th sort={sortStateFor("name")}>
                <SortButton
                  label="Name"
                  active={sortKey === "name"}
                  ascending={ascending}
                  onClick={() => toggleSort("name")}
                />
              </Th>
              <Th sort={sortStateFor("company")}>
                <SortButton
                  label="Company"
                  active={sortKey === "company"}
                  ascending={ascending}
                  onClick={() => toggleSort("company")}
                />
              </Th>
              <Th>Job title</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Dietary needs</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[0.9rem] text-navy-400"
                >
                  {registrations.length === 0
                    ? "Nobody has signed up yet."
                    : `No one matches “${query}”.`}
                </td>
              </tr>
            )}

            {visible.map((r) => (
              <tr
                key={r.id}
                className="border-b border-navy-100 align-top last:border-0"
              >
                <Td mono>{stamp(r.createdAt)}</Td>
                <Td>
                  <span className="font-medium text-navy-800">
                    {r.fullName}
                  </span>
                  {r.waitlisted && (
                    <span className="mt-0.5 block font-mono text-[0.65rem] uppercase tracking-[0.14em] text-navy-400">
                      Waitlist
                    </span>
                  )}
                </Td>
                <Td>{r.company}</Td>
                <Td>{orDash(r.jobTitle)}</Td>
                <Td mono>
                  <a
                    href={`mailto:${r.email}`}
                    className="underline decoration-navy-300 underline-offset-2 hover:decoration-navy-800"
                  >
                    {r.email}
                  </a>
                </Td>
                <Td mono>{orDash(r.phoneNumber)}</Td>
                <Td>{orDash(r.dietaryNeeds)}</Td>
                <Td>
                  {confirmingId === r.id ? (
                    <form action={deleteAction} className="flex gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="name" value={r.fullName} />
                      <button
                        type="submit"
                        disabled={deletePending}
                        className="rounded px-2 py-1 text-[0.8rem] font-semibold text-navy-800 underline decoration-red-400 decoration-2 underline-offset-2 disabled:opacity-60"
                      >
                        {deletePending ? "Deleting…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="rounded px-2 py-1 text-[0.8rem] text-navy-400 hover:text-navy-800"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(r.id)}
                      className="rounded px-2 py-1 text-[0.8rem] text-navy-400 hover:text-navy-800"
                    >
                      Delete
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 font-mono text-[0.7rem] text-navy-400">
        Showing {visible.length} of {registrations.length}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-navy-400">
        {label}
      </dt>
      <dd className="mt-1.5 font-display text-3xl font-bold tracking-tight text-navy-800">
        {value}
      </dd>
      {children && (
        <p className="mt-1 font-sans text-[0.75rem] text-navy-400">
          {children}
        </p>
      )}
    </div>
  );
}

function SortButton({
  label,
  active,
  ascending,
  onClick,
}: {
  label: string;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-navy-400 hover:text-navy-800"
    >
      {label}
      <span aria-hidden="true" className={active ? "" : "opacity-30"}>
        {active && !ascending ? "↓" : "↑"}
      </span>
    </button>
  );
}

function Th({
  children,
  numeric = false,
  sort,
}: {
  children: React.ReactNode;
  numeric?: boolean;
  /** aria-sort belongs on the header cell, not on the button inside it. */
  sort?: "ascending" | "descending" | "none";
}) {
  return (
    <th
      scope="col"
      aria-sort={sort}
      className={`px-4 py-3 font-mono text-[0.7rem] font-normal uppercase tracking-[0.16em] text-navy-400 ${numeric ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

/** Mono cells hold timestamps and phone numbers, which must not break mid-value. */
function Td({
  children,
  mono = false,
  numeric = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  numeric?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3.5 text-[0.85rem] leading-snug text-navy-600 ${mono ? "font-mono whitespace-nowrap" : ""} ${numeric ? "text-right" : ""}`}
    >
      {children}
    </td>
  );
}

/**
 * A leading =, +, - or @ makes a spreadsheet treat the cell as a formula, so
 * those values get a leading apostrophe. Without it a "notes" field could
 * execute on open.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Registration[]): string {
  const header = [
    "Received",
    "Name",
    "Company",
    "Job title",
    "Email",
    "Phone",
    "Dietary needs",
    "Waitlisted",
  ];

  const body = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.fullName,
      r.company,
      r.jobTitle,
      r.email,
      r.phoneNumber,
      r.dietaryNeeds,
      r.waitlisted ? "yes" : "no",
    ]
      .map(csvCell)
      .join(","),
  );

  // CRLF and a BOM so Excel opens it as UTF-8 without mangling accents.
  return "﻿" + [header.map(csvCell).join(","), ...body].join("\r\n");
}
