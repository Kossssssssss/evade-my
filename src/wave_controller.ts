export class WaveController
{
  private current_wave: number = 1;
  private readonly total_waves: number;
  private readonly wave_duration: number;
  private readonly pause_duration: number;

  private timer: number;
  private is_in_wave: boolean = true;
  private is_finished: boolean = false;

  public constructor( total_waves: number, wave_duration: number, pause_duration: number )
  {
    this.total_waves = total_waves;
    this.wave_duration = wave_duration;
    this.pause_duration = pause_duration;
    this.timer = wave_duration;
  }

  public update( dt: number ): void
  {
    if ( this.is_finished ) return;

    this.timer -= dt;

    if ( this.timer <= 0 )
    {
      if ( this.is_in_wave )
      {
        if ( this.current_wave === this.total_waves )
        {
          this.is_in_wave = false;
          this.is_finished = true;
          this.timer = 0;
          return;
        } else
        {
          this.is_in_wave = false;
          this.timer = this.pause_duration;
        }
      }
      else
      {
        this.current_wave++;
        if ( this.current_wave > this.total_waves )
        {
          this.is_finished = true;
        }
        else
        {
          this.is_in_wave = true;
          this.timer = this.wave_duration;
        }
      }
    }
  }

  public getCurrentWave(): number
  {
    return this.current_wave;
  }

  public getTotalWaves(): number
  {
    return this.total_waves;
  }

  public getTimer(): number
  {
    return this.timer;
  }

  public inWave(): boolean
  {
    return this.is_in_wave;
  }

  public isFinished(): boolean
  {
    return this.is_finished;
  }

  public isPaused(): boolean
  {
    return !this.is_in_wave && !this.is_finished;
  }
}
