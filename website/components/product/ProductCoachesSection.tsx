import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import coachesImage from "@/product/product-4.jpg";

export default function ProductCoachesSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full justify-center lg:justify-start">
          <Image
            src={coachesImage}
            alt="CoachScribe door coaches ontwikkeld"
            className="h-auto w-full max-w-[520px] rounded-2xl border border-[#243747]"
          />
        </div>
        <div className="flex w-full flex-col items-start gap-6">
          <h2 className="text-3xl font-semibold leading-tight text-black md:text-4xl">
            Voor coaches, <span className="text-[#BD0265]">door coaches</span>
          </h2>
          <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
            CoachScribe is ontstaan uit tientallen gesprekken met professionals
            in het werkveld. Door te onderzoeken welke functies echt waardevol
            zijn, hebben we een product ontwikkeld dat volledig aansluit bij de
            behoeften van coaches.
          </p>
          <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
            We blijven continu in contact met coaches om het product te
            verbeteren en verder te ontwikkelen.
          </p>
          <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
            Wil je meedenken of input geven? Neem contact met ons op!
          </p>
          <Button
            label="Contact"
            destination="mailto:contact@coachscribe.nl"
            variant="primary"
            showArrow
            className="font-normal"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
