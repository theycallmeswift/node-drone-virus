var ArDroneFleet = require('../index');

var fleet = new ArDroneFleet({
	drone1 : {ip : "192.168.1.99"},
	drone2 : {ip : "192.168.1.98"}
});

fleet.takeoff();

fleet.on('takeoff',function(data){
	console.log(data.drone + " tookoff");
	fleet.land();
});