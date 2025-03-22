import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import {
  DetailedHTMLProps,
  HTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react";

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale("en", {
  relativeTime: {
    future: "in %s",
    past: "%s",
    s: "<1m",
    m: "1m",
    mm: "%dm",
    h: "1h",
    hh: "%dh",
    d: "1d",
    dd: "%dd",
    M: "1mo",
    MM: "%dmo",
    y: "1y",
    yy: "%dy",
  },
});

interface Props
  extends DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  time: string;
  prefix?: string;
}

/**
 * Renders a relative time that updates every second.
 * Does so in a way that won't break hydration.
 * Shows the full date/time time on hover.
 */
export function RelativeTime({ time, prefix, ...rest }: Props) {
  const dateObj = useMemo(() => dayjs(time), [time]);

  const [, setSignal] = useState(0);

  useEffect(() => {
    const updateTime = () => setSignal((s) => s + 1);
    const interval = setInterval(updateTime, 500);
    return () => clearInterval(interval);
  }, [dateObj]);

  return (
    <span {...rest}>
      {prefix}
      {dateObj.fromNow()}
    </span>
  );
}
