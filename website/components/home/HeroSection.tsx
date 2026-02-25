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
          <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[120%] text-black md:text-[50px] xl:text-[64px]">
            AI-gegenereerde rapportages
            <span className="block">
              voor{" "}
              <span className="text-[#BD0265]">
                loopbaan- en re-integratieprofessionals
              </span>
            </span>
          </h1>
          {/* Hero description */}
          <p className="max-w-3xl text-[16px] font-medium text-black/70">
            CoachScribe helpt loopbaan- en re-integratieprofessionals bij de
            verslaglegging van hun sessies en het bewaren van overzicht per
            traject.
            <br />
            Gesprekken worden veilig vastgelegd en georganiseerd, zodat jij je
            volledig kunt focussen op de client.
          </p>
          {/* Hero actions */}
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              label="Probeer het uit"
              destination="https://app.coachscribe.nl"
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

