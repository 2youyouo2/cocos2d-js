/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global cl, cc*/

(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var Component  = cl.getModule("component/Component");
    var KeyManager = cl.getModule("utils/KeyManager");

    var Params = function() {

        this.properties = ["speed"];

        this.speed = 2;

        this.ctor = function() {
            this._super();
        }

        this.onEnter = function() {
            this.t = this.getComponent("TransformComponent");
        };

        this.onUpdate = function() {
            if(KeyManager.isKeyDown(cc.KEY.left)) {
                this.t.x -= this.speed;
            } else if (KeyManager.isKeyDown(cc.KEY.right)){
                this.t.x += this.speed;
            }
        };
    }

    var Run = Component.extendComponent("Run", new Params);

    
    exports.Constructor = Run;
    exports.Params = Params;
    
});