import _ from "lodash";
import { abbriviateNumber } from "../lib/format";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

export function AggregateGrid({
  aggregates,
}: {
  aggregates: Record<string, number | undefined | null>;
}) {
  const entries = Object.entries(aggregates);
  return (
    <div
      className="grid text-sm auto-rows-auto gap-2"
      style={{
        gridTemplateColumns: `repeat(${Math.min(entries.length, 3)}, minmax(0, 1fr))`,
      }}
    >
      {entries.map(([label, value]) => (
        <div className="flex flex-col" key={label}>
          <span className="font-semibold h-5">
            {_.isNumber(value) ? (
              abbriviateNumber(value)
            ) : (
              <Skeleton className="w-2/3 h-full" />
            )}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function AggregateBadges({
  aggregates,
  className,
}: {
  aggregates: Record<string, number | undefined | null>;
  className?: string;
}) {
  const entries = Object.entries(aggregates);
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {entries.map(([label, value]) =>
        _.isNumber(value) ? (
          <Badge key={label} variant="outline">
            <span className="block" key={label}>
              {abbriviateNumber(value)} {label}
            </span>
          </Badge>
        ) : null,
      )}
    </div>
  );
}
