import { Vector2, GameObject } from '../types/main.js';

export class Enemy implements GameObject
{
  position: Vector2;
  velocity: Vector2;
  radius: number = 15;
  image?: HTMLImageElement;

  constructor( position: Vector2, velocity: Vector2, image?: HTMLImageElement )
  {
    this.position = position;
    this.velocity = velocity;
    this.image = image;
  }

  update( deltaTime: number ): void
  {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
  }

  draw( ctx: CanvasRenderingContext2D ): void
  {
    if ( this.image )
    {
      ctx.drawImage( this.image, this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2 );
    } else
    {
      ctx.beginPath();
      ctx.arc( this.position.x, this.position.y, this.radius, 0, Math.PI * 2 );
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  }

  isOffScreen( width: number, height: number ): boolean
  {
    return this.position.x < -this.radius || this.position.x > width + this.radius ||
      this.position.y < -this.radius || this.position.y > height + this.radius;
  }
}
