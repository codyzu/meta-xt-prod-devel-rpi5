import {useEffect, useState} from 'react';

type ClimateData = {
  temperature_c: number;
  pressure_hpa: number;
  humidity_pct: number;
  timestamp: number;
};

function App() {
  const [climateData, setClimateData] = useState<ClimateData>();

  useEffect(() => {
    let cancel = false;
    const handle = setInterval(async () => {
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
    <div className="mx-auto max-w-lg p-4">
      <div>{climateData?.temperature_c ?? ''} °C</div>
      <div>{climateData?.pressure_hpa ?? ''} hPa</div>
      <div>{climateData?.humidity_pct ?? ''} %</div>
      <div>{new Date(climateData?.timestamp ?? 0).toLocaleString()}</div>
    </div>
  );
}

export default App;
