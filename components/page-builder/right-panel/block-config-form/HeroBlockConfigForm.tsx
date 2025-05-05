import { Input, Textarea } from "@heroui/react";
import { Select, SelectItem } from "@heroui/select";

import PropertyFormContainer from "@/components/page-builder/right-panel/block-config-form/PropertyFormContainer";

export default function HeroBlockConfigForm() {
  return (
    <PropertyFormContainer
      leftComponent={
        <Select placeholder={"Select type"} size={"sm"}>
          <SelectItem>Default</SelectItem>
          <SelectItem>2 Column layout</SelectItem>
          <SelectItem>SaaS Layout</SelectItem>
        </Select>
      }
    >
      <Input label="Heading" size={"sm"} type="text" />
      <Input label="Subheading" size={"sm"} type="text" />
      <Textarea label="Description" placeholder="Enter your description" />
    </PropertyFormContainer>
  );
}
