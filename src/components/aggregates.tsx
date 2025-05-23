import _ from "lodash";
import { abbriviateNumber } from "../lib/format";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

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
          <Badge key={label} variant="secondary">
            <span className="block" key={label}>
              {abbriviateNumber(value)} {label}
            </span>
          </Badge>
        ) : null,
      )}
    </div>
  );
}
