/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/widgets/support/widget"], function (require, exports, __extends, __decorate, decorators_1, Widget, widget_1) {
    "use strict";
    var OfflineLink = (function (_super) {
        __extends(OfflineLink, _super);
        function OfflineLink() {
            //----------------------------------
            //  view
            //----------------------------------
            var _this = _super !== null && _super.apply(this, arguments) || this;
            //----------------------------------
            //  xmin
            //----------------------------------
            _this.xmin = 0;
            //----------------------------------
            //  ymin
            //----------------------------------
            _this.ymin = 0;
            //----------------------------------
            //  xmax
            //----------------------------------
            _this.xmax = 0;
            //----------------------------------
            //  ymax
            //----------------------------------
            _this.ymax = 0;
            return _this;
        }
        /*
          //----------------------------------
          //  offlineAppURL
          //----------------------------------
        
          @property()
          @renderable()
          offlineAppURL: string = "https://s3.amazonaws.com/aws-website-shorezone-offline-pwus5/index.html";
        */
        // Public method
        OfflineLink.prototype.render = function () {
            return (widget_1.jsxFactory.createElement("div", { bind: this },
                widget_1.jsxFactory.createElement("button", { bind: this, onclick: this._openOfflineApp, id: "offlineAppButton", title: "Open offline app with data in current extent" }, "Go offline!")));
        };
        // Private methods
        /*
          private _openOfflineApp(){
            alert("Button clicked!  xmin is " + this.xmin);
          }
        */
        OfflineLink.prototype._sendRequest = function (theURL) {
            var offlineAppURL = "https://s3.amazonaws.com/aws-website-shorezone-offline-pwus5/index.html";
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var A = JSON.parse(this.responseText);
                    var params = location.search.slice(1);
                    if (params != "" && params != "new")
                        offlineAppURL = params;
                    window.open(offlineAppURL + "?" + A.jobId, "Shorezone Offline");
                }
            };
            xmlhttp.open("GET", theURL, true);
            xmlhttp.send();
        };
        OfflineLink.prototype._openOfflineApp = function () {
            if (confirm("Do you want to download data and open the offline app?  If so, click OK, otherwise hit Cancel.")) {
                var theURL = "https://alaskafisheries.noaa.gov/arcgis/rest/services/OfflineDataExtract2/GPServer/OfflineDataExtract_JSON/submitJob?f=json&";
                var e = this.view.extent;
                theURL += "Extent=" + Math.round(e.xmin) + " " + Math.round(e.ymin) + " " + Math.round(e.xmax) + " " + Math.round(e.ymax);
                this._sendRequest(theURL);
            }
        };
        return OfflineLink;
    }(decorators_1.declared(Widget)));
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], OfflineLink.prototype, "view", void 0);
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], OfflineLink.prototype, "xmin", void 0);
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], OfflineLink.prototype, "ymin", void 0);
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], OfflineLink.prototype, "xmax", void 0);
    __decorate([
        decorators_1.property(),
        widget_1.renderable()
    ], OfflineLink.prototype, "ymax", void 0);
    OfflineLink = __decorate([
        decorators_1.subclass("esri.widgets.OfflineLink")
    ], OfflineLink);
    return OfflineLink;
});
//# sourceMappingURL=OfflineLink.js.map