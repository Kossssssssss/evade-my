export type Trajectory = "straight" | "arc" | "zigzag";

export interface pathData
{
  control?: { x: number; y: number };
}

export function getTrajectoryPosition(
  type: Trajectory,
  t: number,
  start: { x: number; y: number },
  end:   { x: number; y: number },
  path_data: pathData,
  zigzag_amplitude = 3,
  zigzag_frequency = 2
): { x: number; y: number }
{
  switch ( type )
  {
    case "straight":
      return {
        x: start.x + ( end.x - start.x ) * t,
        y: start.y + ( end.y - start.y ) * t,
      };

    case "arc":
      if ( path_data.control )
      {
        const u = 1 - t;
        return {
          x:
            u * u * start.x +
            2 * u * t * path_data.control.x +
            t * t * end.x,
          y:
            u * u * start.y +
            2 * u * t * path_data.control.y +
            t * t * end.y,
        };
      }
      return { ...end };

    case "zigzag":
      let x = start.x + ( end.x - start.x ) * t;
      let y = start.y + ( end.y - start.y ) * t;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot( dx, dy );
      if ( len > 0.01 )
      {
        const nx = -dy / len;
        const ny = dx / len;
        const offset =
          Math.sin( t * zigzag_frequency * Math.PI * 2 ) * zigzag_amplitude;
        x += nx * offset;
        y += ny * offset;
      }
      return { x, y };

    default:
      return { ...start };
  }
}
