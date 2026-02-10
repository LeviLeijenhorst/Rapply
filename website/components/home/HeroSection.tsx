import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

export default function HeroSection() {
  return (
    <SectionContainer className="bg-white">
      {/* Hero content */}
      <div className="flex w-full flex-col gap-10">
        {/* Hero text */}
        <div className="flex w-full flex-col items-center gap-6 text-center">
          {/* Hero title */}
          <h1 className="text-4xl font-semibold text-black md:text-5xl">
            Betere coaching begint bij
            <span className="block text-[#BD0265]">Volledige aandacht</span>
          </h1>
          {/* Hero description */}
          <p className="max-w-2xl text-base font-normal text-black/70 md:text-lg">
            CoachScribe helpt coaches bij de verslaglegging van hun sessies en
            het bewaren van het overzicht. Gesprekken worden veilig vastgelegd
            en georganiseerd, zodat jij je volledig kunt focussen op de client.
          </p>
          {/* Hero actions */}
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              label="Probeer Gratis"
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
