export default function FormMessage({
  type,
  children,
}: {
  type: "success" | "error";
  children: React.ReactNode;
}) {
  const isError = type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`border px-4 py-3 text-sm font-medium flex items-start gap-2.5 ${
        isError
          ? "border-oxblood bg-oxblood/5 text-oxblood"
          : "border-brass bg-brass/10 text-ink"
      }`}
    >
      <span aria-hidden="true" className="shrink-0">
        {isError ? "⚠" : "✓"}
      </span>
      <span>{children}</span>
    </div>
  );
}
