import PropertyForm from "@/components/page-builder/right-panel/block-config-form/PropertyForm";

export default function RightPanel() {
  return (
    <>
      <aside
        className={
          "w-[400px] border-l border-divider h-[calc(100vh-4rem)] bg-content1"
        }
      >
        <PropertyForm />
      </aside>
    </>
  );
}
