import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import workflowImage from "@/coaches/coaches-3.png";

export default function CoachesWorkflowSection() {
  return (
    <section className="w-full pb-[20px] bg-white bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)]">
      <SectionContainer contentClassName="pt-[60px] pb-[60px]">
        <div className="grid w-full items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex w-full flex-col items-start gap-4 lg:self-center">
            <h1 className="font-[var(--font-catamaran)] text-[34px] font-medium leading-[120%] text-black md:text-[40px]">
              Automatische <span className="text-[#BD0265]">rapportages</span>
            </h1>
            <div className="max-w-lg space-y-5 text-[16px] font-medium text-black/70">
              <p>
                Met Rapply genereer je professionele verslagen die direct
                bruikbaar zijn. Of het nu gaat om rapportages voor
                opdrachtgevers, UWV of je eigen dossiervorming, Rapply
                zorgt voor verslagen die voldoen aan de eisen van het werkveld.
              </p>
              <p>
                Kies een template die past bij jouw werkwijze, of ontwerp je
                eigen. Jij bepaalt hoe het verslag eruitziet.
              </p>
            </div>
          </div>
          <div className="mt-5 flex w-full justify-center lg:justify-end">
            <Image
              src={workflowImage}
              alt="Rapply templates op laptop"
              className="h-auto w-full max-w-[360px] object-contain md:max-w-[500px] xl:max-w-[640px]"
              priority
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
