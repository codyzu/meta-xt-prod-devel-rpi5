import clsx from 'clsx/lite';

export default function Gauge({
  units,
  minimum,
  maximum,
  resolution,
}: {
  readonly units: string;
  readonly minimum: number;
  readonly maximum: number;
  readonly resolution: number;
}) {
  const stopsCount = (maximum - minimum) / resolution + 1;
  const resolutionDegrees = (250 % 360) / (stopsCount - 1);

  console.log('stops', stop);
  console.log('resolutionDegrees', resolutionDegrees);

  return (
    <div className="h-80 w-80 bg-gray-bak relative @container bg-gray-9">
      <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
        <div
          className={clsx(
            'grid-col-span-3 grid-row-span-3 rounded-full',
            'bg-[conic-gradient(from_235deg,_theme(colors.blue.700),_theme(colors.lime.300),_theme(colors.red.700)_250deg,#0000_250deg)]',
            'gauge-band',
          )}
        />
      </div>
      <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
        <div
          className={clsx(
            '@container relative',
            'self-center grid-col-span-3 grid-row-span-3 place-self-center aspect-1 rounded-full',
            'w-[calc(100cqi_-_(2_*_10cqi))]',
          )}
        >
          <ol>
            {Array.from({length: stopsCount}).map((_, stopIndex) => {
              const stop = minimum + stopIndex * resolution;
              console.log('stop', stop);
              return (
                <li
                  key={stop}
                  className={`clock-rotate-${Math.round((235 - 90 + stopIndex * resolutionDegrees) % 360)}deg`}
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
            'rotate-30deg',
          )}
        />
        <div className="grid-col-start-1 grid-row-start-3 justify-center items-center">
          <div>Low</div>
        </div>
        <div className="grid-col-start-2 grid-row-start-3 justify-start items-center">
          <div className="text-2xl">100</div>
          <div>{units}</div>
        </div>
        <div className="grid-col-start-3 grid-row-start-3 justify-center items-center">
          <div>High</div>
        </div>
      </div>
    </div>
  );
}
