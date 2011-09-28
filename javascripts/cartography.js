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
    var ns = "cartography",
        events = {
            Geocode: {
                BEGIN: [ns, "geocode_begin"].join("_"),
                END: [ns, "geocode_end"].join("_")
            },
            Map: {
                LOADING: [ns, "map_loading"].join("_"),
                LOADED: [ns, "map_loaded"].join("_")
            },
            Mark: {
                BEGIN: [ns, "mark_begin"].join("_"),
                END: [ns, "mark_end"].join("_")
            }
        };
    
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
            markers = {
                anonymous: []
            },
            map;
        
        // Name of provider.
        this.name = "Google";
        // Version of provider's API.
        this.version = "3";
        
        // Expose methods.
        this.destroy = Destroy;
        this.geocode = Geocode;
        this.mark = Mark;
        this.unmark = Unmark;
        
        // --- //
        
        // Bind to notifications to begin geocoding.
        $this.bind([events.Geocode.BEGIN, ns].join("."), function() {
            // Determine whether to geocode.
            if (options.geocode.length) {
                // Geocode each location.
                $.each(options.geocode, function(i, location) {
                    Geocode(location);
                });
            }
        });
        
        // Bind to notifications to trigger events once map has loaded.
        $this.bind([events.Map.LOADED, ns].join("."), function() {
            $this.trigger(events.Geocode.BEGIN);
            $this.trigger(events.Mark.BEGIN);
        });
        
        // Bind to notifications to begin marking map.
        $this.bind([events.Mark.BEGIN, ns].join("."), function() {
            // Mark map if necessary.
            if (options.markers.length) {
                // Mark each location.
                $.each(options.markers, function(i, location) {
                    Mark(location);
                });
            }
        });
        
        // Display map if necessary.
        options.map && DisplayMap();
        
        // --- //
        
        // Destroys objects.
        function Destroy() {
            $this.unbind(ns);
            delete geocoder;
            delete map;
        }
        
        // Displays map within sent node.
        function DisplayMap() {
            var center = new google.maps.LatLng(options.center.latitude, options.center.longitude),
                mapOptions = {
                    center: center,
                    mapTypeId: MapType(options.mapType),
                    zoom: options.zoom
                };
            
            // Notify that map is loading.
            $this.trigger(events.Map.LOADING);
            
            // Load map.
            map = new google.maps.Map(node, mapOptions);
            $this.trigger(events.Map.LOADED);
        }
        
        // Geocodes with Google Maps API.
        function Geocode(location) {
            var request = {};
            
            // Transform a string sent as parameter to expected key.
            if (location.parameter) {
                location.address = location.parameter;
            }
            
            // Determine whether given coordinate to reverse geocode.
            if (location.latitude && location.longitude) {
                request.location = new google.maps.LatLng(location.latitude,
                                                          location.longitude);
            }
            // Or an address to geocode.
            else if (location.address) {
                request.address = location.address;
            }
            // Otherwise, throw error.
            else {
                $.error("No location was given to geocode.");
            }
            
            // Perform geocode request.
            geocoder.geocode(request, function(result, status) {
                var results = {
                        id: location.id,
                        status: status
                    };
                
                if (status === google.maps.GeocoderStatus.OK) {
                    results.results = result;
                    if (typeof location.onSuccess === "function") {
                        location.onSuccess(results);
                    }
                    else {
                        $this.trigger($.cartography.events.Geocode.SUCCESS, results);
                    }
                }
                else if (typeof location.onFailure === "function") {
                    location.onFailure(results);
                }
                else {
                    $this.trigger($.cartography.events.Geocode.FAILURE, results);
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
                default:
                    $.error("Unknown map type.");
            }
        }
        
        // Drops a marker on location.
        function Mark(location) {
            // Ensure map is loaded.
            map || $.error("Map is not loaded.");
            
            // Determine whether given a coordinate.
            if (location.latitude && location.longitude) {
                var marker = new google.maps.Marker({
                        map: map,
                        position: new google.maps.LatLng(location.latitude, location.longitude)
                    });
                
                if (location.id !== undefined && location.id !== "anonymous") {
                    markers[location.id] = marker;
                }
                else {
                    markers.anonymous.push(marker);
                }
            }
            // Or if given an address.
            else if (location.address) {
                // Geocode address first, then mark its location.
                Geocode($.extend({}, location, {
                    onSuccess: function(value) {
                        var result = value.results[0].geometry;
                        
                        Mark($.extend({}, location, {
                            latitude: result.location.lat(),
                            longitude: result.location.lng()
                        }));
                    },
                    onFailure: function() {
                        $.error("Failed to mark given address.");
                    }
                }));
            }
            // Otherwise, raise error.
            else {
                $.error("No location given to mark.");
            }
        }
        
        // Removes a marker from map.
        function Unmark(marker) {
            var id = marker.parameter || {};
            
            // Ensure map is loaded.
            map || $.error("Map is not loaded.");
            
            // Iterate through array if necessary.
            if (id.length) {
                $.each(id, function(i) {
                    Unmark(id[i]);
                });
            }
            // Otherwise, delete marker.
            if (markers[id] && id !== "anonymous") {
                markers[id].setMap(null);
                delete markers[id];
            }
        }
    }
    
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
    
    // Create namespace in jQuery.
    $.cartography = $.cartography || {};
    
    // List supported cartography events.
    $.cartography.events = {
        // Geocoding-related events.
        Geocode: {
            FAILURE: "geocode_failure",
            SUCCESS: "geocode_success"
        }
    };
    
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
            opts = $.extend({}, { method: name }, typeof options === "string" ? { parameter: options } : options);
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
        // Initial center of map.
        center:     { latitude: 0, longitude: 0 },
        // List of objects to geocode at startup.
        geocode:    [],
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
