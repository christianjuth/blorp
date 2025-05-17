import _ from "lodash";
import { abbriviateNumber } from "../lib/format";
import { Skeleton } from "./ui/skeleton";
import { Fragment } from "react/jsx-runtime";

export function AggregateGrid({
  aggregates,
}: {
  aggregates: Record<string, number | undefined | null>;
}) {
  const entries = Object.entries(aggregates);
  return (
    <div
      className="grid text-sm"
      style={{
        gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`,
      }}
    >
      {entries.map(([label, value]) => (
        <Fragment key={label}>
          <span className="font-semibold h-5">
            {_.isNumber(value) ? (
              abbriviateNumber(value)
            ) : (
              <Skeleton className="w-2/3 h-full" />
            )}
          </span>
          <span className="row-start-2 text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
