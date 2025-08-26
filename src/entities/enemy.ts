import * as THREE from 'three';
import { AssetManager } from '../assets_manager';

export class Enemy
{
  public position: { x: number, y: number };
  public radius: number = 0.5;

  private speed: number = 2;
  private target: { x: number, y: number };

  public model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;

  constructor( scene: THREE.Scene, startPos: { x: number, y: number } )
  {
    this.position = { ...startPos };
    this.target = { ...startPos };

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

  public setTarget( x: number, y: number )
  {
    this.target.x = x;
    this.target.y = y;
  }

  update( deltaTime: number ): void
  {
    if ( !this.model ) return;

    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;
    const dist = Math.hypot( dx, dy );

    if ( dist > 0.5 )
    {
      const dir_x = dx / dist;
      const dir_y = dy / dist;

      this.position.x += dir_x * this.speed * deltaTime;
      this.position.y += dir_y * this.speed * deltaTime;

      this.model.position.set( this.position.x, 0, this.position.y );

      const angle = Math.atan2( dx, dy );
      this.model.rotation.y = angle;

      this.playAnimation( "Walk" );
    }

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
