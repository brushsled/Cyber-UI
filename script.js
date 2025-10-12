// 初期化：グラフ描画
function initChart() {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  window.trafficChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['10:23', '10:24', '10:25', '10:26'],
      datasets: [{
        label: 'Throughput (MB/s)',
        data: [30, 45, 38, 50],
        borderColor: '#00ffff',
        backgroundColor: 'rgba(0,255,255,0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#cceeff' } },
        y: { ticks: { color: '#cceeff' } }
      },
      plugins: {
        legend: { labels: { color: '#cceeff' } }
      }
    }
  });
}

// ターゲット移動処理
function moveTarget(targetId, angleDegrees, radius) {
  const target = document.getElementById(targetId);
  const angle = angleDegrees * (Math.PI / 180);
  const centerX = 100;
  const centerY = 100;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  target.setAttribute("cx", x);
  target.setAttribute("cy", y);
}

// Threat Matrix に脅威を追加
function addThreat(id, type, severity) {
  const threatList = document.getElementById('threat-list');
  const li = document.createElement('li');
  li.innerHTML = `<strong>${id}</strong> – ${type} – <span class="${severity.toLowerCase()}">Severity: ${severity}</span>`;
  threatList.appendChild(li);

  if (threatList.children.length > 10) {
    threatList.removeChild(threatList.firstChild);
  }
}

// タイムスタンプ生成
function getTimestamp() {
  const now = new Date();
  return `[${now.toLocaleTimeString('en-GB')}]`;
}

// ログ追加処理（すべての連動を統合）
function addLogEntry() {
  const logMessages = [
    "Connection established to node #A17",
    "Handshake protocol completed",
    "Data stream initiated (Protocol: AES-256)",
    "Packet integrity verified",
    "Incoming request from IP: 192.168.0.254",
    "Authentication success (User: admin)",
    "Command executed: /sys/scan --deep",
    "Anomaly detected: ID#A47X (Severity: Medium)",
    "Alert dispatched to monitoring node #B03",
    "Response protocol initiated",
    "Threat containment procedure active",
    "Status: STABLE / Monitoring continues",
    "Critical breach detected: ID#X99Z (Severity: High)"
  ];

  const message = logMessages[Math.floor(Math.random() * logMessages.length)];
  const timestamp = getTimestamp();
  const logContainer = document.getElementById('event-log');
  const li = document.createElement('li');
  li.textContent = `${timestamp} ${message}`;
  logContainer.appendChild(li);

  if (logContainer.children.length > 50) {
    logContainer.removeChild(logContainer.firstChild);
  }

  logContainer.scrollTop = logContainer.scrollHeight;

  // レーダー反応
  const radarPanel = document.getElementById('radar-panel');
  const targetDot = document.getElementById('target-dot');
  if (message.includes("Anomaly detected")) {
    radarPanel.classList.add("radar-alert");
    targetDot.classList.add("blinking");
    setTimeout(() => {
      radarPanel.classList.remove("radar-alert");
      targetDot.classList.remove("blinking");
    }, 5000);

    // Threat Matrix に追加
    addThreat("ID#" + Math.floor(Math.random() * 1000), "Cyber Intrusion", "Medium");
  }
  if (message.includes("Critical breach detected")) {
  radarPanel.classList.add("radar-alert");
  targetDot.classList.add("blinking");
  setTimeout(() => {
    radarPanel.classList.remove("radar-alert");
    targetDot.classList.remove("blinking");
  }, 5000);

  // Threat Matrix に重大な脅威を追加
  addThreat("ID#" + Math.floor(Math.random() * 1000), "System Breach", "High");
}

  // グラフ更新
  const label = timestamp.slice(1, 6);
  let value = Math.floor(Math.random() * 40) + 30;
  if (message.includes("Anomaly detected")) {
    value += 50;
  }

  trafficChart.data.labels.push(label);
  trafficChart.data.datasets[0].data.push(value);
  if (trafficChart.data.labels.length > 20) {
    trafficChart.data.labels.shift();
    trafficChart.data.datasets[0].data.shift();
  }
  trafficChart.update();
}

// ターゲット移動ループ
let angle1 = 0;
let angle2 = 180;
setInterval(() => {
  moveTarget("target1", angle1, 40);
  moveTarget("target2", angle2, 70);
  angle1 = (angle1 + 5) % 360;
  angle2 = (angle2 + 3) % 360;
}, 100);

// 初期化とログ更新開始
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  setInterval(addLogEntry, 3000);
});
function updateSystemStatus() {
  const cpu = Math.floor(Math.random() * 40) + 30; // 30〜70%
  const memUsed = (Math.random() * 12 + 2).toFixed(1); // 2〜14GB
  const biosVersions = ["A17X-3.4.2", "B03Z-5.1.0", "C88Y-2.9.8"];
  const biosDates = ["2025-03-12", "2024-11-08", "2023-07-21"];
  const makers = ["CyberCore Systems", "NeuroTek Labs", "QuantumForge"];

  // ゲージの更新（style.width と表示テキスト）
  document.getElementById('gauge-cpu').style.width = `${cpu}%`;
  document.getElementById('val-cpu').textContent = `${cpu}%`;

  const temp = Math.floor(Math.random() * 30) + 40;
  document.getElementById('gauge-temp').style.width = `${temp}%`;
  document.getElementById('val-temp').textContent = `${temp}°C`;

  const memPercent = Math.floor((memUsed / 16) * 100);
  document.getElementById('gauge-mem').style.width = `${memPercent}%`;
  document.getElementById('val-mem').textContent = `${memUsed} / 16 GB`;

  const threat = Math.floor(Math.random() * 30);
  document.getElementById('gauge-threat').style.width = `${threat}%`;
  document.getElementById('val-threat').textContent = `${threat}%`;

  const disk = Math.floor(Math.random() * 50) + 40;
  document.getElementById('gauge-disk').style.width = `${disk}%`;
  document.getElementById('val-disk').textContent = `${disk}%`;

  // BIOS情報の更新
  document.getElementById('bios-version').textContent = biosVersions[Math.floor(Math.random() * biosVersions.length)];
  document.getElementById('bios-date').textContent = biosDates[Math.floor(Math.random() * biosDates.length)];
  document.getElementById('bios-maker').textContent = makers[Math.floor(Math.random() * makers.length)];
}

// 5秒ごとに更新
setInterval(updateSystemStatus, 5000);
function updateMetricsPanel() {
  const cpu = Math.floor(Math.random() * 40) + 30;
  const temp = Math.floor(Math.random() * 30) + 40;
  const mem = Math.floor(Math.random() * 60) + 20;
  const threat = Math.floor(Math.random() * 30);
  const disk = Math.floor(Math.random() * 50) + 40;

  const metrics = [
    { id: 'cpu', value: cpu, suffix: '%' },
    { id: 'temp', value: temp, suffix: '°C' },
    { id: 'mem', value: mem, suffix: '%' },
    { id: 'threat', value: threat, suffix: '%' },
    { id: 'disk', value: disk, suffix: '%' }
  ];

  metrics.forEach(m => {
    const bar = document.getElementById(`gauge-${m.id}`);
    const label = document.getElementById(`val-${m.id}`);
    if (bar && label) {
      bar.style.width = `${m.value}%`;
      label.textContent = `${m.value}${m.suffix}`;
    }
  });
}

// 初期化時に追加
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  setInterval(addLogEntry, 3000);
  setInterval(updateSystemStatus, 5000);
  setInterval(updateMetricsPanel, 3000); // ← これが必要
});
if (message.includes("Critical breach detected")) {
  radarPanel.classList.add("radar-alert");
  targetDot.classList.add("blinking");
  setTimeout(() => {
    radarPanel.classList.remove("radar-alert");
    targetDot.classList.remove("blinking");
  }, 5000);

  // Threat Matrix に重大な脅威を追加
  addThreat("ID#" + Math.floor(Math.random() * 1000), "System Breach", "High");
}



