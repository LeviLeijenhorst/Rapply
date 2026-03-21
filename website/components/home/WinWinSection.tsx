import Image from "next/image";
import Button from "@/components/Button";
import winwinImage from "@/ROI/winwin.png";

type WinWinSectionProps = {
  disableReveal?: boolean;
  isStandalonePage?: boolean;
};

export default function WinWinSection(props: WinWinSectionProps) {
  return (
    <section
      className={`w-full bg-[#BD0265] ${
        props.isStandalonePage ? "pt-4 pb-8 md:pt-6 md:pb-10" : "py-8 md:py-10"
      }`}
      data-reveal-disabled={props.disableReveal ? "1" : "0"}
    >
      <div className="mx-auto w-full max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 py-6 text-white md:grid-cols-2 md:items-center md:gap-10 md:py-8">
          <div>
            <h2 className="text-[36px] font-semibold leading-[44px] md:text-[44px] md:leading-[52px]">
              Win-win
            </h2>
            <p className="mt-4 max-w-[620px] text-[16px] leading-7 md:text-[18px] md:leading-8">
              Rapply is bedoeld om tijd, en dus ook geld, te besparen voor
              coaches. Sterker nog, wanneer coaches meer tijd overhouden
              kunnen zij meer clienten helpen en meer verdienen.
            </p>
            <p className="mt-6 text-[16px] leading-7 md:text-[18px] md:leading-8">
              Benieuwd naar de opbrengst van jouw investering? Bereken het hier.
            </p>
            <div className="mt-6">
              <Button
                label="Bereken"
                destination="/ROI"
                variant="secondary"
                className="h-[46px] border-white bg-white text-[16px] font-semibold text-[#BD0265] hover:bg-[#FBE8F1]"
              />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[560px] rounded-[14px] bg-white p-4 md:p-6">
            <Image
              src={winwinImage}
              alt="Illustratie van een persoon naast een rekenmachine"
              className="mx-auto h-auto w-full max-w-[420px]"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
