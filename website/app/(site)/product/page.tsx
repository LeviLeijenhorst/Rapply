import ProductHeroSection from "@/components/product/ProductHeroSection";
import CoachesWorkflowSection from "@/components/coaches/CoachesWorkflowSection";
import ProductOverviewSection from "@/components/product/ProductOverviewSection";
import ProductImpactSection from "@/components/product/ProductImpactSection";
import ProductCoachesSection from "@/components/product/ProductCoachesSection";
import SecuritySection from "@/components/home/SecuritySection";
import AvailabilitySection from "@/components/home/AvailabilitySection";
import ProductFrequentlyAskedQuestionsSection from "@/components/product/ProductFrequentlyAskedQuestionsSection";
import WinWinSection from "@/components/home/WinWinSection";

export default function ProductPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <ProductHeroSection />
        <div className="mt-[160px]">
          <CoachesWorkflowSection />
        </div>
        <div className="mt-[80px] flex w-full justify-center px-6 pb-[40px] text-center md:px-10">
          <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
            Ervaar rust met <span className="text-[#BD0265]">onze features</span>
          </h2>
        </div>
        <ProductOverviewSection />
        <ProductImpactSection />
        <ProductCoachesSection />
        <SecuritySection disableAnimations />
        <AvailabilitySection />
        <WinWinSection />
        <ProductFrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
