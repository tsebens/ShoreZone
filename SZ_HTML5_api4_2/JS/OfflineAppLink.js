/**
 * Created by Jim on 12/5/2016.
 */

var offlineAppURL = "https://s3.amazonaws.com/aws-website-shorezone-offline-pwus5/index.html";


function sendRequest(theURL) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var A = JSON.parse(this.responseText);
      var params = location.search.slice(1);
      if (params!="" && params!="new")
        offlineAppURL = params;
      window.open(offlineAppURL + "?" + A.jobId, "Shorezone Offline");
    }
  };
  xmlhttp.open("GET", theURL, true);
  xmlhttp.send();
}




function openOfflineApp() {
  if (confirm("Do you want to download data and open the offline app?  If so, click OK, otherwise hit Cancel.")) {
    var theURL = "https://alaskafisheries.noaa.gov/arcgis/rest/services/OfflineDataExtract2/GPServer/OfflineDataExtract_JSON/submitJob?f=json&";
    var e = view.extent;
    theURL += "Extent=" + Math.round(e.xmin) + " " + Math.round(e.ymin) + " " + Math.round(e.xmax) + " " + Math.round(e.ymax);
    sendRequest(theURL);
  }
}

