// Fetch latest sensor readings
function updateSensorData() {
  fetch('https://smartaqms.onrender.com/api/sensors')
    .then(response => response.json())
    .then(data => {
      document.getElementById('aqi').textContent = data.aqi;
      document.getElementById('humidity').textContent = data.humidity + '%';
      document.getElementById('temperature').textContent = data.temperature + '°C';
      document.getElementById('co2').textContent = data.co2_ppm + ' ppm';
      document.getElementById('no2').textContent = data.no2_ppm + ' ppm';
    })
    .catch(error => {
      console.error('Error fetching sensor data:', error);
    });
}

// Fetch disease prediction
function updatePrediction() {
  fetch('https://smartaqms.onrender.com/api/predict')
    .then(response => response.json())
    .then(data => {
      document.getElementById('risk').textContent = data.risk;
      document.getElementById('disease').textContent = data.disease;
      document.getElementById('cure').textContent = data.cure;
    })
    .catch(error => {
      console.error('Error fetching prediction:', error);
    });
}

// Fetch historical data and render chart
function updateChart() {
  fetch('https://smartaqms.onrender.com/api/history')
    .then(response => response.json())
    .then(data => {
      const timestamps = data.map(entry => new Date(entry.timestamp).toLocaleTimeString());
      const aqiValues = data.map(entry => entry.aqi);

      const ctx = document.getElementById('aqiChart').getContext('2d');
      if (window.aqiChart) {
        window.aqiChart.data.labels = timestamps;
        window.aqiChart.data.datasets[0].data = aqiValues;
        window.aqiChart.update();
      } else {
        window.aqiChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: timestamps,
            datasets: [{
              label: 'AQI Over Time',
              data: aqiValues,
              borderColor: '#00796b',
              backgroundColor: 'rgba(0, 121, 107, 0.1)',
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    })
    .catch(error => {
      console.error('Error fetching history:', error);
    });
}

// Setup CSV download button
function setupDownloadButton() {
  document.getElementById('downloadBtn').addEventListener('click', () => {
    window.location.href = 'https://smartaqms.onrender.com/api/export';
  });
}

// Initial load
updateSensorData();
updatePrediction();
updateChart();
setupDownloadButton();

// Auto-refresh every 10 seconds
setInterval(() => {
  updateSensorData();
  updatePrediction();
  updateChart();
}, 10000);