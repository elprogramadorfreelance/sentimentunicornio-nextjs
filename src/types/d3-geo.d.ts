// d3-geo (v1, dependencia transitiva de @nivo/geo) no trae sus propios tipos
// y no existe un paquete @types/d3-geo para esta versión — se declara acá
// solo lo que usamos de verdad (geoMercator + fitExtent, para calcular el
// zoom/centrado real del mapa de México contra el tamaño real del
// contenedor, ver grafica-mapa-paises.tsx).
declare module "d3-geo" {
  export interface GeoProjection {
    rotate(angles: [number, number, number]): this;
    scale(scale: number): this;
    scale(): number;
    translate(point: [number, number]): this;
    translate(): [number, number];
    fitExtent(extent: [[number, number], [number, number]], object: unknown): this;
  }
  export function geoMercator(): GeoProjection;
}
