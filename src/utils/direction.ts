export function getSmoothRotation(
  current_angle: number,
  dx: number,
  dy: number,
  lerp_factor = 0.15
): number
{
  if ( dx === 0 && dy === 0 ) return current_angle;

  const target_angle = Math.atan2( dx, dy );

  return current_angle + ( target_angle - current_angle ) * lerp_factor;
}
