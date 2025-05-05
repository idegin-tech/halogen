import DashboardLayout from "../layout/DashboardLayout";
import { BuilderProvider } from "@/context/builder.context";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuilderProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </BuilderProvider>
  );
}