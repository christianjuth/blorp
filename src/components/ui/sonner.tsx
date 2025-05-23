import { useMedia } from "@/src/lib/hooks/index";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const media = useMedia();

  return (
    <Sonner
      theme={"system"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      position={media.maxMd ? "top-center" : "bottom-center"}
      toastOptions={{
        duration: 2000,
        className:
          "max-md:mt-[calc(var(--ion-safe-area-top)+50px)] data-[type=error]:bg-destructive! data-[type=success]:bg-emerald-600! text-white! rounded-xl!",
      }}
      {...props}
    />
  );
};

export { Toaster };
