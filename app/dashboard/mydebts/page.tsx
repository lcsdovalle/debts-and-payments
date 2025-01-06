import Table from "@/app/ui/invoices/table";
import { lusitana } from "@/app/ui/fonts";
import { InvoicesTableSkeleton } from "@/app/ui/skeletons";
import { Suspense } from "react";
import { Metadata } from "next";
import loggedUser from "@/middleware"
export const metadata: Metadata = {
  title: "Invoices | Payments Dashboard",
};

export default async function Page() {
  const user = await loggedUser()
  const query = user?.user.email ?? ""
  const currentPage = 1;
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Minhas Contas</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8"></div>
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
    </div>
  );
}
