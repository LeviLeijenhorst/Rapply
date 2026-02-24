import ProductHeroSection from "@/components/product/ProductHeroSection";
import ProductOverviewSection from "@/components/product/ProductOverviewSection";
import ProductImpactSection from "@/components/product/ProductImpactSection";
import ProductCoachesSection from "@/components/product/ProductCoachesSection";
import SecuritySection from "@/components/home/SecuritySection";
import AvailabilitySection from "@/components/home/AvailabilitySection";
import ProductFrequentlyAskedQuestionsSection from "@/components/product/ProductFrequentlyAskedQuestionsSection";
import PricingSection from "@/components/home/PricingSection";

export default function ProductPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <ProductHeroSection />
        <ProductOverviewSection />
        <ProductImpactSection />
        <ProductCoachesSection />
        <SecuritySection disableAnimations />
        <AvailabilitySection />
        <PricingSection />
        <ProductFrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
