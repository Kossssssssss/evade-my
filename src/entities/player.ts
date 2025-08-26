import { Vector2, GameObject } from '../types/main.js';
import * as THREE from 'three';
import { AssetManager } from '../assets_manager';

export class Player implements GameObject
{
  position: Vector2 = { x: 0, y: 0 };
  velocity: Vector2 = { x: 0, y: 0 };
  radius: number = 0.5;

  private speed: number = 4;
  private target: Vector2 = { x: 0, y: 0 };

  model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;

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

  setTarget( x: number, y: number )
  {
    this.target = { x, y };
  }

  update( deltaTime: number ): void
  {
    if ( !this.model ) return;

    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dist = Math.hypot( dx, dy );
    if ( dist > 2 )
    {
      this.position.x += dx * 0.01;
      this.position.y += dy * 0.01;

      this.model.position.set( this.position.x, 0, this.position.y );

      const angle = Math.atan2( dx, dy );
      this.model.rotation.y = angle;

      this.playAnimation( "Walk" );
    } else
    {
      if ( this.current_action )
      {
        this.current_action.fadeOut( 0.3 );
        this.current_action = undefined;
      }
    }

    if ( this.mixer ) this.mixer.update( deltaTime );
  }

  playAnimation( partialName: string )
  {
    if ( !this.mixer ) return;

    const key = Object.keys( this.actions ).find( k =>
      k.toLowerCase().includes( partialName.toLowerCase() )
    );
    if ( !key ) return;

    const action = this.actions[key];
    if ( this.current_action === action ) return;

    if ( this.current_action ) this.current_action.fadeOut( 0.3 );
    this.current_action = action;
    this.current_action.reset().fadeIn( 0.3 ).play();
  }

  draw(): void {}
}
