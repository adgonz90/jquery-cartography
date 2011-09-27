/**
 * jQuery Cartography v0.1
 *
 * Copyright (c) 2011, Alfonso Boza
 * All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Lesser General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with
 * this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 ********************************************************************
 * -*- mode: JavaScript; indent-tabs-mode: nil; tab-width: 4 -*-    *
 * vim: set autoindent expandtab shiftwidth=4 smartindent tabstop=4 *
 ********************************************************************/
;(function($) {
    var defaults = {
        },
        instances = {
            providers: {},
            total: 0
        },
        ns = "cartography";
    
    function Cartography(options) {
        var method = options.method,
            provider = options.provider,
            instance;
    
        // Create instance of provider.
        if (typeof method === "string") {
            instance = $(this).data(ns);
            
            if (!instance || !instance.isCartography) {
                $.error("jQuery Cartography has not been initialized.");
            }
            else if (typeof instance[method] === "function") {
                return instance[method].call(this, options);
            }
            else {
                $.error("Requested method not supported by jQuery Cartography.");
            }
        }
        else if (typeof Provider[provider] === "function") {
            if (!Provider[provider].prototype.isCartography) {
                Provider[provider].prototype = Provider();
            }
            
            $(this).data(ns, new Provider[provider](options, this));
        }
        // Otherwise, notify of invalid provider.
        else {
            $.error("Unrecognized jQuery Cartography provider.");
        }
    }
    
    function Provider() {
        return {
            geocode: function() {
                $.error("Provider unable to geocode location.");
            },
            isCartography: true,
            mark: function() {
                $.error("Provider unable to mark locations on map.");
            },
            unmark: function() {
                $.error("Provider unable to unmark locations on map.");
            }
        };
    }
    
    Provider.Google = function(options, node) {
        var $this = $(node),
            geocoder = new google.maps.Geocoder(),
            map;
        
        // Name of provider.
        this.name = "Google";
        // Version of provider's API.
        this.version = "3";
        
        // Expose methods.
        this.geocode = Geocode;
        
        // Determine whether to display map.
        if (options.map) {
            DisplayMap();
        }
        
        // Displays map within sent node.
        function DisplayMap() {
            var center = new google.maps.LatLng(options.center.latitude, options.center.longitude),
                mapOptions = {
                    center: center,
                    mapTypeId: MapType(options.mapType),
                    zoom: options.zoom
                };
            
            map = new google.maps.Map(node, mapOptions);
        }
        
        // Geocodes with Google Maps API.
        function Geocode(location) {
            var request = {};
            
            if (location.latitude && location.longitude) {
                request.location = new google.maps.LatLng(location.latitude,
                                                          location.longitude);
            }
            else if (location.address) {
                request.address = location.address;
            }
            else {
                $.error("No location was given to geocode.");
            }
            
            geocoder.geocode(request, function(result, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (typeof location.onSuccess === "function") {
                        location.onSuccess(result, status);
                    }
                    else {
                        $this.trigger("geocode_success", {
                            results: result,
                            status: status
                        });
                    }
                }
                else if (typeof location.onFailure === "function") {
                    location.onFailure(status);
                }
                else {
                    $this.trigger("geocode_failure", status);
                }
            });
        }
        
        // Determines the map type requested.
        function MapType(type) {
            var mapTypes = $.cartography.MapType;
            switch (type) {
                case mapTypes.NORMAL:
                    return google.maps.MapTypeId.ROADMAP;
                case mapTypes.SATELLITE:
                    return google.maps.MapTypeId.SATELLITE;
                case mapTypes.HYBRID:
                    return google.maps.MapTypeId.HYBRID;
            }
        }
    }
    
    // Create namespace in jQuery.
    $.cartography = $.cartography || {};
    
    // List supported map types.
    $.cartography.MapType = {
        NORMAL:     0,
        SATELLITE:  1,
        HYBRID:     2
    };
    
    // Geocodes given location.
    $.cartography.geocode = function(context, location) {
        // Wrap nodes or its selector string in a jQuery object.
        if (typeof context === "string" || context.nodeType) {
            context = $(context);
        }
        
        // If jQuery, call the Cartography's geocode() method.
        if (context.selector !== undefined) {
            context.cartography("geocode", location);
        }
        // Otherwise, notify of error.
        else {
            $.error("Cannot determine context to geocode in.");
        }
    };
    
    // Expose jQuery Cartography plugin.
    $.fn.cartography = function(name, options) {
        var opts;
        
        // Merge method name and its options.
        if (typeof name === "string") {
            opts = $.extend({}, { method: name }, options);
        }
        // Otherwise, merge plugin options with defaults.
        else {
            options = name;
            opts = $.extend({}, $.fn.cartography.defaults, options);
        }
        
        return this.each(function() {
            // Merge metadata for node.
            var o = $.metadata ? $.extend({}, opts, $.metadata.get(this)) : opts;
            
            // Call plugin.
            Cartography.call(this, o);
        });
    };
    
    // Expose default values.
    $.fn.cartography.defaults = {
        // Indicates whether to geolocate upon initialization.
        geolocate:  false,
        // Indicates whether to display a map.
        map:        true,
        // Default map type to display.
        mapType:    $.cartography.MapType.NORMAL,
        // List of markers to display on map.
        markers:    [],
        // List of overlays to display on map.
        overlays:   [],
        // Name of map provider.
        provider:   "Google",
        // Default zoom level.
        zoom:       1,
        // Range of zooms levels allowed on map.
        zoomRange:  []
    };
})(jQuery);
