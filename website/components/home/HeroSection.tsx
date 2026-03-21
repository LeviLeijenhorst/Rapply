import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

export default function HeroSection() {
  return (
    <SectionContainer className="bg-white">
      {/* Hero content */}
      <div className="flex w-full flex-col gap-10">
        {/* Hero text */}
        <div className="flex w-full flex-col items-center gap-6 text-center lg:translate-y-[56px]">
          {/* Hero title */}
          <h1 className="mx-auto font-[var(--font-catamaran)] text-[38px] font-medium leading-[120%] text-black md:text-[50px] xl:text-[64px]">
            <span className="block text-[#BD0265]">AI-gegenereerde rapportages</span>
            <span className="block text-black">voor loopbaan- en</span>
            <span className="block whitespace-nowrap text-black">re-integratiecoaches</span>
          </h1>
          {/* Hero description */}
          <div className="mx-auto flex w-full flex-col items-center gap-0 text-[16px] font-medium text-black/70">
            <p className="text-center md:whitespace-nowrap">
              Rapply helpt loopbaan- en re-integratiecoaches bij de verslaglegging van hun sessies en het bewaren van het overzicht.
            </p>
            <p className="text-center">
              Gesprekken worden veilig vastgelegd en georganiseerd, zodat jij je volledig kunt richten op de cliënt.
            </p>
          </div>
          {/* Hero actions */}
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              label="Maak een afspraak"
              destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
              openInNewTab
              variant="primary"
              showArrow
              className="font-normal"
            />
            <Button
              label="Hoe Het Werkt"
              destination="/product"
              variant="secondary"
              className="font-normal"
            />
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
