import DashboardLayout from "../../../layout/DashboardLayout";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>{children}</DashboardLayout>
  );
}