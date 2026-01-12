import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProductsSection from "@/components/ProductsSection";
import PartnersSection from "@/components/PartnersSection";
import Footer from "@/components/Footer";
import ParticleField from "@/components/ParticleField";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated particle background */}
      <ParticleField />

      {/* Main content */}
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProductsSection />
        <PartnersSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
