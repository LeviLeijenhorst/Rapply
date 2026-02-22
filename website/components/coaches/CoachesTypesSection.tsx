import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import briefcaseIcon from "@/coaches/briefcase.svg";
import peopleIcon from "@/coaches/people.svg";

type CoachType = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const coachTypes: CoachType[] = [
  {
    title: "Loopbaancoach",
    description:
      "Een loopbaancoach begeleidt mensen bij vragen over werk, richting en persoonlijke ontwikkeling, vaak over meerdere gesprekken en trajecten heen.",
    icon: briefcaseIcon,
  },
  {
    title: "Re-integratiecoach",
    description:
      "Een re-integratiecoach begeleidt mensen die na ziekte, ontslag of een andere onderbreking terugkeren naar de arbeidsmarkt. Zorgvuldige verslaglegging is hierbij essentieel.",
    icon: peopleIcon,
  },
];

export default function CoachesTypesSection() {
  return (
    <SectionContainer
      className="bg-[rgba(245,245,245,0.5)] md:mt-4"
      contentClassName="pt-[60px] md:pb-20"
    >
      <div className="flex w-full flex-col gap-8 md:gap-10">
        <h2 className="text-center text-3xl font-semibold leading-tight text-black md:text-4xl">
          Doelgroep
        </h2>
        <div className="grid w-full gap-6 md:grid-cols-2">
          {coachTypes.map((coachType) => (
            <article
              key={coachType.title}
              className="flex w-full flex-col gap-4 rounded-2xl border border-[#DDDDDD] bg-white p-6"
            >
              <h3 className="flex items-center gap-3 text-[20px] font-semibold text-[#BD0265]">
                <Image src={coachType.icon} alt="" width={20} height={20} />
                <span className="text-[20px]">{coachType.title}</span>
              </h3>
              <p className="text-base font-normal leading-relaxed text-[#243747]">
                {coachType.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
