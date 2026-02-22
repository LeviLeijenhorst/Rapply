import Button from "@/components/Button";
import SectionContainer from "@/components/home/SectionContainer";

export default function OverOnsHeroSection() {
  return (
    <SectionContainer className="bg-white" contentClassName="pt-10 md:pt-12">
      <div className="flex w-full items-start justify-center">
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
            <h1 className="font-[var(--font-catamaran)] text-[38px] font-medium leading-[110%] text-black md:text-[50px] xl:text-[64px]">
              <span>Wij helpen coaches terug te keren naar </span>
              <span className="text-[#BD0265]">
                waarom ze het vak zijn ingestapt
              </span>
            </h1>
            <p className="mt-2 max-w-3xl text-[16px] font-medium text-black/70">
              We leven in een tijd waarin technologie meer overneemt dan ooit.
              De klantenservice is een chatbot, de kassa een zelfscan en de
              bank een app op je smartphone. En toch, diezelfde technologie
              brengt ons ook dichter bij de mensen die we liefhebben.
              <br />
              <br />
              Je bezoekt vrienden aan de andere kant van het land met je auto,
              je belt tussendoor even je moeder op om te vragen hoe het gaat en
              veel werk kan tegenwoordig vanaf je laptop op de bank bij je
              gezin.
              <br />
              <br />
              Wij geloven dat de versnelling van technologie niet hoeft te
              betekenen dat menselijk contact verdwijnt. Wij zien juist kansen
              om technologie in te zetten voor het tegendeel: het versterken van
              die connectie.
              <br />
              <br />
              Daarom bouwen wij CoachScribe: zodat loopbaancoaches en
              re-integratieprofessionals geen tijd meer verliezen aan notities,
              verslagen en administratie, maar zich volledig kunnen richten op
              wat echt telt. Het helpen van mensen.
              <br />
              Want dat is waarom je dit vak hebt gekozen.
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
      </div>
    </SectionContainer>
  );
}
