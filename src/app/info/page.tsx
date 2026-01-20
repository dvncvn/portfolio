import { EmploymentTable, type EmploymentRow } from "@/components/employment-table";

const workHistory: EmploymentRow[] = [
  {
    role: "Staff Product Designer",
    roleFlag: "Acquired",
    company: "IBM",
    companyFlag: null,
    years: "2025 – Now",
  },
  {
    role: "Staff Product Designer",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2024 – 2025",
  },
  {
    role: "Product Design Manager",
    company: "DataStax",
    roleFlag: "Promoted",
    companyFlag: null,
    years: "2023 – 2024",
  },
  {
    role: "Senior Product Designer",
    company: "DataStax",
    roleFlag: null,
    companyFlag: null,
    years: "2023 – 2024",
  },
];

export default function InfoPage() {
  return (
    <div className="py-20">
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="space-y-4">
          <h1 className="text-[18px] font-medium leading-tight text-foreground">
            Info
          </h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground lg:max-w-md">
            A few details, links, and a quick work history. This page will get
            fleshed out as content comes together.
          </p>
        </div>

        <EmploymentTable rows={workHistory} />
      </div>
    </div>
  );
}

