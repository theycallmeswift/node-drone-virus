var parseString = require('xml2js').parseString
  , exec = require('child_process').exec
  , fs = require('fs')
  , drone = require('ar-drone');

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
          console.log(client);
          client.takeoff();
          client.after(10000,function() {client.land();});
        });
      });
    });
  });
