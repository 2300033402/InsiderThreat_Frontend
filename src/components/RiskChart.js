import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

function RiskChart({ data }) {
  const chartData = {
    labels: data.map(d => `User ${d.userId}`),
    datasets: [
      {
        label: "Risk Score",
        data: data.map(d => d.score),
        borderColor: "red",
      }
    ]
  };

  return (
    <div style={{ width: "60%", marginBottom: 30 }}>
      <Line data={chartData} />
    </div>
  );
}

export default RiskChart;
