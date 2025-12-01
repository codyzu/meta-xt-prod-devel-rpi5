import clsx from 'clsx/lite';

export default function Gauge({
  units,
  minimum,
  maximum,
  resolution,
  value,
}: {
  readonly units: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly resolution: number;
  readonly value: number;
}) {
  const stopsCount = (maximum - minimum) / resolution + 1;
  // Const resolutionDegrees = (250 % 360) / (stopsCount - 1);

  const needlePositionPercent = (value - minimum) / (maximum - minimum);

  return (
    <div className="h-80 w-80 bg-gray-bak relative @container bg-gray-9">
      <div className="absolute top-0 left-0 h-full w-full">
        <div
          className={clsx(
            'w-full h-full rounded-full',
            'gauge-band',
            'gauge-gradient',
          )}
        />
      </div>
      <div className="absolute top-0 left-0 h-full w-full justify-center items-center">
        <div
          className={clsx(
            '@container relative',
            'aspect-1 rounded-full',
            'gauge-marks-width',
          )}
        >
          <ol>
            {Array.from({length: stopsCount}).map((_, stopIndex) => {
              const stop = minimum + stopIndex * resolution;
              return (
                <li
                  key={stop}
                  className={`clock-rotate-${Math.round(stopIndex * (stopsCount - 1))}%`}
                >
                  {stop}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
        <div
          className={clsx(
            'self-center grid-col-start-1 grid-row-start-2 grid-col-end-3 grid-row-end-3 h-5 bg-red-500',
            'mask-[radial-gradient(circle_at_calc(100%_-_calc(100cqi/6))_50%,_#0000_0_2.1cqi,_#FFF_2.1cqi)]',
            'needle-clip',
            'origin-[calc(100%_-_calc(100cqi/6))_50%]',
            'transition-transform duration-5000',
            'rotate-gauge-needle',
          )}
          style={
            {
              '--gauge-needle-position': needlePositionPercent,
            } as React.CSSProperties
          }
        />
        <div className="grid-col-start-1 grid-row-start-3 justify-center items-center">
          <div>Low</div>
        </div>
        <div className="grid-col-start-2 grid-row-start-3 justify-start items-center">
          <div className="text-2xl">{value}</div>
          <div>{units}</div>
        </div>
        <div className="grid-col-start-3 grid-row-start-3 justify-center items-center">
          <div>High</div>
        </div>
      </div>
    </div>
  );
}
