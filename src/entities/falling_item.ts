export class FallingItem
{
  public position: { x: number, y: number };
  public radius: number = 10;
  public speed: number = 150;
  private velocity: { x: number, y: number };

  constructor( x: number, y: number, vx: number, vy: number, radius: number = 10 )
  {
    this.position = { x, y };
    this.radius = radius;
    this.velocity = { x: vx, y: vy };
  }

  public update( dt: number ): void
  {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
  }

  public draw( ctx: CanvasRenderingContext2D ): void
  {
    ctx.beginPath();
    ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 );
    ctx.fillStyle = 'yellow';
    ctx.fill();
  }
}
