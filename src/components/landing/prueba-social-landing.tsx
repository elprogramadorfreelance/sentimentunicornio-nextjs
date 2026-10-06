import Image, { type StaticImageData } from "next/image";
import { getTranslations } from "next-intl/server";
import concanaco from "@/assets/brands/concanaco.webp";
import morena from "@/assets/brands/morena.webp";
import sectur from "@/assets/brands/sectur.webp";
import seph from "@/assets/brands/seph.webp";
import tianguisTuristicoMexico from "@/assets/brands/tianguis-turistico-mexico.webp";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

type Marca = {
  src: StaticImageData;
  nombre: string;
};

const MARCAS: Marca[] = [
  { src: sectur, nombre: "SECTUR" },
  { src: concanaco, nombre: "CONCANACO" },
  { src: morena, nombre: "MORENA" },
  { src: seph, nombre: "SEPH" },
  { src: tianguisTuristicoMexico, nombre: "Tianguis Turístico de México" },
];

function FilaMarcas({
  gobiernos,
  oculta,
}: {
  gobiernos: string;
  oculta?: boolean;
}) {
  const corte = Math.ceil(MARCAS.length / 2);
  const fila: Array<Marca | { texto: string }> = [
    ...MARCAS.slice(0, corte),
    { texto: gobiernos },
    ...MARCAS.slice(corte),
  ];

  return (
    <ul
      className="flex min-w-[100cqw] shrink-0 items-center"
      aria-hidden={oculta || undefined}
    >
      {fila.map((item) =>
        "texto" in item ? (
          <li
            key="gobiernos"
            className="flex h-12 shrink-0 items-center px-6 text-sm font-bold tracking-tight text-white sm:h-14 sm:text-base"
          >
            {item.texto}
          </li>
        ) : (
          <li
            key={item.nombre}
            className="flex h-12 min-w-32 flex-1 items-center justify-center px-6 sm:h-14 sm:min-w-36"
          >
            <span className="relative h-full w-full max-w-36">
              <Image
                src={item.src}
                alt={oculta ? "" : item.nombre}
                fill
                sizes="144px"
                loading="eager"
                className="object-contain brightness-0 invert"
              />
            </span>
          </li>
        ),
      )}
    </ul>
  );
}

export async function PruebaSocialLanding() {
  const t = await getTranslations("landing");

  return (
    <section className="bg-linear-to-br from-indigo-600 to-sky py-8 sm:py-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <TituloSeccionLanding
          as="p"
          text={t("socialProof")}
          color="rgba(255,255,255,0.9)"
          className="text-center font-display text-lg font-bold tracking-tight text-white sm:text-xl"
        />
      </div>

      <div className="@container group mt-5 overflow-hidden motion-reduce:hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          <FilaMarcas gobiernos={t("socialProofGovernments")} />
          <FilaMarcas gobiernos={t("socialProofGovernments")} oculta />
        </div>
      </div>

      <div className="mt-5 hidden justify-center overflow-x-auto px-4 motion-reduce:flex">
        <FilaMarcas gobiernos={t("socialProofGovernments")} />
      </div>
    </section>
  );
}
