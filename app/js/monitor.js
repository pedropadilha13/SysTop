const path = require('path');
const { ipcRenderer } = require('electron');
const { cpu, mem, os } = require('node-os-utils');

let cpuOverload;
let alertFrequency;

ipcRenderer.on('settings:get', (e, settings) => {
  cpuOverload = +settings.cpuOverload;
  alertFrequency = +settings.alertFrequency;
});

setInterval(() => {
  cpu.usage().then(info => {
    document.getElementById('cpu-usage').innerText = info + '%';
    document.getElementById('cpu-progress').style.width = info + '%';
    document.getElementById('cpu-progress').style.background =
      info >= cpuOverload ? 'red' : '#30c88b';

    if (info >= cpuOverload && runNotify(alertFrequency)) {
      notifyUser({
        title: 'CPU overload',
        body: `CPU is over ${cpuOverload}%`,
        icon: path.join(__dirname, 'img', 'icon.png')
      });

      localStorage.setItem('last-notify', +new Date());
    }
  });

  cpu.free().then(info => {
    document.getElementById('cpu-free').innerText = info + '%';
  });

  document.getElementById('sys-uptime').innerHTML = secondsToDhms(os.uptime());
}, 2000);

document.getElementById('cpu-model').innerText = cpu.model();
document.getElementById('comp-name').innerText = os.hostname();
document.getElementById('os').innerText = `${os.type()} ${os.arch()}`;

mem.info().then(info => {
  document.getElementById('mem-total').innerText = info.totalMemMb;
});

function secondsToDhms(seconds) {
  seconds = +seconds;
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d, ${h}h, ${m}m, ${s}s`;
}

function notifyUser(options) {
  new Notification(options.title, options);
}

function runNotify(frequency) {
  if (localStorage.getItem('last-notify') === null) {
    localStorage.setItem('last-notify', +new Date());
    return true;
  }

  const notifyTime = new Date(parseInt(localStorage.getItem('last-notify')));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (1000 * 60));

  return minutesPassed > frequency;
}
