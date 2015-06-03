import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['leaflet-map'],

  markerCache: {},
  selection: null,
  selectedMarker: null,

  highlightedIcon: L.icon({
    iconUrl: '/assets/marker-yellow.png',
    iconRetinalUrl: '/assets/marker-yellow-2x.png',
    shadowUrl: '/assets/marker-shadow.png',
    shadowRetinaUrl: '/assets/marker-shadow.png'
  }),

  addModels: function(list) {
    var that = this;
    var markerCache = this.get('markerCache');

    list.forEach(function(model) {
      var id = model.get('id');
      markerCache[id] = that.createMarkerForModel(model);
    });

    this.updateMarkerLayer();
    this.centerMarkerLayer();
  },

  centerMarkerLayer: function() {
    var markers = this.get('markers'),
        map = this.get('map');

    // setTimeout is necessary to avoid a race condition in Leaflet when it is
    // first loaded. See https://github.com/Leaflet/Leaflet/issues/2021
    setTimeout(function() {
      if (markers.getLayers().length > 0) {
        map.fitBounds(markers.getBounds());
      }
    }, 200);
  },

  contentChanged: function() {
    this.set('markerCache', {});
    this.get('markers').clearLayers();
    this.addModels(this.get('content'));
  }.observes('content'),

  createMarkerForModel: function(model) {
    var marker = L.marker(model.get('coordinates'));
    marker.model = model;

    if (model === this.get('selection')) {
      this.highlightMarker(marker);
    }

    return marker;
  },

  didInsertElement: function() {
    L.Icon.Default.imagePath = '/assets';
    var that = this;
    var pMap = polarMap(this.get('element'), {
      permalink: false
    });
    var map = pMap.map;
    var markers = new L.MarkerClusterGroup();

    this.set('map', map);
    this.set('markers', markers);

    map.setView([65,-100], 5);
    map.addLayer(markers);

    markers.on('click', function(a) {
      that.highlightMarker(a.layer);
      that.set('selection', a.layer.model);
    });

    if (this.get('content')) {
      this.addModels(this.get('content'));
    }
  },

  highlightMarker: function(marker) {
    var selectedMarker = this.get('selectedMarker');
    if (selectedMarker) {
      // remove styling
      selectedMarker.setIcon(new L.Icon.Default());
    }

    // add styling to newly selected marker
    marker.setIcon(this.get('highlightedIcon'));
    this.set('selectedMarker', marker);
  },

  highlightModel: function(model) {
    var findMarker = this.get('markerCache')[model.get('id')];

    if (findMarker) {
      this.highlightMarker(findMarker);
      this.get('map').panTo(findMarker.getLatLng());
    }
  },

  updateSelectedModel: function() {
    this.highlightModel(this.get('selection'));
  }.observes('selection'),

  updateMarkerLayer: function() {
    var markers = this.get('markers'),
        cache = this.get('markerCache');

    for (var id in cache) {
      var marker = cache[id];
      markers.addLayer(marker);
    }
  },

  willRemoveElement: function() {
    var map = this.get('map');
    if (map) {
      map.remove();
    }
  }
});