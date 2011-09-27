# Purpose

*jQuery Cartography* is a plugin that aims to provide a unified interface for GIS queries, independent of the underlying provider.

# Usage

In order to use *jQuery Cartography*, invoke the `cartography()` method on nodes that will display a map.

    $("#map").cartography();

# Options

The following are a list of options that may be used to further configure *jQuery Cartography*:

## center

*Accepts:* object
*Default:* undefined

The latitude and longitude coordinate to center map on.

### Notice: `center` is *required* if using Google Maps.

## geolocate

*Accepts:* boolean
*Default:* false

If true, attempts to geolocate user on HTML5-capable web browsers.

## map

*Accepts:* boolean
*Default:* true

If true, displays a map canvas within nodes.

## provider

*Accepts:* string
*Default:* "Google"

Identifies the provider to use for GIS functionality.

Presently, the following providers are supported:
* `"ESRI"`: ArcGIS v2.4
* `"Google"`: Google Maps v3

### Notice: ArcGIS depends on Dojo Toolkit.
