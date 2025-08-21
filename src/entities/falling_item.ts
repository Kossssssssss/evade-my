export class FallingItem
{
  public position: { x: number, y: number };
  public radius: number = 10;
  public speed: number = 150;

  public constructor( x: number )
  {
    this.position = { x, y: -this.radius };
  }

  public update( dt: number ): void
  {
    this.position.y += this.speed * dt;
  }

  public draw( ctx: CanvasRenderingContext2D ): void
  {
    ctx.beginPath();
    ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 );
    ctx.fillStyle = 'yellow';
    ctx.fill();
  }
}
