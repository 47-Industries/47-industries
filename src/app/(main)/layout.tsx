import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "47 Industries - 3D Printing, Web & App Development",
  description: "Leading provider of 3D printing services, custom manufacturing, and innovative web and app development solutions. Parent company to MotoRev.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
