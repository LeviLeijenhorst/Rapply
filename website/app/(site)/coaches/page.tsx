import CoachesWorkflowSection from "@/components/coaches/CoachesWorkflowSection";
import CoachesTypesSection from "@/components/coaches/CoachesTypesSection";
import CoachesCtaSection from "@/components/coaches/CoachesCtaSection";
import ProductCoachesSection from "@/components/product/ProductCoachesSection";
import SecuritySection from "@/components/home/SecuritySection";
import CoachesFrequentlyAskedQuestionsSection from "@/components/coaches/CoachesFrequentlyAskedQuestionsSection";

export default function CoachesPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <CoachesCtaSection />
        <CoachesTypesSection />
        <CoachesWorkflowSection />
        <ProductCoachesSection />
        <SecuritySection />
        <CoachesFrequentlyAskedQuestionsSection />
      </div>
    </div>
  );
}
