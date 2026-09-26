import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

// page under the '(customer)' folder will share the same layout, which is defined in this file.
export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
