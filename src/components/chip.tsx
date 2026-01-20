type ChipProps = {
  children: React.ReactNode;
};

export function Chip({ children }: ChipProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[12px] text-muted-foreground">
      {children}
    </span>
  );
}

