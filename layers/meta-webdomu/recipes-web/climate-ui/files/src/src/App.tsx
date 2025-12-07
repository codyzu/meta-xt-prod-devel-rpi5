import {useEffect, useState} from 'react';
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
      if (import.meta.env.DEV) {
        const temperature = Math.round(Math.random() * 600 - 200) / 10;
        const humidity = Math.round(Math.random() * 1000) / 10;
        const pressure = Math.round(Math.random() * 1000 + 500);

        if (cancel) {
          return;
        }

        setClimateData((previous) => ({
          ...previous,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          temperature_c: temperature,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          humidity_pct: humidity,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          pressure_hpa: pressure,
          timestamp: Date.now(),
        }));

        return;
      }

      const response = await fetch('http://192.168.0.103:5000/api/climate');

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
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 justify-center bg-gray-700 rounded-full p-4">
          <div className="w-full aspect-square p-4 bg-gray-800 rounded-full inset-shadow-sm inset-shadow-gray-500">
            <Gauge
              units="°C"
              minimum={-40}
              maximum={40}
              resolution={8}
              value={climateData.temperature_c}
            />
          </div>
          <div className="w-full aspect-square p-4 bg-gray-800 rounded-full inset-shadow-sm inset-shadow-gray-500">
            <Gauge
              units="hPa"
              minimum={500}
              maximum={1500}
              resolution={200}
              value={climateData.pressure_hpa}
            />
          </div>
          <div className="w-full aspect-square p-4 bg-gray-800 rounded-full inset-shadow-sm inset-shadow-gray-500">
            <Gauge
              units="%"
              minimum={0}
              maximum={100}
              resolution={20}
              value={climateData.humidity_pct}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
