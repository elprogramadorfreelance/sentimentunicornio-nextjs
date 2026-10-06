/**
 * Reparte 100% entre categorías por "mayor residuo" (largest remainder) en vez de redondear
 * cada una por separado — redondear N fracciones de forma independiente puede desviar la suma
 * varios puntos (se vio un caso real: 52% + 59% = 111%, dejando la tercera categoría en -11% al
 * calcularse como resto). Con este método la suma da EXACTAMENTE 100 y ninguna categoría puede
 * salir negativa. Sin dependencias de servidor — seguro de importar desde componentes cliente.
 */
export function repartirPorcentajesEnteros(conteos: number[], total: number): number[] {
  if (total <= 0) return conteos.map(() => 0);
  const exactos = conteos.map((c) => (c / total) * 100);
  const base = exactos.map((v) => Math.floor(v));
  let faltante = 100 - base.reduce((suma, v) => suma + v, 0);
  const orden = exactos
    .map((v, i) => ({ i, residuo: v - Math.floor(v) }))
    .sort((a, b) => b.residuo - a.residuo);
  const resultado = [...base];
  for (let k = 0; k < orden.length && faltante > 0; k++, faltante--) {
    resultado[orden[k].i] += 1;
  }
  return resultado;
}

/**
 * Igual que `repartirPorcentajesEnteros` (mismo método de mayor residuo),
 * pero reparte un total arbitrario entre pesos reales en vez de forzar un
 * 100% — para repartir, por ejemplo, un total real de menciones entre
 * varios estados según su peso (población) cuando no existe un conteo real
 * por estado. La suma del resultado siempre da EXACTAMENTE `total`.
 */
export function repartirEnteroPorPeso(pesos: number[], total: number): number[] {
  const sumaPesos = pesos.reduce((s, p) => s + p, 0);
  if (total <= 0 || sumaPesos <= 0) return pesos.map(() => 0);
  const exactos = pesos.map((p) => (p / sumaPesos) * total);
  const base = exactos.map((v) => Math.floor(v));
  let faltante = total - base.reduce((suma, v) => suma + v, 0);
  const orden = exactos
    .map((v, i) => ({ i, residuo: v - Math.floor(v) }))
    .sort((a, b) => b.residuo - a.residuo);
  const resultado = [...base];
  for (let k = 0; k < orden.length && faltante > 0; k++, faltante--) {
    resultado[orden[k].i] += 1;
  }
  return resultado;
}
