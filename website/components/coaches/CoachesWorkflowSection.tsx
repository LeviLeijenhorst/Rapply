import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import workflowImage from "@/coaches/coaches-3.png";

export default function CoachesWorkflowSection() {
  return (
    <section className="w-full bg-[linear-gradient(135deg,#A9D9F3_0%,#EDC2D9_100%)]">
      <SectionContainer>
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          <div className="flex w-full flex-col items-start gap-6">
            <h1 className="text-4xl font-semibold leading-tight text-[#1D0A00] md:text-6xl">
              Jouw <span className="text-[#BD0265]">werkwijze</span>
            </h1>
            <div className="max-w-xl space-y-5 text-lg font-normal leading-relaxed text-[#243747]">
              <p>
                Elke coach heeft een eigen werkwijze. Daarom werkt CoachScribe
                met templates die zijn afgestemd op verschillende
                coachingsvormen, zoals loopbaan-, life-, budget- en
                studentencoaching.
              </p>
              <p>
                Deze templates zijn ontwikkeld in samenwerking met coaches,
                zodat ze aansluiten op hoe gesprekken echt verlopen.
              </p>
              <p>
                Mocht er niets tussen zitten? Geen probleem. Ontwerp gemakkelijk
                je eigen template die precies aansluit op jouw unieke manier van
                verslaglegging.
              </p>
            </div>
          </div>
          <div className="flex w-full justify-center lg:justify-end">
            <Image
              src={workflowImage}
              alt="CoachScribe templates op laptop"
              className="h-auto w-full max-w-[640px] object-contain"
              priority
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
