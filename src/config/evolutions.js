export const EVOLUTIONS = [
  {
    name: 'Huevo Núcleo',
    threshold: 0,
    palette: { primary: 0x7cf7ff, secondary: 0x8b7dff, accent: 0xffffff },
    description: 'El origen sellado de la bestia cibernética.',
    imageKey: 'phase1',
    motif: [0, 3, 7, 10]
  },
  {
    name: 'Cría Cableada',
    threshold: 220,
    palette: { primary: 0x79ffd8, secondary: 0x7cf7ff, accent: 0xffd86b },
    description: 'Una cría curiosa que juega con paquetes de datos.',
    imageKey: 'phase2',
    motif: [0, 2, 7, 9]
  },
  {
    name: 'Cazador de Paquetes',
    threshold: 520,
    palette: { primary: 0xffd86b, secondary: 0x7cf7ff, accent: 0xff8ab1 },
    description: 'Forma orgullosa, ágil y lista para dominar la red.',
    imageKey: 'phase3',
    motif: [0, 3, 5, 10]
  },
  {
    name: 'Depredador Firewall',
    threshold: 980,
    palette: { primary: 0xff8ab1, secondary: 0x8b7dff, accent: 0x79ffd8 },
    description: 'Una bestia blindada que salta sobre torres cibernéticas.',
    imageKey: 'phase4',
    motif: [0, 2, 6, 9]
  },
  {
    name: 'Titán Kernel',
    threshold: 2100,
    palette: { primary: 0x8b7dff, secondary: 0x7cf7ff, accent: 0xffffff },
    description: 'Coloso biomecánico capaz de disparar un rayo de nexo.',
    imageKey: 'phase5',
    motif: [0, 5, 7, 11]
  },
  {
    name: 'Bestia Divina',
    threshold: 4200,
    palette: { primary: 0xffffff, secondary: 0x7cf7ff, accent: 0xffd86b },
    description: 'Forma final, centro de un sistema solar digital.',
    imageKey: 'phase6',
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
