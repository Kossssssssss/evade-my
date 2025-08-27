import * as THREE from 'three';
import { AssetManager } from '../assets_manager';

export class Enemy
{
  public position: { x: number, y: number };
  public radius: number = 0.8;

  private speed: number = 2;
  private direction: { x: number, y: number }; // напрямок руху

  public model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private actions: Record<string, THREE.AnimationAction> = {};
  private current_action?: THREE.AnimationAction;

  private is_attacking: boolean = false;

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

  update( delta_time: number ): void
  {
    if ( !this.model ) return;

    if ( this.is_attacking )
    {
      if ( this.mixer ) this.mixer.update( delta_time );
      return; // не рухаємось під час атаки
    }

    this.position.x += this.direction.x * this.speed * delta_time;
    this.position.y += this.direction.y * this.speed * delta_time;

    this.model.position.set( this.position.x, 0, this.position.y );

    const angle = Math.atan2( this.direction.x, this.direction.y );
    this.model.rotation.y = angle;

    if ( this.mixer ) this.mixer.update( delta_time );
  }

  public isAttacking(): boolean
  {
    return this.is_attacking;
  }

  public playAttackAnimation( player_position: { x: number, y: number }, onHit?: () => void, onFinish?: () => void )
  {
    if ( !this.mixer || this.is_attacking ) return;
    this.is_attacking = true;

    const key = Object.keys( this.actions ).find( k => k.toLowerCase().includes( "attack1" ) );
    if ( !key ) return;

    if ( this.model )
    {
      const dx = player_position.x - this.position.x;
      const dy = player_position.y - this.position.y;
      const angle = Math.atan2( dx, dy );
      this.model.rotation.y = angle;
    }

    const action = this.actions[key];
    if ( this.current_action === action ) return;

    if ( this.current_action ) this.current_action.fadeOut( 0.2 );

    this.current_action = action;
    this.current_action.reset()
      .setLoop( THREE.LoopOnce, 1 )
      .play()
      .clampWhenFinished = true;

    this.current_action.timeScale = 1.5;

    const hitDelay = ( action.getClip().duration / this.current_action.timeScale ) * 0.3;
    setTimeout( () =>
    {
      if ( onHit ) onHit();
    }, hitDelay * 1000 );

    this.mixer.addEventListener( "finished", ( e ) =>
    {
      if ( e.action === this.current_action )
      {
        if ( onFinish ) onFinish();
      }
    } );
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
