import Image from "next/image";
import SectionContainer from "@/components/home/SectionContainer";
import phoneAndLaptopImage from "@/home/phone-and-laptop.png";

export default function AvailabilitySection() {
  return (
    <SectionContainer className="bg-white" contentClassName="md:pt-20 md:pb-20">
      {/* Availability content */}
      <div className="w-full rounded-3xl bg-[linear-gradient(to_top_right,_#B8D4FF,_#C6AFFF)] p-6">
        <div className="mx-auto flex w-full flex-col items-center gap-6 md:w-fit md:flex-row md:items-center md:justify-center md:gap-16">
          {/* Availability media */}
          <div className="flex w-full items-center justify-center md:w-fit md:self-start md:pt-14 md:pb-14">
            {/* Availability image */}
            <Image
              src={phoneAndLaptopImage}
              alt="CoachScribe on mobile and desktop"
              className="h-auto w-full max-w-md object-contain"
            />
          </div>
          {/* Availability text */}
          <div className="flex w-full flex-col items-center gap-4 text-center md:w-fit md:items-start md:text-left">
            {/* Availability title */}
            <h3 className="font-[var(--font-catamaran)] text-[40px] font-medium leading-[120%] text-white">
              Binnenkort ook
              <br />
              op Android en iOS
            </h3>
            {/* Availability description */}
            <p className="text-[16px] font-medium text-white/90">
              Gebruik CoachScribe op je laptop, tablet of telefoon.
              <br />
              Alles blijft gesynchroniseerd.
            </p>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
