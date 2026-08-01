import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export type ColumnPriority = "essential" | "important" | "optional";

interface ResponsiveColumnProps {
  priority?: ColumnPriority;
  mobileLabel?: string;
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement>, ResponsiveColumnProps {
  resizable?: boolean;
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement>, ResponsiveColumnProps {}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-4 w-full overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className={cn("min-w-[680px] w-full border-collapse text-left text-sm md:min-w-0", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("hidden bg-[#fafaf8] text-[#9ca3af] md:table-header-group", className)} {...props} />;
}

export function Tbody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("md:table-row-group", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[#f1eee7] transition-colors hover:bg-[#fcfbf9] focus-within:bg-[#fffaf0] md:table-row",
        className
      )}
      {...props}
    />
  );
}

export function Th({ className, priority = "essential", resizable = false, style, children, ...props }: ThProps) {
  const thRef = useRef<HTMLTableCellElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  const handleResizeStart = (event: React.MouseEvent<HTMLSpanElement>) => {
    if (!thRef.current) return;

    const startX = event.clientX;
    const startWidth = thRef.current.getBoundingClientRect().width;

    const handleMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(100, startWidth + moveEvent.clientX - startX);
      setWidth(nextWidth);
    };

    const handleStop = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleStop);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleStop);
  };

  return (
    <th
      ref={thRef}
      className={cn(
        "relative px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap",
        priority === "optional" && "hidden lg:table-cell",
        priority === "important" && "hidden sm:table-cell",
        className
      )}
      style={{ ...(style || {}), width: width ? `${width}px` : undefined }}
      {...props}
    >
      {children}
      {resizable && (
        <span
          onMouseDown={handleResizeStart}
          className="absolute right-0 top-1/2 h-5 w-2 -translate-y-1/2 cursor-col-resize rounded-full bg-[#ece7de] transition hover:bg-[#d8cbb5]"
          aria-hidden="true"
        />
      )}
    </th>
  );
}

export function Td({ className, priority = "essential", mobileLabel, children, ...props }: TdProps) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 align-middle text-[#4b5563]",
        priority === "optional" && "hidden lg:table-cell",
        priority === "important" && "hidden sm:table-cell",
        className
      )}
      data-label={mobileLabel}
      {...props}
    >
      {children}
    </td>
  );
}

export function SelectionCell({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 min-h-4 min-w-4 max-h-4 max-w-4 flex-shrink-0 cursor-pointer rounded-[3px] border-[#d1d5db] text-[#b89a5e] drop-shadow-sm focus:ring-[#b89a5e] focus:ring-offset-1"
      aria-label={label}
    />
  );
}

export function SortableTh({
  children,
  active,
  direction,
  onToggle,
  className,
  ...props
}: ThProps & {
  active?: boolean;
  direction?: "asc" | "desc";
  onToggle: () => void;
}) {
  return (
    <Th className={className} {...props}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-inherit transition hover:text-[#6b7280]"
      >
        <span>{children}</span>
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          {active ? (direction === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
        </span>
      </button>
    </Th>
  );
}

export function BulkActionBar({
  selectedCount,
  children,
}: {
  selectedCount: number;
  children: ReactNode;
}) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ece7de] bg-[#fffaf0] px-4 py-3">
      <p className="text-sm font-medium text-[#7c6442]">
        {selectedCount} row{selectedCount === 1 ? "" : "s"} selected
      </p>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

export function TableSkeleton({ rowCount = 5, colCount = 6 }: { rowCount?: number; colCount?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e2db] bg-white">
      <div className="border-b border-[#f1eee7] bg-[#fafaf8] px-4 py-3">
        <div className="h-3 w-40 animate-pulse rounded-full bg-[#ece7de]" />
      </div>
      <div className="space-y-1 p-4">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
            {Array.from({ length: colCount }).map((__, colIndex) => (
              <div key={`${rowIndex}-${colIndex}`} className="h-9 animate-pulse rounded-lg bg-[#f3f1ed]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableEmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto mb-3 w-[120px] text-[#d7cdbb]">
        <svg viewBox="0 0 180 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="20" y="26" width="140" height="54" rx="12" fill="currentColor" fillOpacity="0.22" />
          <path d="M40 42h100" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path d="M40 60h68" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <circle cx="132" cy="60" r="10" fill="currentColor" fillOpacity="0.38" />
        </svg>
      </div>
      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#f8f4ec] px-2.5 py-1 text-xs font-semibold text-[#8b6f49]">
        <span className="material-symbols-outlined text-sm" aria-hidden="true">{icon}</span>
        Nothing here yet
      </span>
      <h3 className="text-lg font-semibold text-[#1f2937]">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-[#6b7280]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}