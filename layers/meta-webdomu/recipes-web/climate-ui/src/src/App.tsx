import {useEffect, useState} from 'react';
import clsx from 'clsx/lite';
import Gauge from './Gauge.tsx';

type ClimateData = {
  temperature_c: number;
  pressure_hpa: number;
  humidity_pct: number;
  timestamp: number;
};

function App() {
  const [climateData, setClimateData] = useState<ClimateData>({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    temperature_c: 22.5,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    pressure_hpa: 1013,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    humidity_pct: 45,
    timestamp: Date.now(),
  });

  useEffect(() => {
    let cancel = false;
    const handle = setInterval(async () => {
      return;
      const response = await fetch('http://192.168.1.118:5000/api/sensor');

      if (cancel) {
        return;
      }

      const data = (await response.json()) as ClimateData;
      console.log('Climate data:', data);
      setClimateData(data);
    }, 5000);

    return () => {
      cancel = true;
      clearInterval(handle);
    };
  });

  return (
    <>
      <div className="mx-auto max-w-lg p-4 items-center text-3xl">
        <div>{climateData?.temperature_c ?? ''} °C</div>
        <div>{climateData?.pressure_hpa ?? ''} hPa</div>
        <div>{climateData?.humidity_pct ?? ''} %</div>
        <div>{new Date(climateData?.timestamp ?? 0).toLocaleString()}</div>
      </div>
      <div className="h-80 w-80 bg-gray-bak relative @container bg-gray-9">
        <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
          {/* <div className="grid-col-span-3 grid-row-span-3 rounded-full bg-conic/decreasing from-violet-700 via-lime-300 to-violet-700" /> */}
          <div
            className={clsx(
              // 'bg-gray-700',
              'grid-col-span-3 grid-row-span-3 rounded-full',
              'bg-[conic-gradient(from_235deg,_theme(colors.blue.700),_theme(colors.lime.300),_theme(colors.red.700)_250deg,#0000_250deg)]',
              // 'mask-[radial-gradient(circle_at_50%_50%,_#0000_calc(50cqi_-_10cqi),_#000_0)]',
              'gauge-band',
            )}
          >
            {/* <div className="mask-radial-at-center mask-radial-from-100% mask-radial-to-80%" /> */}
          </div>
        </div>
        <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
          <div
            className={clsx(
              '@container relative',
              'self-center grid-col-span-3 grid-row-span-3 place-self-center aspect-1 rounded-full',
              'w-[calc(100cqi_-_(2_*_10cqi))]',
              // 'bg-blue',
              // 'mask-[radial-gradient(circle_at_calc(100%_-_calc(100cqi/6))_50%,_#0000_0_2.1cqi,_#FFF_2.1cqi)]',
              // 'needle-clip',
              // 'origin-[calc(100%_-_calc(100cqi/6))_50%]',
              // 'rotate-30deg',
              // 'origin-[calc(100%_-_(calc(100cqi/6)))_50% ]',
            )}
          >
            <ol>
              <li className="clock-rotate-145deg">0</li>
              <li className="clock-rotate-170deg">1</li>
              <li className="clock-rotate-195deg">2</li>
              <li className="clock-rotate-220deg">3</li>
              <li className="clock-rotate-245deg">4</li>
              <li className="clock-rotate-270deg">5</li>
              <li className="clock-rotate-295deg">6</li>
              <li className="clock-rotate-320deg">7</li>
              <li className="clock-rotate-345deg">8</li>
              <li className="clock-rotate-10deg">9</li>
              <li className="clock-rotate-35deg">10</li>
            </ol>
          </div>
        </div>
        <div className="absolute top-0 left-0 grid grid-cols-3 grid-rows-3 h-full w-full">
          <div
            className={clsx(
              'self-center grid-col-start-1 grid-row-start-2 grid-col-end-3 grid-row-end-3 h-5 bg-gray-700',
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
            <div>hPa</div>
          </div>
          <div className="grid-col-start-3 grid-row-start-3 justify-center items-center">
            <div>High</div>
          </div>
        </div>
        {/* <div className="absolute top-[calc(50%-4rem)] left-[calc(50%-4rem)] rounded h-2 w-2 bg-white" /> */}
        {/* <div className="absolute top-50% left-50% translate-x--1/2 translate-y--1/2 rounded-full h-3 w-3 bg-white" /> */}
      </div>
      <Gauge units="hPa" minimum={0} maximum={10} resolution={1} />
    </>
  );
}

export default App;
