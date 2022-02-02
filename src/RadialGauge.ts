import { html, css, LitElement, svg, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

export class RadialGauge extends LitElement {
  static styles = css`
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      padding: 25px;
    }

    .indicator-track {
      stroke: rgba(192, 192, 192, 0.5);
    }

    .indicator {
      stroke: var(--info-color, #039be5);
    }

    .axis {
      stroke: var(--primary-text-color, #666);
      stroke-width: 2px;
      fill: transparent;
    }

    .axis-tick {
      stroke: var(--primary-text-color, #666);
    }

    .axis-label {
      font-family: 'Roboto', 'Noto', 'sans-serif';
      fill: var(--primary-text-color, #666);
    }

    .value {
      position: absolute;
      top: 50%;
      left: 50%;
      font-size: 50px;
      font-family: 'Roboto', 'Noto', 'sans-serif';
      color: var(--primary-text-color, #666);
    }
  `;

  @property({ attribute: 'end-angle', type: Number })
  endAngle = 360;

  @property({ type: Number })
  height = 250;

  @property({ attribute: 'indicator-width', type: Number })
  indicatorWidth = 15;

  @property({ attribute: 'label-size', type: Number })
  labelSize = 30;

  @property({attribute: 'major-ticks', type: Number})
  majorTicks = 10;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  min = 0;

  @property({attribute: 'minor-ticks', type: Number})
  minorTicks = 2;

  @property({ type: Number })
  radius = 200;

  @property({ attribute: 'range-width', type: Number })
  rangeWidth = 30;

  @property({ attribute: false })
  ranges = [
    { color: 'red', start: 90 },
    { color: 'yellow', start: 75 },
  ];

  @property({ attribute: 'start-angle', type: Number })
  startAngle = 0;

  @property({ type: Number })
  stroke = 0.2;

  @property({ type: Number }) value = 0;

  @property({ type: Number })
  width = 250;

  private displayHeight: number = 0;

  private displayWidth: number = 0;

  private get axisRadius(): number {
    return this.rangesRadius - this.rangeWidth;
  }

  private get indicatorRadius(): number {
    return this.rangesRadius - this.rangeWidth + this.indicatorWidth - 1;
  }

  private get rangesRadius(): number {
    return this.radius - 2 * this.labelSize;
  }

  get strokeWidth() {
    return this.stroke * this.radius;
  }

  render() {
    this.style.width = `${this.displayWidth}px`;
    this.style.height = `${this.displayHeight}px`;
    // the range for centering the label is translating between
    // -50% and 75% depending on how much of the view box is hidden
    // in the overflow.  At most, 50% of the view box overflows and
    // at least 0% does.
    const middle = -50 + 65 * ((1 - this.displayHeight / this.height) / 0.5);
    const valueStyle = {
      transform: `translate(-50%, ${middle}%)`,
    };

    return html`
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.radius * 2} ${this.radius * 2}"
      >
        ${this.renderRanges()} ${this.renderIndicator()} ${this.renderFace()} ${this.renderAxis()}
      </svg>
      <div class="value" style="${styleMap(valueStyle)}">${this.value}</div>
    `;
  }

  protected willUpdate(_changedProperties: Map<string | number | symbol, unknown>): void {
    if (_changedProperties.has('startAngle') || _changedProperties.has(this.endAngle)) {
      [this.displayWidth, this.displayHeight] = this.minSize();
    }

    if (_changedProperties.has('ranges')) {
      this.ranges.sort((r1, r2) => r1.start - r2.start);
    }
  }

  private angle(value: number) {
    return ((this.endAngle - this.startAngle) * (this.min + value)) / (this.max - this.min);
  }

  private minSize(): [number, number] {
    let maxX = 0;
    let maxY = 0;

    this.rangeOverCircle(angle => {
      const [x, y] = this.pointOnCircle(this.radius, angle);
      maxX = Math.max(x, maxX);
      maxY = Math.max(y, maxY);
    });
    maxX = this.width * (maxX / (2 * this.radius));
    maxY = this.height * (maxY / (2 * this.radius));
    return [maxX, maxY];
  }

  private pointOnCircle(radius: number, angle: number): [number, number] {
    // rotate so that 0 degrees is north
    let t = angle;
    if (t < 0) {
      t = 360 + t;
    }

    // convert to radians
    t = (t * Math.PI) / 180;
    return [
      Math.round(this.radius + radius * Math.sin(t)),
      Math.round(this.radius - radius * Math.cos(t)),
    ];
  }

  private rangeOverCircle(cb: (angle: number) => void) {
    // convert angles to positive numbers
    let start = this.startAngle;
    if (start < 0) {
      start = 360 + start;
    }

    let end = this.endAngle;
    if (end < 0) {
      end = 360 + end;
    }

    for (let angle = start; angle !== end; angle += 1) {
      if (angle === 361) {
        angle = 0;
      }
      cb(angle);
    }
    // get the end angle too
    cb(end);
  }

  private rangeOverRanges(cb: (start :number, end :number, color :string) => boolean) {
    for (let i=0; i<this.ranges.length; i+=1) {
      const end = i < this.ranges.length - 1 ? this.ranges[i + 1].start : this.max;
      const cont = cb(this.ranges[i].start, end, this.ranges[i].color);
      if (!cont) {
        break;
      }
    }
  }

  private renderArc(
    radius: number,
    start: number,
    end: number,
    width: number,
    styleClass: string,
    color?: string,
  ) {
    const startAngle = this.angle(start);
    const endAngle = this.angle(end);
    const circumference = 2 * Math.PI * (radius - width / 2);
    const arc = (circumference * (endAngle - startAngle)) / 360;
    const dashArray = `${arc} ${circumference}`;
    // transform the start angle since SVG 0 degrees points
    // right.  We want 0 degrees to point north, so we rotate
    // 90 degrees counterclockwise
    const transform = `rotate(${this.startAngle + startAngle - 90}, ${this.radius}, ${
      this.radius
    })`;
    return svg`
      <circle
        cx=${this.radius}
        cy=${this.radius}
        fill="transparent"
        r=${radius - width / 2}
        stroke-dasharray=${dashArray}
        stroke-width=${width}
        stroke=${typeof color === 'undefined' ? '' : color}
        transform=${transform}
        class=${styleClass}
      />
    `;
  }

  private renderAxis() {
    const [x, y] = this.pointOnCircle(this.axisRadius, this.endAngle);
    const [dx, dy] = this.pointOnCircle(this.axisRadius, this.startAngle);
    return svg`
      <path d="
        M ${x} ${y} 
        A ${this.axisRadius} ${this.axisRadius} 0 1 0 ${dx} ${dy}"
        class="axis"
      />
      ${this.renderTicks()}
    `;
  }

  private renderFace() {
    const fillColor = this.valueColor(this.value);
    if (fillColor === "transparent") {
      return svg``;
    }

    const [x, y] = this.pointOnCircle(this.axisRadius, this.endAngle);
    const [dx, dy] = this.pointOnCircle(this.axisRadius, this.startAngle);
    return svg`
      <filter id="inset-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feComponentTransfer in=SourceAlpha>
          <feFuncA type="table" tableValues="1 0" />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="4"/>
        <feOffset dx="0" dy="5" result="offsetblur"/>
        <feFlood flood-color="rgb(0, 0, 0)" result="color"/>
        <feComposite in2="offsetblur" operator="in"/>
        <feComposite in2="SourceAlpha" operator="in" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode />
        </feMerge>
      </filter>
      <path d="
        M ${x} ${y} 
        A ${this.axisRadius} ${this.axisRadius} 0 1 0 ${dx} ${dy}"
        class="face"
        fill="${fillColor}"
        fill-opacity=0.5
      />`
  }

  private renderIndicator() {
    return svg`
        ${this.renderArc(
          this.indicatorRadius,
          this.value,
          this.max,
          this.indicatorWidth,
          'indicator-track',
        )}
        ${this.renderArc(this.indicatorRadius, 0, this.value, this.indicatorWidth, 'indicator')}
    `;
  }

  private renderRanges() {
    const arcs: TemplateResult[] = [];
    this.rangeOverRanges((start, end, color) => {
      arcs.push(
        this.renderArc(this.rangesRadius, start, end, this.rangeWidth, 'range', color),
      );
      return true;
    })

    return svg`${arcs}`;
  }

  private renderTick(value: number) {
    const label = value;
    const length = (value % this.majorTicks === 0 ? this.rangeWidth : this.indicatorWidth);
    const [startX, startY] = this.pointOnCircle(
      this.axisRadius,
      this.angle(value) + this.startAngle,
    );

    const [endX, endY] = this.pointOnCircle(
      this.axisRadius + length,
      this.angle(value) + this.startAngle,
    );

    const [labelX, labelY] = this.pointOnCircle(
      this.axisRadius + length + this.labelSize/2 + 5,
      this.angle(value) + this.startAngle,
    );

    return svg`
      <line 
        x1=${startX} 
        y1=${startY} 
        x2=${endX} 
        y2=${endY}
        class="axis-tick" />
      ${ (value % this.majorTicks === 0 ? svg`<text 
        x=${labelX} 
        y=${labelY} 
        dominant-baseline="middle" 
        text-anchor="middle"
        font-size=${this.labelSize}
        class="axis-label">${label}</text>` : "") }
    `;
  }

  private renderTicks() {
    const ticks: TemplateResult[] = [];
    for (let i=this.min; i<=this.max; i+=this.minorTicks) {
      ticks.push(this.renderTick(i));
    }

    return svg`${ticks}`;
  }

  private valueColor(value :number) {
    let color = "transparent";
    this.rangeOverRanges((start, end, c) => {
      if (value >= start && value <= end) {
        color = c;
        return false;
      }
      return true;
    });
    return color;
  }
}
