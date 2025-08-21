export interface LocationConfig
{
  name: string;
  enemySpeed: number;
  spawnRate: number; // enemies per second
  backgroundColor: string;
}

export const locations: LocationConfig[] = [
  { name: 'Easy Forest', enemySpeed: 1000, spawnRate: 100, backgroundColor: '#228B22' },
  { name: 'Medium Desert', enemySpeed: 1500, spawnRate: 200, backgroundColor: '#EDC9AF' },
  { name: 'Hard Space', enemySpeed: 2000, spawnRate: 300, backgroundColor: '#000000' }
];

