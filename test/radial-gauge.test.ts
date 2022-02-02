import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { RadialGauge } from '../src/RadialGauge.js';
import '../src/radial-gauge.js';

function range(start: number, end: number): number[] {
  const ans: number[] = [];
  for (let i = start; i <= end; i += 1) {
    ans.push(i);
  }
  return ans;
}

describe('RadialGauge', () => {
  it('correctly ranges over the circumference', async () => {
    const tests = [
      { end: 45, start: 0, want: range(0, 45) },
      { end: 90, start: -90, want: [...range(270, 360), ...range(0, 90)] },
      { end: 90, start: 270, want: [...range(270, 360), ...range(0, 90)] },
      { end: -90, start: 180, want: range(180, 270) },
      { end: 270, start: -270, want: range(90, 270) },
    ];

    tests.forEach(async test => {
      const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);
      el.startAngle = test.start;
      el.endAngle = test.end;
      const got: number[] = [];
      // @ts-ignore
      el.rangeOverCircle(angle => {
        got.push(angle);
      });
      expect(got).to.eql(test.want);
    });
  });

  it('correctly calculates the point on the circumference', async () => {
    const tests = [
      { angle: 0, wantX: 1, wantY: 0 },
      { angle: 90, wantX: 2, wantY: 1 },
      { angle: 180, wantX: 1, wantY: 2 },
      { angle: 270, wantX: 0, wantY: 1 },
      { angle: -90, wantX: 0, wantY: 1 },
    ];

    tests.forEach(async test => {
      const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);
      el.radius = 1;
      // @ts-ignore
      const [gotX, gotY] = el.pointOnCircle(el.radius, test.angle);
      expect(gotX, 'x').to.eql(test.wantX);
      expect(gotY, 'y').to.eql(test.wantY);
    });
  });

  it('correctly calculates the minimum box size', async () => {
    const tests = [
      { end: 360, start: 0, wantHeight: 2, wantWidth: 2 },
      { end: 90, start: -90, wantHeight: 1, wantWidth: 2 },
      { end: 180, start: -90, wantHeight: 2, wantWidth: 2 },
    ];

    tests.forEach(async test => {
      const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);
      el.width = 2;
      el.height = 2;
      el.radius = 1;
      el.startAngle = test.start;
      el.endAngle = test.end;

      // @ts-ignore
      const [gotWidth, gotHeight] = el.minSize();
      expect(gotWidth, 'width').to.eql(test.wantWidth);
      expect(gotHeight, 'height').to.eql(test.wantHeight);
    });
  });

  it('has a default title "Hey there" and counter 5', async () => {
    /*     const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);

    expect(el.title).to.equal('Hey there');
    expect(el.counter).to.equal(5); */
  });

  it('increases the counter on button click', async () => {
    /*     const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);
    el.shadowRoot!.querySelector('button')!.click();

    expect(el.counter).to.equal(6);
 */
  });

  it('can override the title via attribute', async () => {
    /*     const el = await fixture<RadialGauge>(html`<radial-gauge title="attribute title"></radial-gauge>`);

    expect(el.title).to.equal('attribute title');
 */
  });

  it('passes the a11y audit', async () => {
    /*     const el = await fixture<RadialGauge>(html`<radial-gauge></radial-gauge>`);

    await expect(el).shadowDom.to.be.accessible();
 */
  });
});
