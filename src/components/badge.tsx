export function Badge({
  children,
  showBadge,
}: {
  children?: React.ReactNode;
  showBadge?: boolean;
}) {
  return (
    <div className="relative">
      {children}
      {showBadge && (
        <div className="h-3 w-3 bg-destructive rounded-full absolute right-0 top-0 -translate-y-0.5 translate-x-0.5 border border-background" />
      )}
    </div>
  );
}
