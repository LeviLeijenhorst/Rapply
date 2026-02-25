import OverOnsContactSection from "@/components/over-ons/OverOnsContactSection";

export default function ContactPage() {
  return (
    <div className="w-full">
      <div className="flex w-full flex-col">
        <OverOnsContactSection
          useRoundedContainer
          useLightTheme
          sectionContentClassName="pt-6 pb-[80px] md:pt-10 md:pb-[80px]"
        />
      </div>
    </div>
  );
}
