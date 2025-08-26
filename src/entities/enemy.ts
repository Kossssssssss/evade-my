import * as THREE from 'three';
import { AssetManager } from '../assets_manager';

export class Enemy
{
  public position: { x: number, y: number };
  public radius: number = 0.5;

  private speed: number = 2;
  private direction: { x: number, y: number }; // напрямок руху

  public model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;

  constructor( scene: THREE.Scene, start_pos: { x: number, y: number }, target_pos: { x: number, y: number } )
  {
    this.position = { ...start_pos };

    const dx = target_pos.x - start_pos.x;
    const dy = target_pos.y - start_pos.y;
    const dist = Math.hypot( dx, dy );
    this.direction = { x: dx / dist, y: dy / dist };

    this.model = AssetManager.getModel();
    this.model.scale.set( 1.5, 1.5, 1.5 );
    this.model.position.set( this.position.x, 0, this.position.y );

    const texture = AssetManager.getTexture( "purple" );
    this.model.traverse( ( child: any ) =>
    {
      if ( child.isMesh )
      {
        child.material = new THREE.MeshStandardMaterial( {
          map: texture,
        } );
      }
    } );

    scene.add( this.model );

    const animations = AssetManager.getAnimations();
    if ( animations.length > 0 )
    {
      this.mixer = new THREE.AnimationMixer( this.model );
      for ( const clip of animations )
      {
        this.actions[clip.name] = this.mixer.clipAction( clip );
      }
      this.playAnimation( "Walk" );
    }
  }

  update( deltaTime: number ): void
  {
    if ( !this.model ) return;

    this.position.x += this.direction.x * this.speed * deltaTime;
    this.position.y += this.direction.y * this.speed * deltaTime;

    this.model.position.set( this.position.x, 0, this.position.y );

    // ворог повертається в напрямку руху
    const angle = Math.atan2( this.direction.x, this.direction.y );
    this.model.rotation.y = angle;

    if ( this.mixer ) this.mixer.update( deltaTime );
  }

  private playAnimation( partialName: string )
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
}
