import BlockConfigForm from "./block-config-form/BlockConfigForm";

export default function RightPanel() {
  return (
    <>
      <aside
        className={
          "w-[400px] border-l border-divider h-[calc(100vh-4rem)] bg-content1"
        }
      >
        <BlockConfigForm />
      </aside>
    </>
  );
}
