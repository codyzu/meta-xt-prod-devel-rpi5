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
    temperature_c: 8.5,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    pressure_hpa: 1013,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    humidity_pct: 45,
    timestamp: Date.now(),
  });

  useEffect(() => {
    let cancel = false;
    const handle = setInterval(async () => {
      const temperature = Math.round(Math.random() * 100) / 10;
      if (cancel) {
        return;
      }

      console.log('Simulated temperature:', temperature);

      setClimateData((previous) => ({
        ...previous,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        temperature_c: temperature,
        timestamp: Date.now(),
      }));
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
      <Gauge
        units="hPa"
        minimum={0}
        maximum={10}
        resolution={1}
        value={climateData.temperature_c}
        // Value={0}
      />
    </>
  );
}

export default App;
