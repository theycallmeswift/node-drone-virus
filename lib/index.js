var Wireless = require('./wireless')
  , async = require('async')
  , arDrone = require('ar-drone')
  , net = require('net');

function isDrone(cb) {
  console.log("Setting up to test if isDrone");
  setTimeout(function() {
    var client = arDrone.createClient();

    client.config('general:navdata_demo', 'FALSE');

    client.on('altitudeChange', function(alt) {
      console.log("IT IS ALIVE (" + alt + ")");
      if(alt > 0) {
        client.land();
      } else {
        cb(true);
      }
    });

    client.takeoff();

    setTimeout(function() {
      console.log("Probably not a drone");
      cb(false);
    }, 5000);
  }, 5000);
};

var network = new Wireless({ });

network.scan(function(err, networks) {
  var insecureNetworks = networks.filter(function(network) {
    return network.security == "NONE";
  }).map(function(network) {
    return network.ssid;
  });

  async.eachSeries(insecureNetworks, function(ssid, callback) {
    console.log("Connecting to " + ssid);

    if(!(ssid == "bart" || ssid == "DroneVirus")) {
      console.log("Skipping " + ssid);
      return callback();
    }

    network.connect(ssid, function(err) {
      console.log("Connected to " + ssid);
      if(err) {
        return callback(err);
      }

      isDrone(function(yes) {
        if(yes) {
          console.log(ssid + " is a drone");
          callback();
        } else {
          console.log(ssid + " isn't a drone");
          callback()
        }
      });
    });
  }, function(err) {
    console.log("DONE!!!");
    process.exit(1);
  });

});

