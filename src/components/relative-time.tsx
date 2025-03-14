import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { useEffect, useState } from "react";
import { Tooltip, Text, TextProps } from "tamagui";

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

interface Props extends TextProps {
  time: string;
  prefix?: string;
}

/**
 * Renders a relative time that updates every second.
 * Does so in a way that won't break hydration.
 * Shows the full date/time time on hover.
 */
export function RelativeTime({ time, prefix, ...rest }: Props) {
  const [relativeTime, setRelativeTime] = useState<string>();

  useEffect(() => {
    const updateTime = () => setRelativeTime(dayjs(time).fromNow());

    const interval = setInterval(updateTime, 1000);

    requestAnimationFrame(updateTime);

    return () => clearInterval(interval);
  }, [time]);

  return relativeTime ? (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Text {...rest}>
          {prefix}
          {relativeTime}
        </Text>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text>{dayjs(time).format("MMM D, YYYY h:mma")}</Text>
      </Tooltip.Content>
    </Tooltip>
  ) : null;
}
