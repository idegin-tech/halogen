import HeroBlockConfigForm from "@/components/page-builder/right-panel/block-config-form/HeroBlockConfigForm";

export default function PropertyForm() {
  const type = "hero";
  // const type = 'about';

  switch (type) {
    case "hero":
      return <HeroBlockConfigForm />;
    default:
      return (
        <div className={"py-10"}>
          <p>Please select a block</p>
        </div>
      );
  }
}
