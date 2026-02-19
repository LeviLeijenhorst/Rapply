import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import AvailabilitySection from "@/components/home/AvailabilitySection";
import SecuritySection from "@/components/home/SecuritySection";
import FrequentlyAskedQuestionsSection from "@/components/home/FrequentlyAskedQuestionsSection";
// import PricingSection from "@/components/home/PricingSection";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Home page sections */}
      <div className="flex w-full flex-col">
        {/* Hero */}
        <HeroSection />
        {/* Features */}
        <FeaturesSection />
        {/* Security */}
        <SecuritySection disableAnimations />
        {/* Availability */}
        <AvailabilitySection />
        {/* Pricing */}
        {/* <PricingSection /> */}
        {/* Frequently asked questions */}
        <FrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
