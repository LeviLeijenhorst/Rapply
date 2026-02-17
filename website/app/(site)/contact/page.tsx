import OverOnsContactSection from "@/components/over-ons/OverOnsContactSection";

export default function ContactPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <OverOnsContactSection
          useRoundedContainer={false}
          useLightTheme
        />
      </div>
    </div>
  );
}
