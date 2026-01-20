import Link from "next/link";
import { Chip } from "@/components/chip";

type ProjectHeroProps = {
  title: string;
  role?: string;
  product?: string;
  timeframe?: string;
  summary: string;
  responsibilities?: string[];
};

export function ProjectHero({
  title,
  role = "Staff Product Designer",
  product,
  timeframe,
  summary,
  responsibilities,
}: ProjectHeroProps) {
  return (
    <header className="space-y-6">
      <Link
        href="/"
        className="inline-flex text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to Work
      </Link>

      <div className="space-y-3">
        <h1 className="text-[36px] font-medium leading-tight text-foreground md:text-[48px]">
          {title}
        </h1>

        <div className="flex flex-wrap gap-2">
          {role ? <Chip>{role}</Chip> : null}
          {product ? <Chip>{product}</Chip> : null}
          {timeframe ? <Chip>{timeframe}</Chip> : null}
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-[14px] leading-relaxed text-muted-foreground">
          {summary}
        </p>

        {responsibilities && responsibilities.length > 0 ? (
          <ul className="space-y-2 text-[14px] text-muted-foreground">
            {responsibilities.slice(0, 4).map((r) => (
              <li key={r} className="flex gap-3 text-left">
                <span className="mt-[7px] h-[3px] w-[3px] rounded-full bg-muted-foreground/60" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </header>
  );
}

