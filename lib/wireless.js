var EventEmitter = require('events').EventEmitter
  , exec = require('child_process').exec
  , util = require("util")
  , airport = require( 'airport-wrapper' );

var async = require('async');

function Wireless(opts) {
  opts || (opts = {});
  this.connected = false;
  this.connecting = false;
  this.networks = [];
  this.interface = opts.interface || "en1";
  this.log = opts.log || function() { };
  this.scanner = null;
  this.airport = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport";

  EventEmitter.call(this);
}

util.inherits(Wireless, EventEmitter);

Wireless.prototype.scan = function scan(cb) {
  var self = this;
  cb = cb || function() { };

  exec(self.airport + " --scan", function(err, stdout, stderr) {
    if(err || stderr) {
      err || (err = stderr);
      return cb(err);
    }

    self.networks = [];

    var networks = stdout.trim().split('\n');

    for(var i = 1; i < networks.length; i++) {
      var network = networks[i]
        , parts = network.trim().split(/\s+/)
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

      self.emit('appear', obj);

      self.networks.push(obj);
    };

    cb(null, self.networks);
  });
};

Wireless.prototype._isActuallyConnected = function(ssid, cb) {
  var self = this;
  exec("networksetup -getinfo Wi-Fi", function(err, stdout, stderr) {
    if(err || stderr) {
      err || (err = stderr);
      return cb(err);
    }

    self.log(stdout);

    if(/Router: 192\.168\.\d+\.1/.test(stdout)) {
      return cb(null, true);
    } else {
      return cb(null, false);
    }
  });
};

Wireless.prototype.connect = function(ssid, cb) {
  var self = this
    , network;
  cb || (cb = function() { });

  if(self.connecting) {
    return cb(new Error("Connection in progress"));
  }

  matchingNetworks = self.networks.filter(function(obj) {
    return obj.ssid == ssid;
  });

  if(matchingNetworks.length < 1) {
    return cb(new Error("SSID not in range, please scan again"));
  }

  self.connected = false;
  self.connecting = true;

  exec("networksetup -setairportnetwork " + self.interface + " " + ssid, function(err, stdout, stderr) {
    if(err || stderr) {
      err || (err = stderr);
      return cb(err);
    }

    async.until(function() {
      return self.connected == true;
    }, function(cb) {
      self._isActuallyConnected(ssid, function(err, connected) {
        if(err) {
          self.connecting = false;
          return cb(err);
        }

        if(connected) {
          self.connected = true;
          self.connecting = false;
        }

        setTimeout(cb, 1000);
      });
    }, function(err) {
      if(!err) {
        self.log("Connected to " + ssid);
        self.emit('connected', ssid);
        cb();
      } else {
        self.log("Error connecting to " + ssid);
        self.emit('error', ssid);
        cb(err);
      }
    });
  });
};

module.exports = Wireless;
