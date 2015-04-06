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

    var Component = cl.getModule("component/Component");

    var Params = function() {

        this.speed = 2;
        
        this.s1 = 1;
        this.s3 = -1;
        
        this.ctor = function() {
            this._super(this);
            this.addProperties(["speed"]);
        };

        this.onEnter = function() {
            this.t = this.getComponent("TransformComponent");
        };

        this.onUpdate = function() {
            this.t.position = cl.p(this.t.x+this.s3, this.t.y);
        };
        
        this.test = function() {
            return 0;
        }
        
        this.test8 = function() {
            return 1;
        }
    }

    var Run = Component.extendComponent("Run", new Params);
    
    exports.Constructor = Run;
    exports.Params = Params;
    
});