import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/landing/Hero";
import EntryCards from "@/components/landing/EntryCards";
import Problem from "@/components/landing/Problem";
import Workflow from "@/components/landing/Workflow";
import Radar from "@/components/landing/Radar";
import Personas from "@/components/landing/Personas";
import Pricing from "@/components/landing/Pricing";
import CtaBanner from "@/components/landing/CtaBanner";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <EntryCards />
        <Problem />
        <Workflow />
        <Radar />
        <Personas />
        <Pricing />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
