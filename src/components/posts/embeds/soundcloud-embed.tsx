import { useTheme } from "@/src/lib/hooks";

export function SoundCloudEmbed({ url }: { url: string }) {
  const theme = useTheme();
  const isDark = theme === "dark";
  return (
    <iframe
      className="rounded-lg bg-muted border aspect-video"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&show_teaser=true&visual=true&color=%23${isDark ? "876cff" : "4123d0"}`}
    />
  );
}
