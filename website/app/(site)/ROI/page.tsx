import PricingSection from "@/components/home/PricingSection";

export default function RoiPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <PricingSection disableReveal isStandalonePage />
      </div>
    </div>
  );
}
