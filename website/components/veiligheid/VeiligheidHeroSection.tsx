import Image from "next/image";
import Link from "next/link";
import SectionContainer from "@/components/home/SectionContainer";
import arrowRightIcon from "@/veiligheid/arrow-right.svg";
import heroImage from "@/veiligheid/veiligheid-1.jpg";

export default function VeiligheidHeroSection() {
  return (
    <SectionContainer className="bg-white">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start gap-6">
          <h1 className="text-4xl font-semibold leading-tight text-[#243747] sm:text-5xl md:text-6xl">
            <span className="block text-[#BD0265]">Veiligheid</span>
            <span className="block">zoals het hoort</span>
          </h1>
          <p className="max-w-md text-base font-normal text-black">
            Coaches werken met gevoelige informatie en die verantwoordelijkheid
            nemen we serieus. Jij blijft altijd eigenaar van jouw data.
          </p>
          <Link
            href="https://app.coachscribe.nl"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#BD0265] px-5 text-base font-semibold text-white transition-colors hover:bg-[#9F0055]"
          >
            <span>Probeer Gratis</span>
            <Image
              src={arrowRightIcon}
              alt=""
              width={20}
              height={20}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
        <div className="flex w-full justify-center lg:justify-end">
          <Image
            src={heroImage}
            alt="Coach aan bureau met documenten"
            className="h-auto w-full max-w-[520px]"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}
