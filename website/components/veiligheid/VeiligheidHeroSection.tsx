import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import heroImage from "@/veiligheid/veiligheid-1.jpg";

export default function VeiligheidHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start lg:-translate-y-[60px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[64px] font-medium leading-[110%] text-black">
              <span className="block text-[#BD0265]">Veiligheid</span>
              <span className="block">zoals het hoort</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70">
              Coaches werken met gevoelige informatie en die verantwoordelijkheid
              nemen we serieus. Jij blijft altijd eigenaar van jouw data.
            </p>
          </div>
          <div className="mt-6">
            <Button
              label="Wachtlijst"
              destination="/wachtlijst"
              showArrow
              className="font-normal"
            />
          </div>
        </div>
        <div className="flex w-full justify-center lg:-translate-y-[40px] lg:justify-end">
          <Image
            src={heroImage}
            alt="Coach aan bureau met documenten"
            className="h-auto w-full max-w-[520px] object-contain scale-[0.9]"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}
