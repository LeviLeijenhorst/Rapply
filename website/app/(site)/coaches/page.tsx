import CoachesWorkflowSection from "@/components/coaches/CoachesWorkflowSection";
import CoachesTypesSection from "@/components/coaches/CoachesTypesSection";
import CoachesCtaSection from "@/components/coaches/CoachesCtaSection";
import CoachesFrequentlyAskedQuestionsSection from "@/components/coaches/CoachesFrequentlyAskedQuestionsSection";
import ProductCoachesSection from "@/components/product/ProductCoachesSection";
import SecuritySection from "@/components/home/SecuritySection";
import WinWinSection from "@/components/home/WinWinSection";

export default function CoachesPage() {
  return (
    <div className="coaches-page w-full">
      <div className="flex w-full flex-col">
        <CoachesCtaSection />
        <CoachesTypesSection />
        <ProductCoachesSection />
        <CoachesWorkflowSection />
        <SecuritySection plainBackground />
        <WinWinSection />
        <CoachesFrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
