export class TextButton
{
  private ctx: CanvasRenderingContext2D;
  private text: string;
  private x: number;
  private y: number;
  private font: string;
  private color: string;
  private onClick: () => void;

  private padding_x: number = 20;
  private padding_y: number = 15;

  constructor(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    font: string = "24px Arial",
    color: string = "white",
    onClick: () => void
  )
  {
    this.ctx = ctx;
    this.text = text;
    this.x = x;
    this.y = y;
    this.font = font;
    this.color = color;
    this.onClick = onClick;
  }

  public draw()
  {
    this.ctx.font = this.font;
    this.ctx.fillStyle = this.color;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText( this.text, this.x, this.y );
  }

  public handleClick( mouseX: number, mouseY: number )
  {
    const width = this.ctx.measureText( this.text ).width + this.padding_x * 2;
    const height = parseInt( this.font, 10 ) + this.padding_y;

    const left = this.x - width / 2;
    const top = this.y - height / 2;

    if (
      mouseX >= left &&
      mouseX <= left + width &&
      mouseY >= top &&
      mouseY <= top + height
    )
    {
      this.onClick();
    }
  }
}
