import {defineConfig} from 'unocss';
import presetWind4 from '@unocss/preset-wind4';
import {presetIcons} from '@unocss/preset-icons';
import {presetTypography} from '@unocss/preset-typography';
import transformerVariantGroup from '@unocss/transformer-variant-group';
import transformerDirectives from '@unocss/transformer-directives';
import {presetWebFonts} from '@unocss/preset-web-fonts';

const analogGaugeStartAngle = '235deg';
const analogGaugeRange = '250deg';
const analogGaugeSegmentsWidth = '1deg';
const gaugeBandWidth = '10cqi';
const analogGaugeMaskCircle = `radial-gradient(circle at 50% 50%,
  #0000 calc(50cqi - ${gaugeBandWidth}),
  #000 0)`;
const analogGaugeSegments = '10';
// Const analogGaugeMaskSegment = 'none';
const analogGaugeMaskSegment = `repeating-conic-gradient(
  from ${analogGaugeStartAngle} at 50% 50%,
  #000 0 ${analogGaugeSegmentsWidth},
  #0000 0 calc((${analogGaugeRange} / ${analogGaugeSegments})))`;
const analogGaugeMaskComposite = 'subtract';

export default defineConfig({
  presets: [
    presetWind4({
      preflights: {
        reset: true,
      },
    }),
    presetIcons({
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetTypography(),
    presetWebFonts({
      // Prefer bunny provider, but it seems to be broken with 2 theme overrides (only loads the first)
      provider: 'google',
      fonts: {
        mono: ['Noto Sans Mono'],
        sans: [
          {
            name: 'Nunito',
            weights: ['400', '600', '800'],
          },
        ],
      },
    }),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  rules: [
    [
      'gauge-band',
      {
        mask: `${analogGaugeMaskCircle}, ${analogGaugeMaskSegment}`,
        'mask-composite': `${analogGaugeMaskComposite}`,
      },
    ],
    [
      'needle-clip',
      {
        'clip-path': 'polygon(7.5% 50%,78% 0%,83% 35%,83% 65%,78% 100%)',
      },
    ],
    ...Array.from({length: 360}, (_, i) => i).map((angle) => {
      const radius = 'calc((100% - 15cqi) / 2)';

      return [
        `clock-rotate-${angle}deg`,
        {
          'aspect-ratio': '1',
          display: 'grid',
          left: `calc(${radius} + (${radius} * cos(${angle}deg)))`,
          'place-content': 'center',
          position: 'absolute',
          top: `calc(${radius} + (${radius} * sin(${angle}deg)))`,
          width: '15cqi',
        },
      ] as [string, Record<string, string>];
    }),
  ],
  safelist: Array.from({length: 360}, (_, i) => i).map(
    (angle) => `clock-rotate-${angle}deg`,
  ),
});
