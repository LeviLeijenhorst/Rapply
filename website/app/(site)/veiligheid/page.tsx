import VeiligheidHeroSection from "@/components/veiligheid/VeiligheidHeroSection";
import VeiligheidSecuritySection from "@/components/veiligheid/VeiligheidSecuritySection";
import VeiligheidEthicsSection from "@/components/veiligheid/VeiligheidEthicsSection";
import VeiligheidFaqSection from "@/components/veiligheid/VeiligheidFaqSection";

export default function VeiligheidPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <VeiligheidHeroSection />
        <VeiligheidSecuritySection />
        <VeiligheidEthicsSection />
        <VeiligheidFaqSection />
      </div>
    </div>
  );
}
