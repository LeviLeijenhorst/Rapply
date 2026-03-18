import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import workflowImage from "@/coaches/coaches-3.png";

export default function CoachesWorkflowSection() {
  return (
    <section className="w-full pb-[20px] bg-white bg-[linear-gradient(135deg,rgba(169,217,243,0.5)_0%,rgba(237,194,217,0.5)_100%)]">
      <SectionContainer contentClassName="pt-[60px] pb-[60px]">
        <div className="grid w-full items-start gap-10 lg:grid-cols-2">
          <div className="flex w-full flex-col items-start gap-4 lg:self-center">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              Jouw <span className="text-[#BD0265]">werkwijze</span>
            </h1>
            <div className="max-w-xl space-y-5 text-[16px] font-medium text-black/70">
              <p>
                Elke coach heeft een eigen werkwijze. Daarom werkt Rapply
                met templates afgestemd op loopbaan- en re-integratiecoaching.
              </p>
              <p>
                De templates zijn ontwikkeld in samenwerking met coaches uit het
                werkveld, zodat ze aansluiten op hoe gesprekken echt verlopen en
                hoe rapportages worden samengesteld.
              </p>
              <p>
                Mocht er niets tussen zitten? Geen probleem. Ontwerp gemakkelijk
                je eigen template die precies aansluit op jouw unieke stijl.
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
