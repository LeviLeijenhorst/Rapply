import Image from "next/image";
import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";
import ctaImage from "@/coaches/coaches-1.jpg";

export default function CoachesCtaSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="md:pb-0">
      <div className="grid w-full items-center gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start lg:-translate-y-[30px]">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span className="block">Is Rapply</span>
              <span className="block text-[#BD0265]">iets voor jou?</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70">
              Ben jij een loopbaan- of re-integratiecoach en ervaar je mentale
              druk door het bijhouden van sessies en clienten? Ben je te veel
              tijd kwijt aan voorbereiding en naslagwerk? Wellicht dat wij jou
              kunnen helpen.
            </p>
          </div>
          <div className="mt-6">
            <Button
              label="Maak een afspraak"
              destination="https://calendly.com/jonaskroon/new-meeting?month=2026-02"
              openInNewTab
              showArrow
              className="font-normal"
            />
          </div>
        </div>
        <div className="flex w-full justify-center lg:justify-end">
          <Image
            src={ctaImage}
            alt="Rapply helpt coaches vliegen"
            className="h-auto w-full max-w-[500px] object-contain lg:origin-top-right lg:-translate-x-[30px] lg:scale-[0.86]"
            priority
          />
        </div>
      </div>
    </SectionContainer>
  );
}
