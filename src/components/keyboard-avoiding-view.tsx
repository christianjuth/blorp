export function KeyboardAvoidingView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col h-full"
      style={{
        paddingBottom: "var(--keyboard-height)",
      }}
    >
      <div className="overflow-y-auto flex-1">{children}</div>
    </div>
  );
}
