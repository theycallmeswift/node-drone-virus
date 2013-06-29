var net = require('net');
var ipnum = 99;
var client = net.connect({port: 23, host: "192.168.1.1"},
function() {
    console.log('client connected');
    client.write('ifconfig ath0 down ; iwconfig ath0 mode managed essid DroneVirus ap any channel auto commit ; ifconfig ath0 192.168.43.'+ipnum+' netmask 255.255.255.0 up\r\n');
});

client.on('data', function(data) {
  console.log(data.toString());
  client.end();
});

client.on('end', function() {
  console.log('client disconnected');
});
