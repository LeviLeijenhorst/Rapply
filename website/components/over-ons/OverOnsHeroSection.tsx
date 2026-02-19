import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

const overOnsVideoUrl = "https://jnlsolutionswebsite.blob.core.windows.net/videos/over_ons-video.mp4";

export default function OverOnsHeroSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="lg:pt-[136px]">
      <div className="grid w-full items-start gap-10 lg:grid-cols-2">
        <div className="flex w-full flex-col items-start">
          <div className="flex w-full max-w-xl flex-col items-start gap-4">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span>Aangenaam </span>
              <span className="text-[#BD0265]">:)</span>
            </h1>
            <p className="max-w-xl text-[16px] font-medium text-black/70 lg:pr-10">
              Wij geloven dat goede coaching begint bij rust, focus en aandacht.
              Coaches doen intens en betekenisvol werk en wij willen hen
              ondersteunen met tools die ruimte geven om echt aanwezig te zijn.
            </p>
          </div>
          <div className="mt-6">
            <Button
              label="Contact"
              destination="/contact"
              showArrow
              className="font-normal"
            />
          </div>
        </div>
        <div className="flex w-full justify-center lg:-translate-y-[60px] lg:self-center lg:justify-end">
          <div className="w-full max-w-[340px] overflow-hidden rounded-2xl md:max-w-[470px] xl:max-w-[600px]">
            <div className="aspect-[22/15] w-full">
              <video
                src={overOnsVideoUrl}
                className="h-full w-full object-cover"
                playsInline
                controls
                preload="metadata"
                loop
              />
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
