# Purpose

*jQuery Cartography* is a plugin that aims to provide a unified interface for GIS queries, independent of the underlying provider.

# Usage

In order to use *jQuery Cartography*, invoke the `cartography()` method on nodes that will display a map.

    $("#map").cartography();

# Options

The following are a list of options that may be used to further configure *jQuery Cartography*:

## center

*Accepts:* object
*Default:* `{ latitude: 0, longitude: 0 }` (equator)

The latitude and longitude coordinate to center map on.

## geocode

*Accepts:* array
*Default:* []

An array of street addresses or geographic coordinate points to geocode from start.

## geolocate

*Accepts:* boolean
*Default:* `false`

If true, attempts to geolocate user on HTML5-capable web browsers.

## map

*Accepts:* boolean
*Default:* `true`

If true, displays a map canvas within nodes.

## mapType

*Accepts:* $.cartography.MapType
*Default:* $.cartography.MapType.NORMAL

The type of map to display.

## markers

*Accepts:* array
*Default:* []

An array of street addresses or geographic coordinates to display as markers on map.

## provider

*Accepts:* string
*Default:* `"Google"`

Identifies the provider to use for GIS functionality.

Presently, the following providers are supported:
* `"Google"`: Google Maps v3

## zoom

*Accepts:* number
*Default:* 1

The default zoom level to span map canvas in.
