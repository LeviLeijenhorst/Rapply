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
          <h1 className="font-[var(--font-catamaran)] text-[64px] font-medium leading-[120%] text-black">
            Betere coaching begint bij
            <span className="block text-[#BD0265]">volledige aandacht</span>
          </h1>
          {/* Hero description */}
          <p className="max-w-3xl text-[16px] font-medium text-black/70">
            CoachScribe helpt coaches bij verslaglegging van hun sessies en het
            bewaren van overzicht.
            <br />
            Gesprekken worden veilig vastgelegd en georganiseerd, zodat jij je
            volledig kan focussen op de cliënt.
          </p>
          {/* Hero actions */}
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Button
              label="Wachtlijst"
              destination="/wachtlijst"
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
