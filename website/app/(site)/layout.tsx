import NavigationBar from "@/components/NavigationBar";
import Footer from "@/components/Footer";
import PageEnterTransition from "@/components/PageEnterTransition";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {/* Navigation bar */}
      <NavigationBar />
      {/* Page content */}
      <main className="mt-36 flex w-full flex-1 flex-col bg-white">
        <PageEnterTransition>{children}</PageEnterTransition>
      </main>
      {/* Footer */}
      <Footer />
    </div>
  );
}
