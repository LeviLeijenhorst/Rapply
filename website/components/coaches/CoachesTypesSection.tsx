import Image, { StaticImageData } from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import briefcaseIcon from "@/coaches/briefcase.svg";
import lovelyIcon from "@/coaches/lovely.svg";
import presentationChartIcon from "@/coaches/presention-chart.svg";
import emptyWalletIcon from "@/coaches/empty-wallet.svg";
import peopleIcon from "@/coaches/people.svg";
import teacherIcon from "@/coaches/teacher.svg";
import batteryEmptyIcon from "@/coaches/battery-empty-2.svg";
import gameboyIcon from "@/coaches/gameboy.svg";
import globalIcon from "@/coaches/global.svg";

type CoachType = {
  title: string;
  description: string;
  icon: StaticImageData;
};

const coachTypes: CoachType[] = [
  {
    title: "Loopbaan Coach",
    description:
      "Een loopbaancoach begeleidt mensen bij vragen over werk, richting en persoonlijke ontwikkeling, vaak over meerdere gesprekken en trajecten heen.",
    icon: briefcaseIcon,
  },
  {
    title: "Life Coach",
    description:
      "Een lifecoach helpt mensen bij persoonlijke vraagstukken en begeleidt hen in het creëren van meer balans, richting en bewustzijn in het dagelijks leven.",
    icon: lovelyIcon,
  },
  {
    title: "Business Coach",
    description:
      "Een business coach begeleidt professionals en ondernemers bij professionele ontwikkeling, besluitvorming en het realiseren van zakelijke doelen.",
    icon: presentationChartIcon,
  },
  {
    title: "Budget Coach",
    description:
      "Een budgetcoach helpt mensen grip te krijgen op hun financiën door inzicht te creëren in inkomsten, uitgaven en financiële keuzes.",
    icon: emptyWalletIcon,
  },
  {
    title: "Leadership Coach",
    description:
      "Een leadership coach begeleidt professionals in het ontwikkelen van effectief leiderschap, zelfinzicht en impact binnen hun rol en organisatie.",
    icon: peopleIcon,
  },
  {
    title: "Studenten Coach",
    description:
      "Een studentencoach ondersteunt studenten bij studie, planning en ontwikkeling, zodat zij hun doelen beter kunnen bereiken en uitdagingen effectief aanpakken.",
    icon: teacherIcon,
  },
  {
    title: "Mental Health Coach",
    description:
      "Een mental health coach begeleidt mensen bij hun mentale welzijn, helpt bij het omgaan met stress en emoties, en ondersteunt hen in het versterken van veerkracht en balans.",
    icon: batteryEmptyIcon,
  },
  {
    title: "Jongeren Coach",
    description:
      "Een jongerencoach ondersteunt jongeren bij persoonlijke ontwikkeling, keuzes en uitdagingen, zodat zij sterker, bewuster en veerkrachtiger in het leven staan.",
    icon: gameboyIcon,
  },
  {
    title: "Nog veel meer",
    description:
      "Het coachingsveld is rijk en gevarieerd, met nog talloze coaches die elk op hun eigen manier impact maken en waarde toevoegen aan het traject van hun cliënten.",
    icon: globalIcon,
  },
];

export default function CoachesTypesSection() {
  return (
    <SectionContainer className="bg-[#F5F5F5]">
      <div className="flex w-full flex-col gap-8 md:gap-10">
        <h2 className="text-center text-4xl font-semibold leading-tight text-[#1D0A00] md:text-7xl">
          Coach: een breed begrip
        </h2>
        <div className="grid w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          {coachTypes.map((coachType) => (
            <article
              key={coachType.title}
              className="flex w-full flex-col gap-4 rounded-2xl border border-[#DDDDDD] bg-[#F5F5F5] p-6"
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
