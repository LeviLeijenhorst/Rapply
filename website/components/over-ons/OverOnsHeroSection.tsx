import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

export default function OverOnsHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="flex w-full flex-col gap-10">
        <div className="flex w-full flex-col items-center gap-6 text-center lg:translate-y-[56px]">
          <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
            <span className="block">Technologie voor mensen,</span>
            <span className="block text-[#BD0265]">door mensen</span>
          </h1>
          <p className="max-w-3xl text-[16px] font-medium text-black/70">
            Wij bouwen Rapply vanuit één overtuiging:
            <br />
            dat technologie er is om menselijk contact te versterken, niet te
            vervangen.
            <br />
            Zodat jij je kunt richten op waarom je dit vak hebt gekozen.
          </p>
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              label="Maak een afspraak"
              destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
              openInNewTab
              showArrow
              className="font-normal"
            />
            <Button
              label="Contact"
              destination="/contact"
              variant="secondary"
              className="font-normal"
            />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
