"use client";

import Link from "next/link";

export type EmploymentRow = {
  role: string;
  roleFlag?: string | null;
  company: string;
  companyFlag?: string | null;
  years: string;
};

type EmploymentTableProps = {
  rows: EmploymentRow[];
};

function formatYearsShort(years: string) {
  const normalized = years.replace(/\s+/g, " ").trim();
  const parts = normalized.split("–").map((p) => p.trim());
  if (parts.length !== 2) return normalized;

  const [start, end] = parts;

  const toShort = (value: string) => {
    if (/^now$/i.test(value)) return "Now";
    const m = value.match(/\d{4}/);
    if (!m) return value;
    return `'${m[0].slice(2)}`;
  };

  return `${toShort(start)} - ${toShort(end)}`;
}

export function EmploymentTable({ rows }: EmploymentTableProps) {
  return (
    <div className="w-full max-w-none lg:max-w-[520px] lg:ml-auto">
      <table className="w-full table-fixed border-collapse text-[14px]">
        <colgroup>
          <col />
          <col className="hidden w-[96px] sm:table-column" />
          <col className="w-[96px] sm:w-[120px]" />
        </colgroup>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${row.role}-${row.company}-${row.years}-${idx}`}
              className="border-b border-white/10 last:border-b-0"
            >
              <td className="py-2 pr-3 align-middle sm:pr-6">
                <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
                  <span className="min-w-0 truncate font-medium text-foreground sm:whitespace-nowrap">
                    {row.role}
                  </span>
                  {row.roleFlag ? (
                    <span className="hidden whitespace-nowrap text-[#464646] min-[520px]:inline">
                      {row.roleFlag}
                    </span>
                  ) : null}
                </div>
              </td>

              <td className="hidden py-2 pr-6 align-middle sm:table-cell">
                <div className="flex items-baseline gap-3">
                  <span className="whitespace-nowrap font-normal text-foreground">
                    {row.company}
                  </span>
                  {row.companyFlag ? (
                    <span className="hidden whitespace-nowrap text-[#464646] min-[520px]:inline">
                      {row.companyFlag}
                    </span>
                  ) : null}
                </div>
              </td>

              <td className="py-2 align-middle text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                <span className="sm:hidden">{formatYearsShort(row.years)}</span>
                <span className="hidden sm:inline">{row.years}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link
        href="/info"
        className="mt-6 block text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        View full 12 year history
      </Link>
    </div>
  );
}

