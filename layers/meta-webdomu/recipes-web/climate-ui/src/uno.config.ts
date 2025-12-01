import {defineConfig, type DynamicRule} from 'unocss';
import presetWind4, {type Theme} from '@unocss/preset-wind4';
import {presetIcons} from '@unocss/preset-icons';
import {presetTypography} from '@unocss/preset-typography';
import transformerVariantGroup from '@unocss/transformer-variant-group';
import transformerDirectives from '@unocss/transformer-directives';
import {presetWebFonts} from '@unocss/preset-web-fonts';

const analogGaugeStart = 235;
const needleOffset = 360 - ((analogGaugeStart + 90) % 360);
const analogGaugeStartAngle = `${analogGaugeStart}deg`;
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
      /^gauge-gradient$/,
      (_, {theme}) => {
        // Extact the colors from the theme
        // TODO: there is porbably a better way to type these
        // const startColor = theme.colors!['blue.700'] as string;
        const startColor = (theme.colors!.blue as Theme['colors'])![
          '700'
        ] as string;
        const viaColor = (theme.colors!.lime as Theme['colors'])![
          '300'
        ] as string;
        const toColor = (theme.colors!.red as Theme['colors'])![
          '700'
        ] as string;
        return {
          // 'bg-[conic-gradient(from_235deg,_theme(colors.blue.700),_theme(colors.lime.300),_theme(colors.red.700)_250deg,#0000_250deg)]',
          background: `conic-gradient(from ${analogGaugeStartAngle},
          ${startColor}, ${viaColor}, ${toColor} ${analogGaugeRange},
          #0000 ${analogGaugeRange})`,
        };
      },
    ] as DynamicRule<Theme>,
    [
      'gauge-marks-width',
      {
        width: `calc(100cqi - (2 * ${gaugeBandWidth}))`,
      },
    ],
    [
      'needle-clip',
      {
        'clip-path': 'polygon(7.5% 50%,78% 0%,83% 35%,83% 65%,78% 100%)',
      },
    ],
    [
      'rotate-gauge-needle',
      {
        transform: `rotate(calc((${analogGaugeRange} * var(--gauge-needle-position, 0)) - ${needleOffset}deg))`,
      },
    ],
    ...Array.from({length: 101}, (_, i) => i).map((percent) => {
      const radius = 'calc((100% - 15cqi) / 2)';
      const angleAdjusted = (percent * 250) / 100 + (235 - 90);

      return [
        `clock-rotate-${percent}%`,
        {
          'aspect-ratio': '1',
          display: 'grid',
          left: `calc(${radius} + (${radius} * cos(${angleAdjusted}deg)))`,
          'place-content': 'center',
          position: 'absolute',
          top: `calc(${radius} + (${radius} * sin(${angleAdjusted}deg)))`,
          width: '15cqi',
        },
      ] as [string, Record<string, string>];
    }),
  ],
  safelist: Array.from({length: 101}, (_, i) => i).map(
    (angle) => `clock-rotate-${angle}%`,
  ),
});
