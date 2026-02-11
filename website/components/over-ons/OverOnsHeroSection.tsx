import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

export default function OverOnsHeroSection() {
  return (
    <SectionContainer className="bg-[#F8F9F9]">
      <div className="flex w-full flex-col items-center gap-10">
        <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
          <h1 className="text-5xl font-semibold leading-tight text-[#1D0A00] md:text-7xl">
            <span className="block">De gezichten achter</span>
            <span className="block text-[#BD0265]">CoachScribe</span>
          </h1>
          <p className="max-w-2xl text-base font-normal leading-relaxed text-[#1D0A00] md:text-lg">
            Wij geloven dat goede coaching begint bij rust, focus en aandacht.
            Coaches doen intens en betekenisvol werk en wij willen hen
            ondersteunen met tools die ruimte geven om echt aanwezig te zijn bij
            de cliënt.
          </p>
          <Button
            label="Contact"
            destination="#contact"
            showArrow
            className="font-normal"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
