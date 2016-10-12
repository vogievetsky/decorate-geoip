#!/usr/bin/env node

var geoip = require('geoip-lite');
var byline = require('byline');
var through2 = require('through2');

const argv = require('yargs')
  .usage('decorate-geoip --ip ip --latitude lat --longitude lon')
  .example('decorate-geoip --latitude lat --longitude lon', 'Adds a lat and lon field')
  .string(['ip', 'latitude', 'longitude', 'country', 'region', 'city'])
  .describe('latitude', 'latitude to add')
  .describe('longitude', 'longitude to add')
  .describe('country', 'country to add')
  .describe('region', 'region to add')
  .describe('city', 'city to add')
  .help('h')
  .alias('h', 'help')
  .argv;

const ipAttribute = argv['ip'] || 'ip';

const latitude = argv['latitude'];
const longitude = argv['longitude'];
const country = argv['country'];
const region = argv['region'];
const city = argv['city'];

function lookupLatLon(event) {
  const ip = event[ipAttribute];
  if (!ip) return null;

  const geo = geoip.lookup(ip);
  if (geo && Array.isArray(geo.ll)) {
    return geo;
  } else {
    return null;
  }
}

byline(process.stdin)
  .pipe(through2(function (line, enc, callback) {
    var event = null;
    try {
      event = JSON.parse(line.toString());
    } catch (e) {
      console.error('Could not parse:', line.toString());
      process.exit(1);
    }

    var geo = lookupLatLon(event);
    if (geo) {
      if (country)   event[country]   = geo.country || null;
      if (region)    event[region]    = geo.region || null;
      if (city)      event[city]      = geo.city || null;
      if (latitude)  event[latitude]  = geo.ll[0];
      if (longitude) event[longitude] = geo.ll[1];
    } else {
      if (country)   event[country]   = null;
      if (region)    event[region]    = null;
      if (city)      event[city]      = null;
      if (latitude)  event[latitude]  = null;
      if (longitude) event[longitude] = null;
    }

    this.push(JSON.stringify(event) + "\n");
    callback();
   }))
  .pipe(process.stdout);
