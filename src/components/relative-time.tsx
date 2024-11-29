import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { Tooltip, Text, TextProps } from "tamagui";

dayjs.extend(relativeTime);

interface Props extends TextProps {
  time: string;
}

/**
 * Renders a relative time that updates every second.
 * Does so in a way that won't break hydration.
 * Shows the full date/time time on hover.
 */
export function RelativeTime({ time, ...rest }: Props) {
  const [relativeTime, setRelativeTime] = useState<string>(
    dayjs(time).format("MMM D, YYYY h:mma"),
  );

  useEffect(() => {
    const updateTime = () => setRelativeTime(dayjs(time).fromNow());

    const interval = setInterval(updateTime, 1000);

    updateTime();

    return () => clearInterval(interval);
  }, [time]);

  return relativeTime ? (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Text {...rest}>{relativeTime}</Text>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Text>{dayjs(time).format("MMM D, YYYY h:mma")}</Text>
      </Tooltip.Content>
    </Tooltip>
  ) : null;
}
