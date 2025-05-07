import BlockConfigForm from "./block-config-form/BlockConfigForm";
import { useLayoutContext } from "@/context/layout.context";

export default function RightPanel() {
  const { state } = useLayoutContext();
  
  return (
    <>
      <aside
        className={
          `w-[400px] border-l border-divider h-[calc(100vh-4rem)] bg-content1 
           transition-all duration-300 ease-in-out
           ${state.showRightPanel ? 'translate-x-0-' : 'translate-x-full fixed right-0'}`
        }
      >
        <BlockConfigForm />
      </aside>
    </>
  );
}
