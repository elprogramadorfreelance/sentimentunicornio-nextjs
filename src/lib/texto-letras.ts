// Algunos titulares escriben letras con recuadro de color (🅱 🅼 🅰 …). Son
// símbolos de emoji, no letras, así que cualquier limpieza de emojis las borra
// y deja palabras rotas ("🅱árcena" → "árcena"). Se convierten a su letra
// normal antes de limpiar nada.
const RANGOS_LETRAS_ENVUELTAS: [number, number][] = [
  [0x1f130, 0x1f149], // cuadrado: 🄰…🅉
  [0x1f150, 0x1f169], // negativo circular: 🅐…🅩
  [0x1f170, 0x1f189], // negativo cuadrado: 🅰…🆉
];

export function letrasEnvueltasAAscii(texto: string): string {
  return texto.replace(/[\u{1F130}-\u{1F189}]/gu, (caracter) => {
    const codigo = caracter.codePointAt(0)!;
    const rango = RANGOS_LETRAS_ENVUELTAS.find(([inicio, fin]) => codigo >= inicio && codigo <= fin);
    if (!rango) return caracter;
    return String.fromCharCode(65 + (codigo - rango[0]));
  });
}
