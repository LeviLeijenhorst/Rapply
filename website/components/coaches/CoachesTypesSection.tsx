import Image, { StaticImageData } from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import loopbaancoachesImage from "@/coaches/Loopbaanprofessionals.png";
import reintegratiecoachesImage from "@/coaches/Re-integratieprofessionals.png";

type CoachType = {
  title: string;
  description: string;
  image: StaticImageData;
};

const coachTypes: CoachType[] = [
  {
    title: "Loopbaancoaches",
    description:
      "Een loopbaancoach begeleidt mensen bij vragen over werk, richting en persoonlijke ontwikkeling, vaak over meerdere gesprekken en trajecten heen.",
    image: loopbaancoachesImage,
  },
  {
    title: "Re-integratiecoaches",
    description:
      "Een re-integratiecoach begeleidt mensen die na ziekte, ontslag of een andere onderbreking terugkeren naar de arbeidsmarkt. Zorgvuldige verslaglegging is hierbij essentieel.",
    image: reintegratiecoachesImage,
  },
];

export default function CoachesTypesSection() {
  return (
    <SectionContainer
      className="bg-white bg-[linear-gradient(to_top_right,_rgba(184,212,255,0.25),_rgba(198,175,255,0.25))] md:mt-4"
      contentClassName="!pt-[80px] !pb-[80px]"
    >
      <div className="flex w-full flex-col">
        <div className="grid w-full gap-6 md:grid-cols-2">
          {coachTypes.map((coachType) => (
            <article
              key={coachType.title}
              className="flex w-full flex-col items-center gap-4 rounded-2xl border border-[#DDDDDD] bg-white px-10 pt-10 pb-10 text-center"
            >
              <h3 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-[#BD0265]">
                {coachType.title}
              </h3>
              <Image
                src={coachType.image}
                alt={coachType.title}
                className="h-auto w-4/5 rounded-xl object-cover"
              />
              <p className="text-base font-normal leading-relaxed text-[#243747]">
                {coachType.description}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-[40px] flex w-full justify-center">
          <Button
            label="Maak een afspraak"
            destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
            openInNewTab
            variant="primary"
            showArrow
            className="font-normal"
          />
        </div>
      </div>
    </SectionContainer>
  );
}
