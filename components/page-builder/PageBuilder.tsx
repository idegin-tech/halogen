"use client";
import RightPanel from "@/components/page-builder/right-panel/right-panel";
import BuilderHeader from "@/components/page-builder/header/builder-header";
import LeftPanel from "@/components/page-builder/left-panel/left-panel";

export default function PageBuilder() {
  return (
    <>
      <div
        className={
          "h-screen max-h-[100vh] w-screen max-w-[100vw] flex flex-col"
        }
      >
        <BuilderHeader />
        <div className={"flex h-body max-h-body relative"}>
          <LeftPanel />
          {/*<aside className={'shadow-md w-[300px] left-[3.5rem] absolute h-body max-h-body bg-content1 border-r border-divider'}>*/}

          {/*</aside>*/}
          <main className={"h-body bg-white flex-1"}>
            <iframe
              className={"h-body w-full"}
              src={"https://www.idegin.com"}
              title={"preview"}
            />
          </main>
          <RightPanel />
        </div>
      </div>
    </>
  );
}
