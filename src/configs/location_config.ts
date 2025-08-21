export interface LocationConfig
{
  name: string;
  enemy_speed: number;
  spawn_rate: number; // enemies per second
  background_color: string;
  score_point: number;
}

export const locations: LocationConfig[] = [
  { name: 'Easy Forest', enemy_speed: 200, spawn_rate: 2, score_point: 10, background_color: '#228B22' },
  { name: 'Medium Desert', enemy_speed: 250, spawn_rate: 4, score_point: 20, background_color: '#EDC9AF' },
  { name: 'Hard Space', enemy_speed: 350, spawn_rate: 5, score_point: 30, background_color: '#000000' }
];

