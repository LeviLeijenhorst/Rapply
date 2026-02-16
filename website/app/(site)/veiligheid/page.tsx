import VeiligheidHeroSection from "@/components/veiligheid/VeiligheidHeroSection";
import VeiligheidEthicsSection from "@/components/veiligheid/VeiligheidEthicsSection";
import VeiligheidFaqSection from "@/components/veiligheid/VeiligheidFaqSection";
import SecuritySection from "@/components/home/SecuritySection";

export default function VeiligheidPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <VeiligheidHeroSection />
        <SecuritySection duplicateCards showActionButton={false} />
        <VeiligheidEthicsSection />
        <VeiligheidFaqSection />
      </div>
    </div>
  );
}
