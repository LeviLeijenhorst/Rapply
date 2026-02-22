import SectionContainer from "@/components/home/SectionContainer";

export default function VeiligheidEthicsSection() {
  return (
    <>
      <SectionContainer className="bg-white" contentClassName="pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="flex w-full flex-col gap-10">
          <div className="flex w-full flex-col items-start gap-[16px] text-left">
            <h2 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-black">
              Aanvullende <span className="text-[#BD0265]">versleuteling tijdens opslag</span>
            </h2>
            <div className="w-full text-left">
              <p className="text-base font-normal leading-relaxed text-[#1D0A00]">
                Gegevens worden opgeslagen binnen de Europese Unie en zijn
                versleuteld. Daarnaast passen wij een extra versleutelingslaag
                toe. De encryptiesleutels worden beheerd buiten de cloud-omgeving
                waarin de gegevens worden opgeslagen. De aanvullende
                versleuteling zorgt ervoor dat opgeslagen gegevens binnen de
                cloud niet leesbaar zijn voor de cloud-provider.
              </p>
            </div>
          </div>
        </div>
      </SectionContainer>
      <SectionContainer
        className="bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))]"
        contentClassName="pt-16 pb-14 md:pt-20 md:pb-20"
      >
        <div className="flex w-full flex-col gap-6">
          <h3 className="font-[var(--font-catamaran)] text-[30px] font-medium leading-[120%] text-black md:text-[40px]">
            Wat we <span className="text-[#BD0265]">wel en niet doen</span>
          </h3>
          <div className="grid w-full gap-8 md:grid-cols-2">
            <div className="flex w-full flex-col gap-4">
              <h4 className="font-[var(--font-catamaran)] text-[20px] font-bold text-black md:text-[24px]">
                Wat we <span className="text-[#BD0265]">doen</span>
              </h4>
              <ul className="list-disc pl-6 text-sm font-normal leading-relaxed text-[#1D0A00] md:text-base">
                <li>Opslag van aan sessies gerelateerde gegevens binnen de Europese Unie</li>
                <li>Versleutelde opslag met aanvullende versleutelingslaag</li>
                <li>Encryptiesleutels worden buiten de opslagomgeving beheerd</li>
                <li>Verwerkersovereenkomst beschikbaar</li>
                <li>Transparantie over subverwerkers</li>
              </ul>
            </div>
            <div className="flex w-full flex-col gap-4">
              <h4 className="font-[var(--font-catamaran)] text-[20px] font-bold text-black md:text-[24px]">
                Wat we <span className="text-[#BD0265]">niet doen</span>
              </h4>
              <ul className="list-disc pl-6 text-sm font-normal leading-relaxed text-[#1D0A00] md:text-base">
                <li>Geen verkoop van data</li>
                <li>Geen advertenties</li>
                <li>Geen training van AI-modellen op jouw inhoud</li>
                <li>Geen verwerking buiten de Europese Unie</li>
              </ul>
            </div>
          </div>
        </div>
      </SectionContainer>
    </>
  );
}
