import OverOnsHeroSection from "@/components/over-ons/OverOnsHeroSection";
import OverOnsValuesSection from "@/components/over-ons/OverOnsValuesSection";
import OverOnsFoundersSection from "@/components/over-ons/OverOnsFoundersSection";
import OverOnsContactSection from "@/components/over-ons/OverOnsContactSection";

export default function OverOnsPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <OverOnsHeroSection />
        <OverOnsValuesSection />
        <OverOnsFoundersSection />
        <OverOnsContactSection />
      </div>
    </div>
  );
}
