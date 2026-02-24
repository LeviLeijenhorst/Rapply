import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import heroImage from "@/veiligheid/veiligheid-1.jpg";

export default function VeiligheidHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span className="block text-[#BD0265]">Gebouwd voor</span>
              <span className="block">vertrouwelijke gesprekken</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70">
              CoachScribe is ontworpen voor gesprekken met gevoelige informatie.
              Met verwerking binnen de Europese Unie en aanvullende
              versleuteling tijdens opslag.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              label="Privacybeleid bekijken"
              destination="/privacybeleid"
              className="font-normal"
            />
            <Button
              label="Verwerkersovereenkomst genereren"
              destination="/verwerkersovereenkomst"
              variant="secondary"
              className="font-normal"
            />
          </div>
        </div>
        <div className="flex w-full justify-center lg:-translate-y-[40px] lg:justify-end">
          <Image
            src={heroImage}
            alt="Coach aan bureau met documenten"
            className="h-auto w-full max-w-[340px] object-contain scale-[0.9] md:max-w-[440px] xl:max-w-[520px]"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}
