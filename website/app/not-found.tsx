import Image from "next/image";
import Button from "@/components/Button";
import NavigationBar from "@/components/NavigationBar";
import errorIllustration from "@/error/error.png";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <NavigationBar />
      <main className="mt-36 flex flex-1 items-start justify-center px-6 pb-16 pt-14 sm:px-8">
        <section className="flex w-full max-w-[420px] flex-col items-center text-center">
          <Image
            src={errorIllustration}
            alt="404 illustratie"
            className="h-auto w-[165px]"
            priority
          />
          <h1 className="mt-8 text-[110px] font-extrabold leading-none text-[#BD0265]">
            404
          </h1>
          <p className="mt-3 text-lg font-bold leading-tight text-[#171717] sm:text-xl">
            Deze pagina lijkt niet te bestaan :(
          </p>
          <Button
            label="Terug naar home"
            destination="/"
            variant="primary"
            showArrow
            className="mt-8"
          />
        </section>
      </main>
    </div>
  );
}
