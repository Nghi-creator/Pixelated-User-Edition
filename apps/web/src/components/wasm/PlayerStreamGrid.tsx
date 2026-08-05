import type { ReactNode } from "react";

export function PlayerStreamGrid({
  children,
  layoutClassName,
  showTelemetry,
  telemetryPanel,
}: {
  children: ReactNode;
  layoutClassName: string;
  showTelemetry: boolean;
  telemetryPanel: ReactNode;
}) {
  return (
    <div
      className={`grid w-full items-start gap-4 transition-[max-width,grid-template-columns] duration-300 ${
        showTelemetry
          ? `${layoutClassName} xl:grid-cols-[minmax(0,1fr)_18rem]`
          : layoutClassName
      }`}
    >
      {children}
      {showTelemetry && telemetryPanel}
    </div>
  );
}
