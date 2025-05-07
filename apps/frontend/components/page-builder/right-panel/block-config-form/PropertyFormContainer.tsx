export default function PropertyFormContainer({
  leftComponent,
  children,
  rightComponent
}: {
  children: React.ReactNode;
  leftComponent: React.ReactNode;
  rightComponent?: React.ReactNode;
}) {
  return (
    <>
      <div className={"h-[var(--body-height)] max-h-[var(--body-height)] select-none"}>
        <header
          className={
            "border-b border-divider h-header flex items-center justify-between px-default gap-3"
          }
        >
          <div className={"w-[50%] flex items-center truncate"}>
            {leftComponent}
          </div>
          <div />
          <div className="w-[50%] flex items-center justify-end">
            {rightComponent}
          </div>
        </header>
        <div className={"p-default h-[var(--panel-body-height)] max-h-[var(--panel-body-height)] overflow-y-auto space-y-default select-none"}>
          {children}
        </div>
      </div>
    </>
  );
}
