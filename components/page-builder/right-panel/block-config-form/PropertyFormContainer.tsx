export default function PropertyFormContainer({
  leftComponent,
  children,
}: {
  children: React.ReactNode;
  leftComponent: React.ReactNode;
}) {
  return (
    <>
      <div className={"h-body max-h-body select-none"}>
        <header
          className={
            "border-b border-divider h-header flex items-center justify-between px-default"
          }
        >
          <div className={"w-[50%] flex items-center"}>{leftComponent}</div>
          <div />
        </header>
        <div className={"p-default h-panel-body max-h-panel-body overflow-y-auto space-y-default select-none"}>
          {children}
        </div>
      </div>
    </>
  );
}
