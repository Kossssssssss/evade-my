export interface Vector2
{
  x: number;
  y: number;
}

export interface GameObject
{
  position: Vector2;
  velocity: Vector2;
  radius: number;
  image?: HTMLImageElement;
  update( delta_time: number ): void;
  draw( ctx: CanvasRenderingContext2D ): void;
}
