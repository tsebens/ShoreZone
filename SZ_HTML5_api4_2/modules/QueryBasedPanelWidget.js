/**
 * Class QueryBasedPanelWidget
 *
 * generic widget for spatial queries on map service layers, with associated panel for results
 *   Subclasses of this must set the processData function in the constructor  (see example in VideoPanelWidget.js)
 *
 * Constructor arguments:
 *    mapServiceLayer: MapImageLayer
 *    layerName: String     name of a sublayer of mapServiceLayer
 *    panel: ContentPane    panel where processed query results are displayed
 *    -- perhaps other args for outFields and where clause?
 */

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "esri/tasks/support/Query",
  "esri/tasks/QueryTask",
  "esri/layers/GraphicsLayer",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/geometry/Point",
  "esri/geometry/support/webMercatorUtils",
  "esri/Graphic"
], function(declare, lang, Query, QueryTask, GraphicsLayer, SimpleRenderer,
              PictureMarkerSymbol, SimpleMarkerSymbol, Point, webMercatorUtils, Graphic){

  var queryComplete = true;

  return declare(null, {

    constructor: function(/*Object*/ kwArgs){
      lang.mixin(this, kwArgs);

      if (this.clickableSymbolInfo) {
        // Add (transparent) Graphics Layer for selecting feature
        this.clickableLayer = new GraphicsLayer();
        this.clickableLayer.id = this.panelName + "_Clickable";
        this.clickableLayer.title = this.clickableLayer.id;
        this.clickableLayer.visible = true;
        this.clickableSymbol = new SimpleMarkerSymbol(this.clickableSymbolInfo);
        this.clickableLayer.renderer = new SimpleRenderer(this.clickableSymbol);
        this.clickableLayer.widgetController = this;    // Custom property added to Graphics Layer object, to reference back to this widget
        this.map.add(this.clickableLayer);
        this.mouseStillOver = false;
        this.infoWin = this.view.popup;
        this.counter = 0;
      }

      if (this.trackingSymbolInfo) {
        // Add Graphics Layer for tracking icon
        this.trackingLayer = new GraphicsLayer();
        this.trackingLayer.id = this.panelName + "_Tracking";
        this.trackingLayer.title = this.trackingLayer.id;
        this.trackingLayer.visible = true;
        var symbolArgs = this.trackingSymbolInfo.split(":");
        this.trackingImageURL = symbolArgs[0];
        this.trackingSymbol = new PictureMarkerSymbol(symbolArgs[0], symbolArgs[1], symbolArgs[2]);
        this.trackingLayer.renderer = new SimpleRenderer(this.trackingSymbol);
        this.map.add(this.trackingLayer);
        this.playDir = 1;     // playback direction
      }

      if (this.headerDivName)
        document.getElementById(this.headerDivName).innerHTML = this.dfltCaptionHTML;

      // Skip if the widget doesn't get its data directly from a query
      // e.g. PhotoPlaybackWidget, which uses a subset of the data from VideoPanelWidget
      if (!this.noQuery) {
        this.subLayerID = getSubLayerID(this.mapServiceLayer, this.layerPath.split("/"));
        this.subLayerURL = this.mapServiceLayer.url + "/" + this.subLayerID.toString();
        this.queryTask = new QueryTask(this.subLayerURL);
        this.query = new Query();
        with (this.query) {
          returnGeometry = true;
          spatialRelationship = "contains";
          outFields = [];
          orderByFields = [];
          where = "";
          //returnCountOnly = true;
        }

      }


      // placeholder -- function will be overridden by subclasses of QueryBasedPanelWidget
      this.processData = function(features) {
      };

      // placeholder -- function will be overridden by subclasses of QueryBasedPanelWidget
      this.updateMedia = function(attrs) {
      };

      this.moveButtonPressHandler = function(attrs) {
        this.changeCurrentFeature(attrs.item);
        this.moveToFeature(attrs);
        this.infoWin.close();
      };

      this.displayPlayButton = function(e) {
        debug("displayPlayButton");
        var infoWin = view.popup;
        attrs = e.attributes;
        infoWin.title = this.baseName + " point";
        infoWin.content = "<b>" + attrs.Caption + "</b>";
        infoWin.actions.items[1].title = this.clickableMsg;
        infoWin.actions.items[1].image = this.trackingImageURL;
        infoWin.location = e.geometry;
        infoWin.open();
      };

    },


    runQuery: function(extent) {
      this.query.geometry = extent;
      queryComplete = false;
      this.queryTask.execute(this.query).then(function(results){
          var theFeatures = results.features;
          if (theFeatures.length==maxSZFeatures) {
              alert("Too many features for " + this.layerName + ".  Zoom in further.");
          } else {
              this.processData(theFeatures);
          }
      }.bind(this));
    },

    changeCurrentFeature: function(newIndex) {
      if (newIndex<0 || newIndex>=this.getClickableGraphicsCount())
        return null;     // Do nothing: out of range
      this.counter = newIndex;
      var attrs = this.getClickableGraphicAttributes(this.counter);
      this.moveToFeature(attrs);
      this.updateMedia(attrs);
    },

    moveToFeature: function (attrs) {
      // if (!mapVisible)
      //   return;
      this.trackingLayer.removeAll();
      var projPoint = new Point(attrs.x, attrs.y);
      var markerPoint = webMercatorUtils.webMercatorToGeographic(projPoint);
      var newFeature = new Graphic(markerPoint, this.trackingSymbol);
      this.trackingLayer.add(newFeature);
      if (this.headerDivName) {
        var headerDiv = document.getElementById(this.headerDivName);
        if (attrs.Caption)
          headerDiv.innerText = attrs.Caption;
        else
          headerDiv.innerHTML = this.dfltCaptionHTML;
      }
    },

    makeClickableGraphics: function(features) {
      if (!this.clickableSymbol)
          return;
      this.clickableLayer.removeAll();
      for (var n = 0; n < features.length; n++) {
          var g = features[n];
          var a = {};
          for (i in g.attributes) {
              a[i] = g.attributes[i];
          }
          a.item = n;
          a.x = g.geometry.x;
          a.y = g.geometry.y;
          a.Caption = decDegCoords_to_DegMinSec(a.LON_DDEG, a.LAT_DDEG)
          var projPoint = new Point(a.x, a.y);
          var mapPoint = webMercatorUtils.webMercatorToGeographic(projPoint);
          var graphic = new Graphic(mapPoint, this.clickableSymbol, a);
          this.clickableLayer.add(graphic);
      }
    },

    getClickableGraphicsCount: function() {
      return this.clickableLayer.graphics.length;
    },

    getClickableGraphicAttributes: function(p) {
      return this.clickableLayer.graphics.items[p].attributes;
    },

    indexFirstFeatureGreaterThan: function(attrName, attrValue) {
      for (var n = 0; n < this.getClickableGraphicsCount(); n++) {
        if (this.getClickableGraphicAttributes(n)[attrName] >= attrValue)
          return n;
      }
      return -1;
    },

    playerControl: function(action) {
      switch(action) {
        case "toStart":       this.toStart(); break;
        case "playBackward":  this.playBackward(); break;
        case "pause":         this.pause(); break;
        case "playForward":   this.playForward(); break;
        case "toEnd":         this.toEnd(); break;
      }
    }

  });
});


