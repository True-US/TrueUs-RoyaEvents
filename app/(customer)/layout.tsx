import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
