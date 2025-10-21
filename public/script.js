function updateSensorData() {
  fetch('/api/sensors')
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

function updatePrediction() {
  fetch('/api/predict')
    .then(response => response.json())
    .then(data => {
      document.getElementById('risk').textContent = data.risk;
    })
    .catch(error => {
      console.error('Error fetching prediction:', error);
    });
}

function updateChart() {
  fetch('/api/history')
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

function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('loginStatus').textContent = 'Login successful!';
        document.getElementById('loginStatus').style.color = 'green';
      } else {
        document.getElementById('loginStatus').textContent = 'Login failed.';
        document.getElementById('loginStatus').style.color = 'red';
      }
    })
    .catch(error => {
      console.error('Login error:', error);
    });
}

function setupDownloadButton() {
  document.getElementById('downloadBtn').addEventListener('click', () => {
    window.location.href = '/api/export';
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

// Login button listener
document.getElementById('loginBtn').addEventListener('click', handleLogin);