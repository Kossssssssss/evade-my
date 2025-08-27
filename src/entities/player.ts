import { Vector2, GameObject } from '../types/main.js';
import * as THREE from 'three';
import { AssetManager } from '../assets_manager';

export class Player implements GameObject
{
  position: Vector2 = { x: 0, y: 0 };
  velocity: Vector2 = { x: 0, y: 0 };
  radius: number = 0.8;

  public speed: number = 4;
  private target: Vector2 = { x: 0, y: 0 };

  model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;

  private is_dead:   boolean = false;
  private is_hit:    boolean = false;
  private is_frozen: boolean = false;

  constructor( scene: THREE.Scene )
  {
    this.model = AssetManager.getModel();
    this.model.scale.set( 2, 2, 2 );
    scene.add( this.model );

    const animations = AssetManager.getAnimations();
    if ( animations.length > 0 )
    {
      this.mixer = new THREE.AnimationMixer( this.model );
      for ( const clip of animations )
      {
        this.actions[clip.name] = this.mixer.clipAction( clip );
      }
    }
  }

  public stopAnimation()
  {
    if ( !this.mixer ) return;
    
    if ( this.current_action )
    {
      this.current_action.stop();
    }
  }

  public freeze()
  {
    this.is_frozen = true;
  }

  public unfreeze()
  {
    this.is_frozen = false;
  }

  public playHitAnimation()
  {
    this.is_hit = true;
    if ( !this.mixer ) return;
    const key = Object.keys( this.actions ).find( k => k.toLowerCase().includes( "hit" ) );
    if ( !key ) return;

    const action = this.actions[key];
    if ( this.current_action ) this.current_action.fadeOut( 0.2 );

    this.current_action = action;
    this.current_action.reset()
      .setLoop( THREE.LoopOnce, 1 )
      .play()
      .clampWhenFinished = true

    this.current_action.timeScale = 1;

    const onFinished = (e: { action: THREE.AnimationAction }) =>
    {
      if ( e.action === this.current_action )
      {
        this.is_hit = false;
        console.log( "hit animation finished, is_hit =", this.is_hit );
      }
    };
    this.mixer.removeEventListener( "finished", onFinished );
    this.mixer.addEventListener( "finished", onFinished );
  }

  public playLoseAnimation()
  {
    this.is_dead = true;
    if ( !this.mixer ) return;

    const key = Object.keys( this.actions ).find( k => k.toLowerCase().includes( "lose" ) );
    if ( !key ) return;

    const action = this.actions[key];

    if ( this.current_action )
    {
      this.current_action.stop();
    }

    this.current_action = action;
    this.current_action.reset()
      .setLoop( THREE.LoopOnce, 1 )
      .play();

    this.current_action.clampWhenFinished = true;
    this.current_action.enabled = true;

    this.current_action.timeScale = 1.0;
  }

  setTarget( x: number, y: number )
  {
    this.target = { x, y };
  }

  update( delta_time: number ): void
  {
    if ( !this.model ) return;

    if ( this.is_dead || this.is_hit || this.is_frozen )
    {
      if ( this.mixer ) this.mixer.update( delta_time );
      return;
    }

    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dist = Math.hypot( dx, dy );

    this.velocity = { x: dx, y: dy };

    if ( dist > 0.5 )
    {
      this.position.x += dx * 0.01 * this.speed;
      this.position.y += dy * 0.01 * this.speed;

      this.model.position.set( this.position.x, 0, this.position.y );

      const angle = Math.atan2( dx, dy );
      this.model.rotation.y = angle;

      const velocity_magnitude = Math.hypot( this.velocity.x, this.velocity.y );
      const base_speed = this.speed;
      let animation_speed = velocity_magnitude / base_speed * 2;

      animation_speed = Math.max( 1, Math.min( 4, animation_speed ) );
      this.playAnimation( "Walk", animation_speed );
    } else
    {
      if ( this.current_action )
      {
        this.current_action.fadeOut( 0.3 );
        this.current_action = undefined;
      }
    }

    if ( this.mixer ) this.mixer.update( delta_time );
  }

  playAnimation( partial_name: string, timeScale: number = 1.0 )
  {
    if ( !this.mixer ) return;

    const key = Object.keys( this.actions ).find( k =>
      k.toLowerCase().includes( partial_name.toLowerCase() )
    );
    if ( !key ) return;

    const action = this.actions[key];
    if ( this.current_action === action ) {
      this.current_action.timeScale = timeScale;
      return;
    }

    if ( this.current_action ) this.current_action.fadeOut( 0.3 );

    this.current_action = action;
    this.current_action.reset().fadeIn( 0.3 ).play();
  }

  draw(): void {}
}
