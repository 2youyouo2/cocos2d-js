(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
cl = cl ? cl : {};


(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    cl.defineGetterSetter = function(obj, attr, getter, setter){
        var p = obj;
        if(typeof getter == 'function')
            p.__defineGetter__(attr, getter);
        else if(typeof getter == 'string')
            p.__defineGetter__(attr, p[getter]);
        
        if(typeof setter == 'function')
            p.__defineSetter__(attr, setter);
        else if(typeof setter == 'string')  
            p.__defineSetter__(attr, p[setter]);
    }

    cl.defineGetterSetter(cc.Node.prototype, "name", "getName", "setName");

});



},{}],2:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var ComponentManager = require("./ComponentManager.js");

    var Component = cc.Class.extend({
    
        ctor : function(instance, dependencies){
            this._instance = instance;
            this._properties = [];

            this._dependencies = dependencies;
        },

        _getProperties: function(){
            return this._properties;
        },
        _setProperties: function(val){
            if(val.constructor == Array){
                this._properties = val;
            }
        },

        getTarget: function(){
            return this._target;
        },

        addComponent: function(className){
            if(this._target)
                this._target.addComponent(className);
        },
        getComponent: function(className){
            if(this._target)
                return this._target.getComponent(className);
            return null;
        },

        addProperties : function (properties){
            if(properties.constructor == Array){
                this.properties = this.properties.concat(properties);
            }
        },

        _bind : function(target){
            this._target = target;

            var ds = this._dependencies;
            if(ds){
                for(var k in ds){
                    this.addComponent(ds[k]);
                }
            }

            this.onBind(target);
        },

        _unbind : function(){
            if(this._exportedMethods != null){
                var methods = this._exportedMethods;

                for(var key in methods){
                    var method = methods[key];
                    this._target[method] = null;
                }
            }

            this.onUnbind();
        },

        _exportMethods : function (methods) {

            this._exportedMethods = methods;
            for(var key in methods){
                var method = methods[key];
                this._target[method] = function(){
                    this[method].apply(this._instance, arguments);
                };
            }
        },

        onBind: function(){

        },
        onUnbind: function(){

        },

        onEnter : function() {

        }
    });

    cl.defineGetterSetter(Component.prototype, "properties", "_getProperties", "_setProperties");

    Component.extendComponent = function(className, params, parent) {
        if(!parent) parent = Component;

        var ret = parent.extend(params);
        // cl[className] = ret;
        ret.className = className;
        ComponentManager.register(className, ret);

        return ret;
    }

    Component.init = function(obj, params) {
        for(var k in params) {
            obj[k] = params[k];
        }
    }

    module.exports = cl.Component = Component;
})

},{"./ComponentManager.js":3}],3:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var ComponentManager = cc.Class.extend({
        ctor : function () {
            this._classes = new Array();
        },

        register : function(name, cls){
            this._classes[name] = cls;
            cls.prototype.classname = name;
        },

        unregister : function(name){
            this._classes[name] = null;
        },

        create : function (name) {
            var cls = this._classes[name];

            if(cls != null)
                return new cls(arguments);

            return null;
        },

        getAllClasses: function(){
            return this._classes;
        }
    });

    module.exports = cl.ComponentManager = new ComponentManager;
});
},{}],4:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("./Component.js");

    var MeshComponent = Component.extendComponent("MeshComponent", {
        ctor: function () {
            this._super(this);
            
            // this.properties = ["materials", "subMeshes", "vertices"];

            this._innerMesh = new cl.MeshSprite();
            this._innerMesh.retain();
        },

        _getMaterials: function() {
            return this._innerMesh.materials;
        },
        _setMaterials: function(materials) {
            this._innerMesh.materials = materials;
        },
        toJSONmaterrials: {

        },

        setSubMesh: function(index, indices) {
            this._innerMesh.setSubMesh(index, indices);
        },
        _getSubMeshes: function(index) {
            return this._innerMesh.subMeshes;
        },

        _setVertices: function(vertices) {
            this._innerMesh.vertices = vertices;
        },
        _getVertices: function() {
            return this._innerMesh.vertices;
        },

        rebindVertices: function() {
            return this._innerMesh.rebindVertices();
        },

        hitTest: function(worldPoint) {
            if(!this._innerMesh || !worldPoint) return;

            var p = this._innerMesh.convertToNodeSpace(worldPoint);
            p = cc.p(p);

            var vertices = this.vertices;
            var subMeshes = this.subMeshes;

            for(var i=0; i<subMeshes.length; i++){
                var indices = subMeshes[i];
                for(var j=0; j<indices.length; j+=3){
                    var a = cc.p(vertices[indices[j  ]].vertices);
                    var b = cc.p(vertices[indices[j+1]].vertices);
                    var c = cc.p(vertices[indices[j+2]].vertices);

                    if(a.equal(b) && b.equal(c))
                        continue;

                    if(p.inTriangle(a,b,c))
                        return true;
                }
            }

            return false;
        },

        onBind: function(target) {
            target.addChild(this._innerMesh);
        }
    });

    var _p = MeshComponent.prototype;
    MeshComponent.editorDir = "Mesh";

    cl.defineGetterSetter(_p, "materials", "_getMaterials", "_setMaterials");
    cl.defineGetterSetter(_p, "vertices", "_getVertices", "_setVertices");
    cl.defineGetterSetter(_p, "subMeshes", "_getSubMeshes");

    exports.Component = MeshComponent;
});


},{"./Component.js":2}],5:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("./Component.js");

    var SpriteComponent = Component.extendComponent("SpriteComponent", {
        ctor: function () {
            this._super(this);
            this._texture = "";
            this._anchorPoint = new cc.p(0.5, 0.5);
            
            this.properties = ["file", "anchorPoint"];
        },

        _setFile: function(file){
            this._file = file;
            this._updateTexture();
        },
        _getFile: function(){
            return this._file;
        },

        _getAnchorPoint: function(){
            return this._anchorPoint;
        },
        _setAnchorPoint: function(val){
            this._anchorPoint = val;
            if(this._innerSprite){
                this._innerSprite.setAnchorPoint(val);
            }
        },

        _updateTexture : function(){
            if(this._file == "" && this._innerSprite){
                this._innerSprite.removeFromParent();
            }

            if(this._file != ""){
                if(!this._innerSprite){
                    this._innerSprite = new cc.Sprite();
                    this._innerSprite.setAnchorPoint(this._anchorPoint);
                    if(this._target)
                        this._target.addChild(this._innerSprite);
                }
                this._innerSprite.setTexture(this._file);
            }
        },

        _getBoundingBox: function(){
            return this._innerSprite.getBoundingBoxToWorld();
        },

        hitTest: function(worldPoint){
            if(!this._innerSprite || !worldPoint) return;

            var p = this._innerSprite.convertToNodeSpace(worldPoint);
            var s = this._innerSprite.getContentSize();
            var rect = cc.rect(0, 0, s.width, s.height);

            return cc.rectContainsPoint(rect, p);
        }
    });

    var _p = SpriteComponent.prototype;
    SpriteComponent.editorDir = "Sprite";

    cl.defineGetterSetter(_p, "file", "_getFile", "_setFile");
    cl.defineGetterSetter(_p, "anchorPoint", "_getAnchorPoint", "_setAnchorPoint");
    cl.defineGetterSetter(_p, "boundingBox", "_getBoundingBox", null);

    exports.Component = SpriteComponent;
});

},{"./Component.js":2}],6:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("./Component.js");

    var TransformComponent = Component.extendComponent("TransformComponent",{
        ctor: function () {
            this._super(this);
            
            this.addProperties(["position", "scale", "rotation"]);
        },

        _setPosition: function(val){
            this._target.setPosition(val);
        },
        _getPosition: function(){
            return this._target.getPosition();
        },

        _setScale: function(val, y){
            if(y){
                this._target.scaleX = val;
                this._target.scaleY = y;
            }
            else {
                this._target.scaleX = val.x;
                this._target.scaleY = val.y;
            }   
        },
        _getScale: function(){
            return {x: this.scaleX, y: this.scaleY};
        },

        _setSkew: function(val, y){
            if(y){
                this._target.rotationX = val;
                this._target.rotationY = y;
            }
            else {
                this._target.rotationX = val.x;
                this._target.rotationY = val.y;
            }
        },
        _getSkew: function(){
            return {x: this.rotationX, y: this.rotationY};
        }
    });


    var _p = TransformComponent.prototype;
    _p._registerTargetProperty = function(p){
        var set = "_set"+p;
        var get = "_get"+p;
        var self = this;

        (function(p){
            self[set] = function(val){
                this._target[p] = val;
            }
            self[get] = function(){
                return this._target[p];
            }
        })(p);

        cl.defineGetterSetter(this, p, get, set);
    }

    _p._registerTargetProperty("x");
    _p._registerTargetProperty("y");
    _p._registerTargetProperty("scaleX");
    _p._registerTargetProperty("scaleY");
    _p._registerTargetProperty("rotationX");
    _p._registerTargetProperty("rotationY");

    cl.defineGetterSetter(_p, "position", "_getPosition",   "_setPosition");
    cl.defineGetterSetter(_p, "scale",    "_getScale",      "_setScale");
    cl.defineGetterSetter(_p, "rotation", "_getSkew",       "_setSkew");

    exports.Component = TransformComponent;
});

},{"./Component.js":2}],7:[function(require,module,exports){
(function(){
	cl.Emitter = {};

	cl.Emitter.extend = function(obj){
		obj.prototype.callbacks = {};

		obj.prototype.on = function(action, cb, priority){
			
			if(action == void(0)){
				console.error("undefined action");
				return;
			}
			
			if(typeof cb != "function"){
				console.error("event",action,"not a function:",cb);
				return;
			}
			if(Array.isArray(action)){
				for(var i=0; i<action.length; i++){
					this.on(action[i], cb);
				}
				return;
			}
			
			if(!this.callbacks){
				this.callbacks = {};
			}
			
			if(!this.callbacks[action]){
				this.callbacks[action] = [];
			}
			
			
			this.callbacks[action].push(cb);
			cb.priority = priority || this.callbacks[action].length;
			this.callbacks[action].sort(function(a, b){
				return a.priority - b.priority;
			});
			
			return cb;
		};
		
		obj.prototype.one = function(action, cb){
			if(typeof cb != "function"){
				console.error("event", action, "not a function:", cb);
				return;
			}
			
			if(Array.isArray(action)){
				for(var i=0; i<action.length; i++){
					this.once(action[i], cb);
				}
				return;
			}
			
			var that = this;
			var fn = function(action1, data){
				cb(action1, cb);
				that.off(action, fn);
			};
			
			this.on(action, fn);
			
		};

		obj.prototype.off = function(type, cb){
			if(cb === void(0)){
				cb = type; type = void(0);
			}
			
			if(type && !this.callbacks[type]){
				return;
			}
			
			if(type){
				this._off(cb, type);
				return;
			}
			
			for(var i in this.callbacks){
				if(cb == void(0)){
					this.callbacks[i].length = 0;
					continue;
				}
				this._off(cb, i);
			}
		};
		
		obj.prototype._off = function(cb, type){
			var i=0, cbs = this.callbacks[type];
			for(i=0; i<cbs.length; i++){
				if(cbs[i] === cb){
					cbs.splice(i, 1);
				}
			}
			return cb;
		};
		
		obj.prototype.trigger = function(type, action, data){
			
			//this.debug(type);
			
			//console.log("emit:", type, action);
			if(!this.callbacks){
				return;
			}
			
			if(!this.callbacks[type]){
				//console.warn("received unhandled data", type, data);
				return;
			}
			
			var cbs = this.callbacks[type];
			
			for(var i=0; i<cbs.length; i++){
				cbs[i](action, data);
			}
		};

		return obj;
	}

	if(!cl.globalEvent){
		var Simple = cc.Class.extend({
			ctor: function(){}
		});
		cl.Emitter.extend(Simple);
		cl.globalEvent = new Simple();	
	}
})();
},{}],8:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var GameObject = cc.Node.extend({

        ctor : function (){
            this._super();

            this._components = [];
            this._properties = [];
            this._updateRequest = 0;

            // this.addProperties(["x", "y", "scaleX", "scaleY", "rotationX", "rotationY"]);
            this.name = "GameObject";

            this.addComponent("TransformComponent");
            
        },

        _setProperties: function(val){
            if(val.constructor == Array){
                this._properties = val;
            }
        },
        _getProperties: function(){
            return this._properties;
        },

        _getComponents: function(){
            return this._components;
        },

        addProperties : function (properties){
            if(properties.constructor == Array){
                this.properties = this.properties.concat(properties);
            }
        },

        addComponent : function(classname){
            var c = this._components[classname];
            if(c) return c;

            c = cl.ComponentManager.create(classname);
            if(c == null){
                console.log(classname + "is not a valid Component");
                return null;
            }

            if(c.onUpdate) {
                if(this._updateRequest === 0 && this.isRunning()) {
                    this.scheduleUpdate();
                }
                this._updateRequest++;
            }

            this._components[classname] = c;

            c._bind(this);

            return c;
        },

        addComponents : function(classnames){
            for(var key in classnames){
                this.addCompoent(classnames[key]);
            }
        },

        getComponent: function(classname){
            return this._components[classname];
        },

        removeComponent: function (classname) {
            var c = this._components[classname];
            if(c != null)
                c._unbind();

            if(c.onUpdate) {
                this._updateRequest--;
                if(this._updateRequest === 0) {
                    this.unscheduleUpdate();
                }
            }

            this._components[classname] = null;
        },

        onEnter: function() {
            cc.Node.prototype.onEnter.call(this);

            for(var key in this._components){
                this._components[key].onEnter(this);
            }

            if(this._updateRequest > 0) {
                this.scheduleUpdate();
            }
        },

        update: function(dt) {
            if(!this.isRunning()) return;

            for(var key in this._components){
                var c = this._components[key];
                if(c.onUpdate) {
                    c.onUpdate(this);
                }
            }
        },

        hitTest: function(worldPoint){
            for(var key in this._components){
                var c = this._components[key];
                if(c.hitTest != null && c.hitTest(worldPoint))
                    return true;
            }

            return false;
        }
    });

    cl.defineGetterSetter(GameObject.prototype, "components", "_getComponents");
    cl.defineGetterSetter(GameObject.prototype, "properties", "_getProperties", "_setProperties");

    module.exports = cl.GameObject = GameObject;
});
},{}],9:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var GameObject = require("./GameObject.js");

    var SceneManager = cc.Class.extend({
        ctor : function () {
        	this._sceneMap = {};
        },

        loadScene : function(path, cb, force) {
        	var json = this._sceneMap[path];

        	var parseComplete = function(scene){
    			if(scene && cb) cb(scene);
        	}

        	if(json && !force){
        		this.parseData(json, parseComplete);
        	} else {
                var self = this;
                cc.loader.loadJson(path, function(err, json){
                    if(err) throw err;

                    self._sceneMap[path] = json;
                    
                    self.parseData(json, parseComplete);
                });
            }
        },

        parseData : function(json, cb){
        	var data = json.root;
        	var self = this;

        	cc.LoaderScene.preload(data.res, function () {
                // var resIndex = 0;

                // function loadResComplete(){
                    // if(++resIndex < data.res.length) return;

                    var scene = new cc.Scene();
                    scene.res = data.res;
                    for(var i=0; i<data.children.length; i++){
                        self.parseGameObject(scene, data.children[i]);
                    }

                    if(cb) cb(scene)
                // }

                // for(var i=0; i<data.res.length; i++){
                //     cc.textureCache.addImage(data.res[i], loadResComplete);
                // }

            }, this);
        },

        parseGameObject : function(parent, data){
        	var o = new GameObject();
        	parent.addChild(o);

        	for(var i=0; i<data.components.length; i++){
        		this.parseComponent(o, data.components[i]);
        	}

        	if(data.children){
    	    	for(var i=0; i<data.children.length; i++){
    	    		this.parseGameObject(o, data.children[i]);
    	    	}
        	}
        	
        	return o;
        },

        parseComponent: function(parent, data){
        	var c = parent.addComponent(data.class);
            if(c == null) return null;
            
        	for(var k in data){
        		if(k == "class") continue;

        		c[k] = data[k];
        	}

        	return c;
        }
    });

    module.exports = cl.SceneManager = new SceneManager;
});

},{"./GameObject.js":8}],10:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
	"use strict";

	// require("./cocoslite.js");
 //    require("./shortcode.js");
 //    require("./object/MeshSprite.js");
 //    require("./core/SceneManager.js");
 //    require("./core/GameObject.js");
 //    require("./component/Component.js");
 //    require("./component/ComponentManager.js");
 //    require("./component/MeshComponent.js");
 //    require("./component/SpriteComponent.js");
 //    require("./component/TransformComponent.js");

});

},{}],11:[function(require,module,exports){



// cl.Point
cl.Point = function(x, y)
{
    if (x == undefined)
        this.x = this.y = 0;
    else if (y == undefined) {
        this.x = x.x; 
        this.y = x.y;
    } else if(x == undefined && y == undefined) {
        this.x = this.y = 0;
    } else {
        this.x = x;
        this.y = y;
    }
}

cl.Point.prototype.equal = function(p){
    return this.x == p.x && this.y == p.y;
}

cl.Point.prototype.add = function(p){
    var n = new cl.Point();
    n.x = this.x + p.x;
    n.y = this.y + p.y;
    return n;
}

cl.Point.prototype.addToSelf = function(p){
    this.x += p.x;
    this.y += p.y;
    return this;
}

cl.Point.prototype.sub = function(p){
    var n = new cl.Point();
    n.x = this.x - p.x;
    n.y = this.y - p.y;
    return n;
}

cl.Point.prototype.subToSelf = function(p){
    this.x -= p.x;
    this.y -= p.y;
    return this;
}

cl.Point.prototype.mult = function(v){
    var n = new cl.Point();
    n.x = this.x * v;
    n.y = this.y * v;
    return n;
}

cl.Point.prototype.multToSelf = function(v){
    this.x *= v;
    this.y *= v;
    return this;
}

cl.Point.prototype.divide = function(v){
    var n = new cl.Point();
    n.x = this.x / v;
    n.y = this.y / v;
    return n;
}

cl.Point.prototype.divideToSelf = function(v){
    this.x /= v;
    this.y /= v;
    return this;
}

cl.Point.prototype.normalize = function(){
    var t = cc.pNormalize(this);
    this.x = t.x;
    this.y = t.y;
}

cl.Point.prototype.cross = function(p){
    return this.x * p.y - this.y * p.x;
}

cl.Point.prototype.inTriangle = function(a, b, c){

    var ab = b.sub(a),
        ac = c.sub(a), 
        ap = this.sub(a);

    //用矢量积计算面积，下面4个值的绝对值，是对应的三角形的面积的两倍，

    var abc = ab.cross(ac);
    var abp = ab.cross(ap);
    var apc = ap.cross(ac);
    var pbc = abc - abp - apc;   //等于pb.cross(pc)

    //面积法：4个三角形的面积差 等于 0

    var delta = Math.abs(abc) - Math.abs(abp) - Math.abs(apc) - Math.abs(pbc);

    return Math.abs(delta) < 0.05;        
}

cl.Point.lerp = function(a, b, alpha){
    var t = cc.pLerp(a,b,alpha);
    return cl.p(t.x, t.y);
}

cl.Point.sqrMagnitude = function(a){
    return a.x * a.x + a.y * a.y;
}


cc.p = cl.p = function(x,y){
    return new cl.Point(x, y);
}



// Math
Math.lerp = function(a, b, alpha){
    return a + (b - a) * alpha;
}

Math.clamp = function(value, min, max)
{
    if (value < min){
        value = min;
    } else {
        if (value > max) {
            value = max;
        }
    }
    return value;
}

},{}],12:[function(require,module,exports){
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

    var Component = require("../frameworks/cocos2d-html5/cocoslite/component/Component.js");

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
},{"../frameworks/cocos2d-html5/cocoslite/component/Component.js":2}]},{},[1,2,3,4,5,6,7,8,9,10,11,12]);
