/**
 * jQuery Cartography v0.1
 *
 * Copyright (c) 2011, Alfonso Boza
 * All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 * -*- mode: JavaScript; indent-tabs-mode: nil; tab-width: 4 -*-        *
 * vim: set autoindent expandtab shiftwidth=4 smartindent tabstop=4     *
 * jslint devel: true, browser: true, maxerr: 50, maxlen: 80, indent: 4 *
 ************************************************************************/
(function ($) {
    "use strict";
    var ns = "cartography",
        events = {
            Geocode: {
                BEGIN: [ns, "geocode_begin"].join("_"),
                END: [ns, "geocode_end"].join("_")
            },
            Geolocation: {
                BEGIN: [ns, "geolocate_begin"].join("_"),
                END: [ns, "geolocate_end"].join("_")
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
        function Geolocate() {
            var events = $.cartography.events.Geolocation,
                geolocation;
            
            function Failure(status) {
                var e;
                
                // Determine error status.
                switch (status.code) {
                case status.PERMISSION_DENIED:
                    e = events.DENIED;
                    break;
                case status.POSITION_UNAVAILABLE:
                    e = events.UNAVAILABLE;
                    break;
                case status.TIMEOUT:
                    e = events.TIMEOUT;
                    break;
                default:
                    e = events.UNKNOWN;
                }
                
                // Notify of error.
                $(this).trigger(e, status);
            }
            
            function Success(position) {
                // Notify of success with user position.
                $(this).trigger(events.SUCCESS, position);
            }
            
            if (navigator && navigator.geolocation) {
                // Attempt to geolocate if HTML5-compliant web browser.
				var options = { maximumAge: 60000, timeout: 30000, enableHighAccuracy: true };
                geolocation = navigator.geolocation;
                geolocation.getCurrentPosition($.proxy(Success, this),
                                               $.proxy(Failure, this),
											   options);
            } else {
                // Otherwise, notify of unsupported web browser.
                $(this).trigger(events.UNSUPPORTED);
            }
        }
        
        return {
            // Geolocates if web browser if HTML5 complaint.
            geolocate: Geolocate,
            // Identifies a cartographic provider.
            isCartography: true
        };
    }
    
    Provider.Google = function (options, node) {
        var $this = $(node),
            self = this,
            map,
            markers = {
                anonymous: []
            },
            geocoder = new google.maps.Geocoder(),
            getMapType = function (type) {
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
            },
            displayMap = function () {
                var center = new google.maps.LatLng(options.center.latitude,
                                                    options.center.longitude),
                    mapOptions = {
                        center: center,
                        mapTypeId: getMapType(options.mapType),
                        zoom: options.zoom
                    };
                
                // Notify that map is loading.
                $this.trigger(events.Map.LOADING);
                
                // Load map.
                map = new google.maps.Map(node, mapOptions);
                $this.trigger(events.Map.LOADED);
            };
        
        // Name of provider.
        this.name = "Google";
        // Version of provider's API.
        this.version = "3";
        
        // --- //
        
        // Destroys objects.
        function Destroy() {
            // No-op. (Previous implementation was not working.)
        }
        
        // Geocodes with Google Maps API.
        function Geocode(location) {
            var request = {};
            
            if (location.parameter) {
                // Transform a string sent as parameter to expected key.
                location.address = location.parameter;
            }
            
            if (location.latitude && location.longitude) {
                // Determine whether given coordinate to reverse geocode.
                request.location = new google.maps.LatLng(location.latitude,
                                                          location.longitude);
            } else if (location.address) {
                // Or an address to geocode.
                request.address = location.address;
            } else {
                // Otherwise, throw error.
                $.error("No location was given to geocode.");
            }
            
            // Perform geocode request.
            geocoder.geocode(request, function (result, status) {
                var results = {
                        id: location.id,
                        status: status
                    };
                
                if (status === google.maps.GeocoderStatus.OK) {
                    results.results = result;
                    if (typeof location.onSuccess === "function") {
                        location.onSuccess(results);
                    } else {
                        $this.trigger($.cartography.events.Geocode.SUCCESS,
                                      results);
                    }
                } else if (typeof location.onFailure === "function") {
                    location.onFailure(results);
                } else {
                    $this.trigger($.cartography.events.Geocode.FAILURE,
                                  results);
                }
            });
        }
        
        // Drops a marker on location.
        function Mark(location) {
            // Ensure map is loaded.
            if (!map) {
                $.error("Map is not loaded.");
            }
            
            // Determine whether given a coordinate or an address.
            if (location.latitude && location.longitude) {
                var marker = new google.maps.Marker({
                        map: map,
                        position: new google.maps.LatLng(location.latitude,
                                                         location.longitude)
                    });
                
                // Create a map marker if given a coordinate.
                if (location.id !== undefined && location.id !== "anonymous") {
                    markers[location.id] = marker;
                } else {
                    markers.anonymous.push(marker);
                }
            } else if (location.address) {
                // Geocode address first, then mark its location.
                self.geocode($.extend({}, location, {
                    onSuccess: function (value) {
                        var result = value.results[0].geometry;
                        
                        self.mark($.extend({}, location, {
                            latitude: result.location.lat(),
                            longitude: result.location.lng()
                        }));
                    },
                    onFailure: function () {
                        $.error("Failed to mark given address.");
                    }
                }));
            } else {
                // Otherwise, raise error.
                $.error("No location given to mark.");
            }
        }
        
        // Removes a marker from map.
        function Unmark(marker) {
            var id = marker.parameter || {};
            
            // Ensure map is loaded.
            if (!map) {
                $.error("Map is not loaded.");
            }
            
            // Iterate through array if necessary.
            if (id.length) {
                $.each(id, function (i) {
                    self.unmark(id[i]);
                });
            }
            // Otherwise, delete marker.
            if (markers[id] && id !== "anonymous") {
                markers[id].setMap(null);
                delete markers[id];
            }
        }
        
        // --- //
        
        // Expose methods.
        this.destroy = Destroy;
        this.geocode = Geocode;
        this.geolocate = $.proxy(Provider.Google.prototype.geolocate, node);
        this.mark = Mark;
        this.unmark = Unmark;
        
        // --- //
        
        // Bind to notifications to begin geocoding.
        $this.bind([events.Geocode.BEGIN, ns].join("."), function () {
            // Determine whether to geocode.
            if (options.geocode.length) {
                // Geocode each location.
                $.each(options.geocode, function (i, location) {
                    self.geocode(location);
                });
            }
        });
        
        // Bind to notifications to begin geolocating.
        $this.bind([events.Geolocation.BEGIN, ns].join("."), function () {
            // Geolocate if necessary.
            if (options.geolocate) {
                self.geolocate();
            }
        });
        
        // Bind to notifications to trigger events once map has loaded.
        $this.bind([events.Map.LOADED, ns].join("."), function () {
            $this.trigger(events.Mark.BEGIN);
        });
        
        // Bind to notifications to begin marking map.
        $this.bind([events.Mark.BEGIN, ns].join("."), function () {
            // Mark map if necessary.
            if (options.markers.length) {
                // Mark each location.
                $.each(options.markers, function (i, location) {
                    self.mark(location);
                });
            }
        });
        
        // --- //
        
        // Display map if necessary.
        if (options.map) {
            displayMap();
        }
        
        // Begin geocoding.
        $this.trigger(events.Geocode.BEGIN);
        
        // Begin geolocation.
        $this.trigger(events.Geolocation.BEGIN);
    };
    
    function Cartography(options) {
        var method = options.method,
            provider = options.provider,
            instance;
        
        // Determine what operation to perform.
        if (typeof method === "string") {
            // Get instance to provider.
            instance = $(this).data(ns);
            
            // Call provider's method.
            if (!instance || !instance.isCartography) {
                $.error("jQuery Cartography has not been initialized.");
            } else if (typeof instance[method] === "function") {
                return instance[method].call(this, options);
            } else {
                $.error("Requested method not supported by jQuery "
                        + "Cartography.");
            }
        } else if (typeof Provider[provider] === "function") {
            // Create instance of provider.
            if (!Provider[provider].prototype.isCartography) {
                Provider[provider].prototype = Provider();
            }
            
            $(this).data(ns, new Provider[provider](options, this));
        } else {
            // Otherwise, notify of invalid provider.
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
        },
        // Geolocating-relating events.
        Geolocation: {
            DENIED:      "geolocation_denied",
            UNAVAILABLE: "geolocation_unavailable",
            UNSUPPORTED: "geolocation_unsupported",
            SUCCESS:     "geolocation_success",
            TIMEOUT:     "geolocation_timeout",
            UNKNOWN:     "geolocation_unknown"
        }
    };
    
    // List supported map types.
    $.cartography.MapType = {
        NORMAL:     0,
        SATELLITE:  1,
        HYBRID:     2
    };
    
    // Geocodes given location.
    $.cartography.geocode = function (context, location) {
        // Wrap nodes or its selector string in a jQuery object.
        if (typeof context === "string" || context.nodeType) {
            context = $(context);
        }
        
        // Ensure context is jQuery.
        if (context.selector !== undefined) {
            // And then geocode.
            context.cartography("geocode", location);
        } else {
            // Otherwise, notify of error.
            $.error("Cannot determine context to geocode in.");
        }
    };
    
    // Expose jQuery Cartography plugin.
    $.fn.cartography = function (method, options) {
        var opts;
        
        if (typeof method === "string") {
            // Merge method name and its parameters.
            options = typeof options !== "object" ? { parameter: options } : options;
            opts = $.extend({}, { method: method }, options);
        } else {
            // Otherwise, merge plugin options with defaults.
            options = method;
            opts = $.extend({}, $.fn.cartography.defaults, options);
        }
        
        return this.each(function () {
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
        // Default timeout (in milliseconds) for geolocation and geocoding.
        timeout:    10000,
        // Default zoom level.
        zoom:       1,
        // Range of zooms levels allowed on map.
        zoomRange:  []
    };
}(jQuery));
