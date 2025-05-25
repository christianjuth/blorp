export function BadgeCount({
  children,
  showBadge,
}: {
  children?: React.ReactNode;
  showBadge?: boolean;
}) {
  return (
    <div className="relative flex">
      {children}
      {showBadge && (
        <div className="h-3 w-3 bg-brand rounded-full absolute right-0 top-0 -translate-y-0.5 translate-x-0.5 border border-background" />
      )}
    </div>
  );
}

export function BadgeIcon({
  children,
  icon,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative flex">
      {children}
      {icon && (
        <div className="h-4.5 w-4.5 bg-background rounded-full absolute right-0 bottom-0 translate-y-1/3 translate-x-1/3 border-px border p-0.5">
          {icon}
        </div>
      )}
    </div>
  );
}
