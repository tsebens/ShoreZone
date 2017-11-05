/**
 * Created by Jim on 4/4/2016, modified for 4.3 API on 3/13/2017
 */



var map;
var view;
var szMapServiceLayer;
var sslMapServiceLayer;

var layerListWidget;

var lastExtent = null;
var mapLoading = false;


require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/MapImageLayer",
  "esri/widgets/Expand",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/Search",
  "esri/widgets/BasemapGallery",
  "noaa/widgets/OffLineLink",
  "noaa/VideoPanelWidget",
  "noaa/PhotoPlaybackWidget",
  "esri/geometry/Point",
  "esri/geometry/support/webMercatorUtils",
  "dojo/domReady!"
], function(Map, MapView, MapImageLayer, Expand, LayerList, Legend, Search, BasemapGallery,
                            OffLineLink, VideoPanelWidget, PhotoPlaybackWidget, Point, webMercatorUtils) {

  // *** Map layer definitions
  szMapServiceLayer =  new MapImageLayer(szMapServiceLayerURL,  {"opacity" : 0.5});

    szMapServiceLayer.then(function(pandor) {

      szPhotoWidget = new PhotoPlaybackWidget({
        panelName: "szPhotosPanel",
        baseName: "photo",
        headerDivName:  "photoHeaderDiv",
        dfltCaptionHTML: "<label style='color:red'>Zoom in further to see photos</label>",
        noQuery: true,
        trackingSymbolInfo: "assets/images/Camera24X24.png:24:24",
        clickableSymbolInfo: {"style":"square", "color":[0,0,255,64], "size":10},
        clickableMsg: "Move camera to this location",
        map: map,
        view: view
      });

      szVideoWidget = new VideoPanelWidget({
        panelName: "szVideoPanel",
        baseName: "video",
        headerDivName:  "videoHeaderDiv",
        dfltCaptionHTML: "<label style='color:red'>Zoom in further to see video</label>",
        displayDivName: "#video_youtube",
        mapServiceLayer: szMapServiceLayer,
        layerName: "1s",
        layerPath: "Video Flightline/1s",
        trackingSymbolInfo: "assets/images/video24X24.png:24:24",
        clickableSymbolInfo: {"style":"circle", "color":[255,255,0,64], "size":6},
        clickableMsg: "Move camera to this location",
        map: map,
        view: view
      });

    }, function(error){
        debug("szMapServiceLayer failed to load:  " + error);
    });

  sslMapServiceLayer = new MapImageLayer(sslMapServiceLayerURL, {"opacity" : 0.5});
  // *** end Map layer definitions ***

    map = new Map({
      basemap: "topo",
      layers:  [szMapServiceLayer]      //, sslMapServiceLayer]
  });

    view = new MapView({
        container: "mapDiv",  // Reference to the scene div created in step 5
        map: map,  // Reference to the map object created before the scene
        center: [-135, 58], // longitude, latitude
        //scale: 50000000,     // SceneView:  Sets the initial scale
        zoom: 4               // MapView
        //sliderOrientation : "horizontal",
        //sliderStyle: "large"
    });

      view.watch("extent", function(newExtent, oldExtent, property, theView) {
          if (theView.animation && theView.animation.state=="running")      // Wait until extent change is complete
              return;
          lastExtent = newExtent;
          mapLoading = true;
          if (newExtent.width/1000 < maxExtentWidth) {    // (e.lod.level >= minVideoLOD)
              if (szVideoWidget)
                  szVideoWidget.runQuery(newExtent);
          }
      });

      // Handle mouse-move events:  Update map coordinate display, and check for mouse over graphic features
      view.on('pointer-move', [], function(e){
          var screenPoint = {x: e.x, y: e.y};
          var mapPoint = view.toMap(screenPoint);
          var geogPoint = webMercatorUtils.webMercatorToGeographic(mapPoint);
          document.getElementById("coordinates").innerHTML = decDegCoords_to_DegMinSec(geogPoint.x, geogPoint.y)
          view.hitTest(screenPoint).then(handleGraphicHits);
      });

      var moveButtonAction = {title: "Move the camera", id: "move-camera"};
      view.popup.actions.push(moveButtonAction);
      view.popup.on("trigger-action", function(event){
          if (event.action.id == "move-camera") {
              if (currentWidgetController)
                  currentWidgetController.moveButtonPressHandler(currentHoveredGraphic.attributes);
          }
      });

    // If mouse is over a video/photo graphic, open popup allowing moving the "camera" to this point
    function handleGraphicHits(response) {
      if (response.results.length == 0)
        return;
      /* Check for point that is both video and photo
      if (response.results.length > 1) {
        alert("More than 1 hit!")
      };
      */
      currentHoveredGraphic = response.results[0].graphic;
      currentWidgetController = currentHoveredGraphic.layer.widgetController;
      if (hoverTimeout)
        clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(currentWidgetController.displayPlayButton(currentHoveredGraphic), 500);       // delay popup
    };


  // *** Map widgets

  // Add ESRI LayerList widget.  This goes in the "layerListDom" DIV, rather than the map
  layerListWidget = new LayerList({
        container: "layerListDom",
        view: view
    });

    // HACK to prevent adding tracking and clickable graphic layers to the LayerList
    layerListWidget.operationalItems.on("before-add", function(event){
      var theID = event.item.layer.id;
      if (theID.slice(-10)=="_Clickable" || theID.slice(-9)=="_Tracking") {
        event.preventDefault();
      }
    });


  // Add ESRI Legend widget.  This goes in the "legendDom" DIV, rather than the map
  var legend = new Legend({
    container: "legendDom",
    view: view,
    layerInfos: [{
      layer: szMapServiceLayer,
      title: "ShoreZone layers"
    }]
  });

  // Add ESRI search widget to map
  var searchWidget = new Search({ view: view });
  view.ui.add(searchWidget, "top-right");

  // Add ESRI basemap gallery widget to map, inside an Expand widget
  var basemapGallery = new BasemapGallery({
    view: view,
    container: document.createElement("div")
  });
  var bgExpand = new Expand({
    view: view,
    content: basemapGallery.domNode,
    expandIconClass: "esri-icon-basemap",
    expandTooltip: "Click here to use a different base map!",
    collapseTooltip: "Hide base maps"
  });
  view.ui.add(bgExpand, "bottom-left");

  // Add NOAA offlineLink widget to map
  /*
  offLineLink = new OffLineLink({
    view: view,
    //featureCount: szVideoWidget.clickableLayer.features.length
  });
  view.ui.add(offLineLink, "top-right");
  */

  // Add ESRI Print widget to map
  // Currently disabled, need to add capability to map service on server
  /*
  var print = new Print({
    view: view
  });
  view.ui.add(print, "top-left");
   */

});


