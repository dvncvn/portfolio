"use client";

export type EmploymentRow = {
  role: string;
  roleFlag?: string | null;
  company: string;
  companyFlag?: string | null;
  years: string;
};

type EmploymentTableProps = {
  rows: EmploymentRow[];
  onViewHistory?: () => void;
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
    return m[0].slice(2);
  };

  return `${toShort(start)} - ${toShort(end)}`;
}

export function EmploymentTable({ rows, onViewHistory }: EmploymentTableProps) {
  return (
    <div className="w-full max-w-[768px]">
      <table className="w-full table-fixed border-collapse text-[16px]">
        <colgroup>
          <col className="w-auto xl:w-[50%]" />
          <col className="hidden xl:table-column xl:w-[25%]" />
          <col className="w-[100px] xl:w-[25%]" />
        </colgroup>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={`${row.role}-${row.company}-${row.years}-${idx}`}
              className="border-b border-white/10 last:border-b-0"
            >
              <td className="py-2 pr-4 align-middle">
                <div className="flex min-w-0 items-baseline gap-2 xl:gap-3">
                  <span className="font-medium text-foreground">
                    {row.role}
                  </span>
                  {row.roleFlag ? (
                    <span className="hidden whitespace-nowrap text-[#464646] xl:inline">
                      {row.roleFlag}
                    </span>
                  ) : null}
                </div>
              </td>

              <td className="hidden py-2 pr-4 align-middle xl:table-cell">
                <div className="flex items-baseline gap-3">
                  <span className="whitespace-nowrap font-normal text-foreground">
                    {row.company}
                  </span>
                  {row.companyFlag ? (
                    <span className="hidden whitespace-nowrap text-[#464646] xl:inline">
                      {row.companyFlag}
                    </span>
                  ) : null}
                </div>
              </td>

              <td className="py-2 align-middle text-left xl:text-right font-mono tabular-nums text-muted-foreground whitespace-nowrap">
                <span className="xl:hidden">{formatYearsShort(row.years)}</span>
                <span className="hidden xl:inline">{row.years.replace(/Now$/, "Now ")}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {onViewHistory && (
        <button
          type="button"
          onClick={onViewHistory}
          className="group/btn -ml-3 mt-6 inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-[14px] text-muted-foreground transition-all duration-200 ease-out hover:bg-white/[0.06] hover:text-foreground"
        >
          <span>View full 14 year history</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 ease-out group-hover/btn:scale-110"
          >
            <path d="M15 3h6v6"/>
            <path d="m21 3-7 7"/>
            <path d="m3 21 7-7"/>
            <path d="M9 21H3v-6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

