/**
 * Created by Jim on 4/15/2016.
 */

var debug_mode = true;
var justAK = false;

// SZ video parameters

var minVideoLOD = 12;
var maxSZFeatures = 1000;    // get from query?
var maxExtentWidth = 10;     // maximal extent in kilometers for video

//URLs
var szServerURLpsmfc = "http://geo.psmfc.org";
var szServerURLnoaa = "https://alaskafisheries.noaa.gov";
var szServerURL = szServerURLnoaa;

var szRestServicesURL = szServerURL + "/arcgis/rest/services";

var szMapServiceLayerURLpsmfc = szRestServicesURL + "/NOAA/ShoreZoneFlexMapService/MapServer";
var szMapServiceLayerURLnoaa = szRestServicesURL + "/ShoreZoneFlexMapService/MapServer";
var szMapServiceLayerURLnoaaNew = szRestServicesURL + "/ShoreZoneMapService/MapServer";
var szMapServiceLayerURL = szMapServiceLayerURLnoaa;

// for comparing performance of old and new SZ map services
if (location.search == "?new")
  szMapServiceLayerURL = szMapServiceLayerURLnoaaNew;

var sslMapServiceLayerURL = szRestServicesURL + "/Ports_SSL/MapServer";

var altMediaServer = "https://alaskafisheries.noaa.gov/mapping/shorezonedata/";
var VIDEO_SERVER = altMediaServer;
var PHOTO_SERVER = altMediaServer;
var VIDEO_FOLDER = "video/";

var current_photo_sub = "stillphotos_lowres";
var current_photo_prefix = "280_";
var current_video_file_prefix = "360_";
var current_video_path_prefix = "midres_";

var videoSnippetDownloadFolder = altMediaServer + VIDEO_FOLDER + "midres_mp4";

var szVideoWidget = null;
var szPhotoWidget = null;

//  When a graphic is hovered over, these point to the graphic and the widget controlling the graphic
var currentHoveredGraphic = null;
var currentWidgetController = null;
var hoverTimeout = null;

var image_message_timeout = false;

var sync_photos = true;

var playbackControlTemplate = '<img id="{0}" class="playbackControl" alt="{1}" src="assets/images/{2} " width="20" onclick="mediaControl_clickHandler({3},\'{4}\')" />';


/* General utilities */

function debug(txt, append, br, key_counter) {
  /*!
   * Debugging helper
   * \param string txt Text to display
   * \param bool append Append to text output
   * \param bool br Break lines
   */
  if (!debug_mode) return;

  if (typeof append == "undefined") append = true;
  if (typeof br == "undefined") br = true;
  if (typeof key_counter == "undefined") key_counter = 0;

  if (window.console) {
    console.log(txt)
  } else { // emulate debug console on older browsers
    if ($("#debug").size() == 0) {
      $("body").append("<div id='debug' style='position:absolute; bottom: 5px; right: 5px; background-color: #FFF; opacity: 0.7; padding: 5px; max-height: 250px; overflow: auto; width: 300px; text-align: left;'></div>");
    }

    if (!append) $("#debug").html("");

    if (typeof txt == "object") {
      $.each(txt, function( key, value ) {
        debug(key + ": ", true, true, key_counter+1); debug(value, true, true, key_counter+1);
      });

      if (key_counter == 0) $("#debug").append("<br>");
    } else {
      $("#debug").append(txt + (br ? "<br>":" "));
    }

    $("#debug").scrollTop($("#debug")[0].scrollHeight);
  }
}

function asyncLoader(scriptName) {
  //  Javascript loader.
  var d=document,
    h=d.getElementsByTagName('head')[0],
    s=d.createElement('script');
  s.type='text/javascript';
  s.async=true;
  s.src = scriptName;
  h.appendChild(s);
}

function decDeg_to_DegMinSec(decDeg, axis) {
// axis is either "NS" for Lat or "EW" for Lon
  var dir = (decDeg<0 ? axis[0] : axis[1]);
  decDeg = Math.abs(decDeg);
  var d = Math.floor(decDeg);
  var decMin = 60*(decDeg - d);
  var m = Math.floor(decMin);
  var s = Math.round(60*(decMin - m));
  return ( d + " " + m + "' " + s + "\" " + dir);
}

function decDegCoords_to_DegMinSec(decLon, decLat) {
  return "Latitude: " +  decDeg_to_DegMinSec(decLat,"SN")  + ",  Longitude: " + decDeg_to_DegMinSec(decLon,"WE");
}


function makeHtmlFromTemplate(theTemplate, parameters) {
  var outHTML = '';
  for (var i=0; i<parameters.length; i++) {
    var A = parameters[i];
    var S = theTemplate;
    for (var j=0; j<A.length; j++) {
      var srch = '{' + j + '}';
      S = S.replace(srch, A[j]);
    }
    outHTML += S;
  }
  return outHTML;
}

function setMessage(elName, params) {
  // Show message in "elName"   param hash message & visibility

  if (!params) params={"visible": false, "text": "..."}

  if (image_message_timeout) clearTimeout(image_message_timeout);

  if (params["visible"] == true)
    $("#"+elName).show()
  else if (params["visible"] == false)
    $("#"+elName).hide();

  if (params["text"])
    $("#"+elName).html(params["text"]);

  if (params["fade"]) {
    image_message_timeout = setTimeout(function() {$("#"+elName).hide();}, params["fade"]);
  }

}


/* Element display */

function setDisabled(id, value) {
  // Disable/enable (grey-out) HTML input element
  el = document.getElementById(id);
  if (el)
    el.disabled = value;
}

function setVisible(id, value) {
  // Show/hide HTML element
  el = document.getElementById(id);
  if (!el)
    return;   // do nothing if el doesn't exist
  var visibility = "hidden";
  if (value)
    visibility = "visible";
  el.style.visibility = visibility;
}

function showPanelContents(panelNames, show) {
  /*
   Shows or hides the contents of a panel.
   To use, there must be a DIV named:    "panelEnabled_" + name
   and another DIV named:                "panelDisabled_" + name
   When "show" is true, the "disabled" DIV is displayed and the "enabled" DIV is hidden
   */
  var names = panelNames.split(",");
  for (var i=0; i<names.length; i++) {
    var panelDisabledDiv = document.getElementById("panelDisabled_" + names[i]);
    var panelEnabledDiv = document.getElementById("panelEnabled_" + names[i]);
    if (!panelDisabledDiv || !panelEnabledDiv)
      return;
    var panelDisabledDivStyle =panelDisabledDiv.style;
    var panelEnabledDivStyle = panelEnabledDiv.style;
    if (show) {
      panelDisabledDivStyle.visibility = "hidden";
      panelEnabledDivStyle.visibility = "visible";
    } else {
      panelDisabledDivStyle.visibility = "visible";
      panelEnabledDivStyle.visibility = "hidden";
    }
  }
}


/* Click Handlers */

function linkImage_clickHandler() {
   szVideoWidget.setSyncPhotos(!sync_photos);
}

function mediaControl_clickHandler(theWidget, action) {
  theWidget.playerControl(action);
}


/* Global SZ functions */

function makeMediaPlaybackHtml(controlsTemplate, controlsParameters) {
  var outHTML = '';
  outHTML += '';
  outHTML += '<div class="playbackControlContainer">';
  outHTML += makeHtmlFromTemplate(controlsTemplate, controlsParameters);
  outHTML += '</div>';
  return outHTML;
}

function resetCurrentFeatures() {
  setDisabled("offlineAppButton", true);
  showPanelContents("video,photo", false);
  // TODO: hide graphic features on map
}

function showCurrentFeatures() {
  setDisabled("offlineAppButton", false);
  showPanelContents("video,photo", true);
  // TODO: show graphic features on map
}

// API4
function getSubLayerID(mapImageLayer, layerPathArray) {
// finds sublayer ID recursively
    var li = mapImageLayer.sublayers;
    var layerName = layerPathArray[0];
    for (var i=0; i<li.length; i++) {
        if (li.items[i].title==layerName) {
            if (layerPathArray.length == 1)
                return li.items[i].id;
            else
                return getSubLayerID(li.items[i], layerPathArray.slice(1));
        }
    }
    return -1;
}



/* Unused functions

 function distinct(theArray) {
 var L = "/";
 for (var i=0; i<theArray.length; i++) {
 var S = theArray[i];
 if (L.indexOf("/" + S + "/") == -1)
 L += S + "/";
 }
 if (L == "/")
 L = "";
 else
 L = L.slice(1,L.length-1);
 return L.split("/");
 }

 function padString(str, len, mode) {
 // "mode" can be "left", "right" or "both"
 var outstr = str;
 var leftSide = false;
 if (mode=="left")
 leftSide = true;
 while (outstr.length < len) {
 if (mode=="both")
 leftSide = !leftSide;
 if (leftSide)
 outstr = " " + outstr;
 else
 outstr = outstr + " ";
 }
 return outstr;
 }

 function getLayerNumber(mapServiceLayer, layerName) {
 //  mapServiceLayer: ArcGISDynamicMapServiceLayer
 //  layerName: String
 var li = mapServiceLayer.layerInfos;
 for (var i=0; i<li.length; i++) {
 if (li[i].name==layerName)
 return (i);
 }
 return -1;
 }

 */