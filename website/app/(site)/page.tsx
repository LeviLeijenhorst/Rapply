import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import Button from "@/components/Button";
import AvailabilitySection from "@/components/home/AvailabilitySection";
import SecuritySection from "@/components/home/SecuritySection";
import FrequentlyAskedQuestionsSection from "@/components/home/FrequentlyAskedQuestionsSection";
import WinWinSection from "@/components/home/WinWinSection";
import ProductCoachesSection from "@/components/product/ProductCoachesSection";

export default function HomePage() {
  return (
    <div className="w-full">
      {/* Home page sections */}
      <div className="flex w-full flex-col">
        {/* Hero */}
        <HeroSection />
        {/* Features */}
        <div className="mt-[160px]">
          <FeaturesSection contentClassName="pt-0 pb-10 md:pt-0 md:pb-10" />
        </div>
        <div className="flex w-full justify-center pt-10 pb-20">
          <Button
            label="Maak een afspraak"
            destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
            openInNewTab
            variant="primary"
            showArrow
            className="font-normal"
          />
        </div>
        {/* Security */}
        <SecuritySection disableAnimations />
        <ProductCoachesSection />
        {/* Availability */}
        <AvailabilitySection compactTopSpacing />
        {/* Win-win */}
        <WinWinSection />
        {/* Frequently asked questions */}
        <FrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
