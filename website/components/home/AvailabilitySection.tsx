import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import phoneAndLaptopImage from "@/home/phone-and-laptop.png";

type AvailabilitySectionProps = {
  compactTopSpacing?: boolean;
};

export default function AvailabilitySection({
  compactTopSpacing = false,
}: AvailabilitySectionProps) {
  return (
    <SectionContainer
      className="bg-white"
      contentClassName={`${compactTopSpacing ? "md:pt-0" : "md:pt-20"} md:pb-20`}
    >
      {/* Availability content */}
      <div className="w-full rounded-3xl bg-[linear-gradient(to_top_right,_#B8D4FF,_#C6AFFF)] p-6">
        <div className="mx-auto flex w-full flex-col items-center gap-6 md:w-fit md:flex-row md:items-center md:justify-center md:gap-16">
          {/* Availability media */}
          <div className="flex w-full items-center justify-center md:w-fit md:self-start md:pt-14 md:pb-14">
            {/* Availability image */}
            <Image
              src={phoneAndLaptopImage}
              alt="Rapply on mobile and desktop"
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
          {/* Availability text */}
          <div className="flex w-full flex-col items-center gap-4 text-center md:w-fit md:items-start md:text-left">
            {/* Availability title */}
            <h3 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-white">
              Altijd binnen
              <br />
              handbereik
            </h3>
            {/* Availability description */}
            <p className="max-w-[300px] text-[16px] font-medium text-white/90 md:max-w-[320px]">
              Rapply werkt op je telefoon, tablet en laptop, gewoon via de browser. Sessies opnemen kan dus altijd en overal.
            </p>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
