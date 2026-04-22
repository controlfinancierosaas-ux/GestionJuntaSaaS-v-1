import Sidebar from "@/components/Sidebar";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-0">
        {children}
      </main>
    </div>
  );
}
