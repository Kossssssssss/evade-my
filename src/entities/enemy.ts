import { Vector2, GameObject } from '../types/main.js';

export class Enemy implements GameObject
{
  position: Vector2;
  velocity: Vector2;
  radius: number = 15;
  image?: HTMLImageElement;
  use_image: boolean;

  constructor( position: Vector2, velocity: Vector2, use_image: boolean, image?: HTMLImageElement )
  {
    this.position = position;
    this.velocity = velocity;
    this.image = image;
    this.radius = 20;
    this.use_image = use_image;

    if ( this.use_image )
    {
      this.image = new Image();
      this.image.src = 'assets/enemy.png';
    }
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
      const size = this.radius * 2;
      ctx.drawImage( this.image, this.position.x - this.radius, this.position.y - this.radius, size, size );
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
