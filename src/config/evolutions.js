export const EVOLUTIONS = [
  {
    name: 'Núcleo Semilla',
    threshold: 0,
    palette: { primary: 0x7cf7ff, secondary: 0x8b7dff, accent: 0xffffff },
    description: 'El kernel despierta jugando con datos flotantes.',
    motif: [0, 3, 7, 10]
  },
  {
    name: 'Bytecría',
    threshold: 220,
    palette: { primary: 0x79ffd8, secondary: 0x7cf7ff, accent: 0xffd86b },
    description: 'Primera forma móvil, curiosa y luminosa.',
    motif: [0, 2, 7, 9]
  },
  {
    name: 'Lynx de Paquetes',
    threshold: 520,
    palette: { primary: 0xffd86b, secondary: 0x7cf7ff, accent: 0xff8ab1 },
    description: 'Cazador joven de datos y señales.',
    motif: [0, 3, 5, 10]
  },
  {
    name: 'Protocazador',
    threshold: 980,
    palette: { primary: 0xff8ab1, secondary: 0x8b7dff, accent: 0x79ffd8 },
    description: 'Forma ágil optimizada para nodos hostiles.',
    motif: [0, 2, 6, 9]
  },
  {
    name: 'Centinela Kernel',
    threshold: 2100,
    palette: { primary: 0x8b7dff, secondary: 0x7cf7ff, accent: 0xffffff },
    description: 'Blindaje noble y control defensivo del campo.',
    motif: [0, 5, 7, 11]
  },
  {
    name: 'Soberano Nexo',
    threshold: 4200,
    palette: { primary: 0xffffff, secondary: 0x7cf7ff, accent: 0xffd86b },
    description: 'Forma final, dramática e imposible de corromper.',
    motif: [0, 3, 7, 12]
  }
];

export const STAT_META = [
  { key: 'energy', label: 'Energía' },
  { key: 'integrity', label: 'Integridad' },
  { key: 'sync', label: 'Sincronía' }
];

export function getStageIndex(coreData) {
  return EVOLUTIONS.reduce((current, evolution, index) => (
    coreData >= evolution.threshold ? index : current
  ), 0);
}

export function getNextEvolution(coreData) {
  const next = EVOLUTIONS.find((evolution) => evolution.threshold > coreData);
  return next ?? null;
}
