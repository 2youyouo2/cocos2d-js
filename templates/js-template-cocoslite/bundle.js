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
        if(typeof attr === 'string') {

            // define getter
            if(typeof getter == 'function')
                obj.__defineGetter__(attr, getter);
            else if(typeof getter == 'string')
                obj.__defineGetter__(attr, obj[getter]);
            
            // define setter
            if(typeof setter == 'function')
                obj.__defineSetter__(attr, setter);
            else if(typeof setter == 'string')  
                obj.__defineSetter__(attr, obj[setter]);

        } else if(typeof attr === 'object') {
            for(var p in attr) {
                var value = attr[p];

                if(value.set) 
                    obj.__defineSetter__(p, value.set);
                if(value.get) 
                    obj.__defineGetter__(p, value.get);
            }
        }
    }

    cl.defineGetterSetter(cc.Node.prototype, "name", "getName", "setName");

    cl.config = {};

    cl.readConfig = function() {
        cl.config = {};

        var path = cc.path.join(cc.loader.resPath, 'project.json');

        cc.loader.loadJson(path, function(err, json){
            if(err) throw err;

            cl.config['physics'] = json['physics'] ? json['physics'] : 'None';
        });
    }

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

    var ctor = function(dependencies) {
        var self = this;

        var _dependencies    = dependencies ? dependencies : [];
        var _target          = null;
        var _exportedMethods = null;
        var _entered         = false;

        this.addComponent = function(className){
            if(_target)
                _target.addComponent(className);
        };

        this.getComponent = function(className){
            if(_target)
                return _target.getComponent(className);
            return null;
        },

        this._bind = function(target){
            _target = target;

            for(var k in _dependencies){
                this.addComponent(_dependencies[k]);
            }

            this.onBind(target);
        };

        this._unbind = function(){
            if(_exportedMethods != null){
                var methods = _exportedMethods;

                for(var key in methods){
                    var method = methods[key];
                    _target[method] = null;
                }
            }

            this.onUnbind(_target);
        };

        this._enter = function() {
            if(_entered) {
                return;
            }

            _entered = true;
            this.onEnter(_target);
        };

        this._exportMethods = function (methods) {

            _exportedMethods = methods;

            for(var key in methods){
                var method = methods[key];
                _target[method] = function(){
                    self[method].apply(self, arguments);
                };
            }
        };

        cl.defineGetterSetter(this, {
            "target": {
                get: function() {
                    return _target;
                }
            }
        });
    }

    var Component = cc.Class.extend({
        properties: [],
        
        ctor:ctor,
        
        onBind: function(target) {

        },
        onUnbind: function(target) {

        },
        onEnter: function(target) {

        },

        toJSON: function(){
            var json = {};
            json.class = this.className;

            for(var i=0; i<this.properties.length; i++){
                var k = this.properties[i];

                var value = this[k];

                if(this["toJSON"+k]) {
                    json[k] = this["toJSON"+k]();
                }
                else if(value !== null || value !== undefined){
                    json[k] = value.toJSON ? value.toJSON() : value;
                }
            }
            return json;
        }
    });


    var _deserializeFuncs = [];

    Component.fromJSON = function(parent, json) {
        var c = parent.addComponent(json.class);
        if(c == null) return null;
        
        for(var k in json) {
            if(k == "class") continue;
            
            var value = json[k];

            for(var i=0; i<_deserializeFuncs.length; i++) {
                var ret;
                try {
                    ret = _deserializeFuncs[i](k, value);
                }
                catch(e) {
                    console.log("SceneManager.tryReviver for [%s]failed : ", k, e);
                }
                
                if(ret) {
                    value = ret;
                }
            }

            c[k] = value;
        }

        return c;
    };

    Component.registerDeserialize = function(func) {
        _deserializeFuncs.push(func);
    };


    var stringParsers = [
        {
            re: /#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,
            parse: function(execResult) {
                return cc.color(execResult[0]);
            }
        },
        {
            re: /cl.Enum.(\w*)+\.(\w*)+/,
            parse: function(execResult) {
                return cl.Enum[execResult[1]][execResult[2]];
            }
        }
    ];

    // register default deserialize
    Component.registerDeserialize(function(key, value) {

        var ret = null;

        if(typeof value === 'string') {

            stringParsers.forEach(function(parser) {
                var match = parser.re.exec(value);

                if(match) {
                    ret = parser.parse(match);
                }
            });
        }

        return ret;
    });

    Component.extendComponent = function(className, params, parent) {
        if(!parent) parent = Component;

        var gs = params._get_set_;
        delete params._get_set_;

        var _folder_ = params._folder_ ? params._folder_ : parent._folder_;
        delete params._folder_;

        var abstract = params._abstract_;
        delete params._abstract_;

        var _show_ = params._show_ ? params._show_ : parent._show_;
        delete params._show_;

        var ret = parent.extend(params);

        if(gs) {
            cl.defineGetterSetter(ret.prototype, gs);
        }

        ret.prototype.className = ret.className = className;
        ret._folder_ = _folder_;
        ret._show_ = _show_;

        if(!abstract) {
            ComponentManager.register(className, ret);
        }

        return ret;
    }

    Component.init = function(obj, params) {
        for(var k in params) {
            obj[k] = params[k];
        }
    }

    module.exports = cl.Component = Component;
});

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
            this._classes = [];
        },

        register : function(className, cls){
            this._classes[className] = cls;
        },

        unregister : function(className){
            delete this._classes[className];
        },

        create : function (className) {
            var cls = this._classes[className];

            if(cls != null)
                return new cls(arguments);

            return null;
        },

        getAllClasses: function(){
            return this._classes;
        },

        clear: function() {
            this._classes = [];
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
    
    var Component = require("../Component.js");

    var ColorComponent = Component.extendComponent("ColorComponent", {
        properties: ["color", "cascadeColor", "opacity", "cascadeOpacity"],

        ctor: function() {
            this._super();
        },

        _get_set_: {
            "color": {
                get: function() {
                    if(!this.target) {
                        return cc.color();
                    }
                    return this.target.color;
                },
                set: function(val) {
                    this.target.color = val;
                }
            },

            "cascadeColor": {
                get: function() {
                    if(!this.target) {
                        return false;
                    }
                    return this.target.cascadeColor;
                },
                set: function(val) {
                    this.target.cascadeColor = val;
                }
            },

            "opacity": {
                get: function() {
                    if(!this.target) {
                        return 0;
                    }
                    return this.target.opacity;
                },
                set: function(val) {
                    this.target.opacity = val;
                }
            },

            "cascadeOpacity": {
                set: function(val) {
                    this.target.cascadeOpacity = val;
                },
                get: function() {
                    if(!this.target) {
                        return false;
                    }
                    return this.target.cascadeOpacity;
                }
            }
        },

        _folder_: "base"
    });

    module.exports = ColorComponent;
});

},{"../Component.js":2}],5:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("../Component.js");

    var MeshComponent = Component.extendComponent("MeshComponent", {
        ctor: function () {
            // this.properties = ["materials", "subMeshes", "vertices"];
            
            this._innerMesh = new cl.MeshSprite();
            this._innerMesh.retain();
            
            this._super();
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
        },

        _folder_: "base"
    });

    var _p = MeshComponent.prototype;
    MeshComponent.editorDir = "Mesh";

    cl.defineGetterSetter(_p, "materials", "_getMaterials", "_setMaterials");
    cl.defineGetterSetter(_p, "vertices", "_getVertices", "_setVertices");
    cl.defineGetterSetter(_p, "subMeshes", "_getSubMeshes");

    module.exports = MeshComponent;
});


},{"../Component.js":2}],6:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("../Component.js");

    var SpriteComponent = Component.extendComponent("SpriteComponent", {
        properties: ["sprite", "anchorPoint"],
        
        ctor: function () {
            
            this._anchorPoint = new cl.p(0.5, 0.5);
            this._innerSprite = new cc.Sprite();
            
            this._super();
        },

        _setSprite: function(file) {
            if(file !== "") {
                this._innerSprite.initWithFile(file);
            } else {
                this._innerSprite.setTexture(null);
            }
        },
        _getSprite: function(){
            return this._innerSprite;
        },

        _getAnchorPoint: function(){
            return this._anchorPoint;
        },
        _setAnchorPoint: function(val){
            this._anchorPoint = cl.p(val);
            this._innerSprite.setAnchorPoint(val);
        },

        _getBoundingBox: function(){
            return this._innerSprite.getBoundingBoxToWorld();
        },

        onBind: function(target) {
            target.addChild(this._innerSprite);
        },
        onUnbind: function(target){
            target.removeChild(this._innerSprite);
        },

        hitTest: function(worldPoint){
            if(!this._innerSprite || !worldPoint) return;

            var p = this._innerSprite.convertToNodeSpace(worldPoint);
            var s = this._innerSprite.getContentSize();
            var rect = cc.rect(0, 0, s.width, s.height);

            return cc.rectContainsPoint(rect, p);
        },

        _folder_: "base"
    });

    var _p = SpriteComponent.prototype;
    SpriteComponent.editorDir = "Sprite";

    cl.defineGetterSetter(_p, "sprite", "_getSprite", "_setSprite");
    cl.defineGetterSetter(_p, "anchorPoint", "_getAnchorPoint", "_setAnchorPoint");
    cl.defineGetterSetter(_p, "boundingBox", "_getBoundingBox", null);

    module.exports = SpriteComponent;
});

},{"../Component.js":2}],7:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("../Component.js");

    var TransformComponent = Component.extendComponent("TransformComponent", {
        properties: ["position", "scale", "rotation"],
        
        ctor: function() {
            this._super();
        },

        _get_set_: {
            "position": {
                get: function() {
                    if(!this.target) {
                        return cl.p();
                    }
                    return this.target.getPosition();
                },
                set: function(val) {
                    this.target.setPosition(val);
                }
            },

            "scale": {
                get: function() {
                    if(!this.target) {
                        return cl.p();
                    }
                    return cl.p(this.target.scaleX, this.target.scaleY);
                },
                set: function(val, y) {
                    if(y) {
                        this.target.scaleX = val;
                        this.target.scaleY = y;
                    } else {
                        this.target.scaleX = val.x;
                        this.target.scaleY = val.y;
                    }  
                }
            },

            "rotation": {
                get: function() {
                    if(!this.target) {
                        return cl.p();
                    }
                    return cl.p(this.target.rotationX, this.target.rotationY);
                },
                set: function(val, y) {
                    if(y) {
                        this.target.rotationX = val;
                        this.target.rotationY = y;
                    } else if(val.x !== undefined) {
                        this.target.rotationX = val.x;
                        this.target.rotationY = val.y;
                    } else {
                        this.target.rotation = val;
                    }
                }
            },

            "x": {
                set: function(val) {
                    this.position = cl.p(val, this.position.y);
                },
                get: function() {
                    return this.target.x;
                }
            },

            "y": {
                set: function(val) {
                    this.position = cl.p(this.position.x, val);
                },
                get: function() {
                    return this.target.y;
                }
            },

            "scaleX": {
                set: function(val) {
                    this.scale = cl.p(val, this.scale.y);
                },
                get: function() {
                    return this.target.scaleX;
                }
            },

            "scaleY": {
                set: function(val) {
                    this.scale = cl.p(this.scale.x, val);
                },
                get: function() {
                    return this.target.scaleY;
                }
            },

            "rotationX": {
                set: function(val) {
                    this.rotation = cl.p(val, this.rotation.y);
                    this.target.rotationX = val;
                },
                get: function() {
                    return this.target.rotationX;
                }
            },

            "rotationY": {
                set: function(val) {
                    this.rotation = cl.p(this.rotation.x, val);
                },
                get: function() {
                    return this.target.rotationY;
                }
            }
        },

        _folder_: "base"
    });

    module.exports = TransformComponent;
});

},{"../Component.js":2}],8:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component       = require("../Component.js");

    var PhysicsBody = Component.extendComponent("PhysicsBody", {
        properties: ['static', 'mess', 'moment'],

        ctor: function() {
            this._super();

            this._static = false;
            this._mess = 1;
            this._moment = 1000;
            this._duringUpdate = false;
        },

        getBody: function() {
            return this._body;
        },

        onEnter: function(target) {
            if(this._static) {
                this._body = cl.space.staticBody;
            } else {
                this._body = new cp.Body(this._mess, this._moment );
                cl.space.addBody( this._body );
            }

            var self = this;

            this.t = this.getComponent("TransformComponent");

            target._originSetPosition = target.setPosition;
            target.setPosition = function(x, y) {
                this._originSetPosition.apply(this, arguments);

                if(self._duringUpdate || !self._body) {
                    return;
                }

                if (y === undefined) {
                    self._body.setPos(x);
                } else {
                    self._body.setPos(cl.p(x, y));
                }
            }

            target._originSetRotation = target.setRotation;
            target.setRotation = function(r) {
                this._originSetRotation.apply(this, arguments);

                if(self._duringUpdate || !self._body) {
                    return;
                }

                self._body.a = -cc.degreesToRadians(r);
            }

            cl.defineGetterSetter(target, "position", target.getPosition, target.setPosition);
            cl.defineGetterSetter(target, "rotation", target.getRotation, target.setRotation);

            target.position = target.position;
            target.rotation = target.rotation;
        },

        _syncPosition:function () {
            var p = this._body.getPos();
            var locPosition = this.t.position;

            if (locPosition.x !== p.x || locPosition.y !== p.y) {
                this.t.position = cl.p(p);
            }
        },
        _syncRotation:function () {
            var a = -cc.radiansToDegrees(this._body.getAngle());
            if (this.t.rotationX !== a) {
                this.t.rotation = a;
            }
        },

        onUpdate: function(dt) {
            if(this._static) {
                return;
            }

            this._duringUpdate = true;

            this._syncPosition();
            this._syncRotation();

            this._duringUpdate = false;
        },

        _get_set_: {
            'static': {
                get: function() {
                    return this._static;
                },

                set: function(val) {
                    this._static = val;
                }
            },

            'mess': {
                get: function() {
                    return this._mess;
                },

                set: function(val) {
                    this._mess = val;

                    if(this._body && this._static) {
                        this._body.setMess(val);
                    }
                }
            },

            'moment': {
                get: function() {
                    return this._moment;
                },

                set: function(val) {
                    this._moment = val;

                    if(this._body && this._static) {
                        this._body.setMoment(val);
                    }
                }
            }
        },

        _show_: function() {
            return cl.config.physics === 'Chipmunk';
        },
        _folder_: "physics"
    });

    module.exports = PhysicsBody;
});

},{"../Component.js":2}],9:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component    = require("../Component.js");
    var PhysicsShape = require("./PhysicsShape.js");


    var PhysicsBox = Component.extendComponent("PhysicsBox", {
        properties: PhysicsShape.prototype.properties.concat(['width', 'height']),

        ctor: function() {
            this._super();

            this._width  = 50;
            this._height = 50;
        },

        createVerts: function() {
            var hw = this._width/2;
            var hh = this._height/2;

            var verts = [
                -hw, -hh,
                -hw,  hh,
                 hw,  hh,
                 hw, -hh
            ];

            return verts;
        },

        createShape: function() {
            return new cp.PolyShape(this.getBody(), this.createVerts(), cp.vzero);
        },

        _get_set_: {
            width: {
                get: function() {
                    return this._width;
                },
                set: function(val) {
                    this._width = val;
                }
            },

            height: {
                get: function() {
                    return this._height;
                },
                set: function(val) {
                    this._height = val;
                }
            }
        }
    }, PhysicsShape);

    module.exports = PhysicsBox;
});

},{"../Component.js":2,"./PhysicsShape.js":11}],10:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component    = require("../Component.js");
    var PhysicsShape = require("./PhysicsShape.js");


    var PhysicsSegment = Component.extendComponent("PhysicsSegment", {
        properties: PhysicsShape.prototype.properties.concat(['start', 'end']),

        ctor: function() {
            this._super();

            this._start = cl.p(0,  0);
            this._end   = cl.p(100,0);
        },

        createShape: function() {
            return new cp.SegmentShape(this.getBody(), this._start, this._end, 0);
        },

        _get_set_: {
            start: {
                get: function() {
                    return this._start;
                },
                set: function(val) {
                    this._start = cl.p(val);
                }
            },

            end: {
                get: function() {
                    return this._end;
                },
                set: function(val) {
                    this._end = cl.p(val);
                }
            }
        }
    }, PhysicsShape);

    module.exports = PhysicsSegment;
});

},{"../Component.js":2,"./PhysicsShape.js":11}],11:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("../Component.js");

    var PhysicsShape = Component.extendComponent("PhysicsShape", {
        properties: ['sensor', 'elasticity', 'friction'],

        ctor: function() {
            this._super(['PhysicsBody']);

            this._shape      = null;
            this._sensor     = false;
            this._elasticity = 0;
            this._friction   = 0;
        },

        getBody: function() {
            return this._physicsBody.getBody();
        },

        createShape: function() {
            return null;
        },

        updateShape: function() {
            if(!this._physicsBody) {
                return;
            }

            if(this._shape) {
                cl.space.removeShape(this._shape);
            }

            this._shape = this.createShape();
            
            cl.space.addShape(this._shape);
        },

        onEnter: function(target) {
            this._physicsBody = this.getComponent('PhysicsBody');

            this.updateShape();
        },

        _get_set_: {
            sensor: {
                get: function() {
                    return this._sensor;
                },
                set: function(val) {
                    this._sensor = val;

                    if(!this._shape) {
                        return;
                    }
                    this._shape.setSensor(val);
                }
            },

            elasticity: {
                get: function() {
                    return this._elasticity;
                },
                set: function(val) {
                    this._elasticity = val;

                    if(this._shape) {
                        this._shape.setElasticity(val);
                    }
                }
            },

            friction: {
                get: function() {
                    return this._friction;
                },
                set: function(val) {
                    this._friction = val;

                    if(this._shape) {
                        this._shape.setFriction(val);
                    }
                }
            }
        },

        _show_: function() {
            return cl.config.physics === 'Chipmunk';
        },

        _folder_: "physics",
        _abstract_: true
    });

    module.exports = PhysicsShape;
});

},{"../Component.js":2}],12:[function(require,module,exports){
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $ */

/**
 * Implements a jQuery-like event dispatch pattern for non-DOM objects:
 *  - Listeners are attached via on()/one() & detached via off()
 *  - Listeners can use namespaces for easy removal
 *  - Listeners can attach to multiple events at once via a space-separated list
 *  - Events are fired via trigger()
 *  - The same listener can be attached twice, and will be called twice; but off() will detach all
 *    duplicate copies at once ('duplicate' means '===' equality - see http://jsfiddle.net/bf4p29g5/1/)
 * 
 * But it has some important differences from jQuery's non-DOM event mechanism:
 *  - More robust to listeners that throw exceptions (other listeners will still be called, and
 *    trigger() will still return control to its caller).
 *  - Events can be marked deprecated, causing on() to issue warnings
 *  - Easier to debug, since the dispatch code is much simpler
 *  - Faster, for the same reason
 *  - Uses less memory, since $(nonDOMObj).on() leaks memory in jQuery
 *  - API is simplified:
 *      - Event handlers do not have 'this' set to the event dispatcher object
 *      - Event object passed to handlers only has 'type' and 'target' fields
 *      - trigger() uses a simpler argument-list signature (like Promise APIs), rather than requiring
 *        an Array arg and ignoring additional args
 *      - trigger() does not support namespaces
 *      - For simplicity, on() does not accept a map of multiple events -> multiple handlers, nor a
 *        missing arg standing in for a bare 'return false' handler.
 * 
 * For now, Brackets uses a jQuery patch to ensure $(obj).on() and obj.on() (etc.) are identical
 * for any obj that has the EventDispatcher pattern. In the future, this may be deprecated.
 * 
 * To add EventDispatcher methods to any object, call EventDispatcher.makeEventDispatcher(obj).
 */
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    
    /**
     * Split "event.namespace" string into its two parts; both parts are optional.
     * @param {string} eventName Event name and/or trailing ".namespace"
     * @return {!{event:string, ns:string}} Uses "" for missing parts.
     */
    function splitNs(eventStr) {
        var dot = eventStr.indexOf(".");
        if (dot === -1) {
            return { eventName: eventStr };
        } else {
            return { eventName: eventStr.substring(0, dot), ns: eventStr.substring(dot) };
        }
    }
    
    
    // These functions are added as mixins to any object by makeEventDispatcher()
    
    /**
     * Adds the given handler function to 'events': a space-separated list of one or more event names, each
     * with an optional ".namespace" (used by off() - see below). If the handler is already listening to this
     * event, a duplicate copy is added.
     * @param {string} events
     * @param {!function(!{type:string, target:!Object}, ...)} fn
     */
    var on = function (events, fn) {
        var eventsList = events.split(/\s+/).map(splitNs),
            i;
        
        // Check for deprecation warnings
        if (this._deprecatedEvents) {
            for (i = 0; i < eventsList.length; i++) {
                var deprecation = this._deprecatedEvents[eventsList[i].eventName];
                if (deprecation) {
                    var message = "Registering for deprecated event '" + eventsList[i].eventName + "'.";
                    if (typeof deprecation === "string") {
                        message += " Instead, use " + deprecation + ".";
                    }
                    console.warn(message, new Error().stack);
                }
            }
        }
        
        // Attach listener for each event clause
        for (i = 0; i < eventsList.length; i++) {
            var eventName = eventsList[i].eventName;
            if (!this._eventHandlers) {
                this._eventHandlers = {};
            }
            if (!this._eventHandlers[eventName]) {
                this._eventHandlers[eventName] = [];
            }
            eventsList[i].handler = fn;
            this._eventHandlers[eventName].push(eventsList[i]);
        }
        
        return this;  // for chaining
    };
    
    /**
     * Removes one or more handler functions based on the space-separated 'events' list. Each item in
     * 'events' can be: bare event name, bare .namespace, or event.namespace pair. This yields a set of
     * matching handlers. If 'fn' is ommitted, all these handlers are removed. If 'fn' is provided,
     * only handlers exactly equal to 'fn' are removed (there may still be >1, if duplicates were added).
     * @param {string} events
     * @param {?function(!{type:string, target:!Object}, ...)} fn
     */
    var off = function (events, fn) {
        if (!this._eventHandlers) {
            return this;
        }
        
        var eventsList = events.split(/\s+/).map(splitNs),
            i;
        
        var removeAllMatches = function (eventRec, eventName) {
            var handlerList = this._eventHandlers[eventName],
                k;
            if (!handlerList) {
                return;
            }
            
            // Walk backwards so it's easy to remove items
            for (k = handlerList.length - 1; k >= 0; k--) {
                // Look at ns & fn only - doRemove() has already taken care of eventName
                if (!eventRec.ns || eventRec.ns === handlerList[k].ns) {
                    var handler = handlerList[k].handler;
                    if (!fn || fn === handler || fn._eventOnceWrapper === handler) {
                        handlerList.splice(k, 1);
                    }
                }
            }
            if (!handlerList.length) {
                delete this._eventHandlers[eventName];
            }
        }.bind(this);
        
        var doRemove = function (eventRec) {
            if (eventRec.eventName) {
                // If arg calls out an event name, look at that handler list only
                removeAllMatches(eventRec, eventRec.eventName);
            } else {
                // If arg only gives a namespace, look at handler lists for all events
                for(var eventname in this._eventHandlers) {
                	removeAllMatches(eventRec, eventName);
                }
            }
        }.bind(this);
        
        // Detach listener for each event clause
        // Each clause may be: bare eventname, bare .namespace, full eventname.namespace
        for (i = 0; i < eventsList.length; i++) {
            doRemove(eventsList[i]);
        }
        
        return this;  // for chaining
    };
    
    /**
     * Attaches a handler so it's only called once (per event in the 'events' list).
     * @param {string} events
     * @param {?function(!{type:string, target:!Object}, ...)} fn
     */
    var one = function (events, fn) {
        // Wrap fn in a self-detaching handler; saved on the original fn so off() can detect it later
        if (!fn._eventOnceWrapper) {
            fn._eventOnceWrapper = function (event) {
                // Note: this wrapper is reused for all attachments of the same fn, so it shouldn't reference
                // anything from the outer closure other than 'fn'
                event.target.off(event.type, fn._eventOnceWrapper);
                fn.apply(this, arguments);
            };
        }
        return this.on(events, fn._eventOnceWrapper);
    };
    
    /**
     * Invokes all handlers for the given event (in the order they were added).
     * @param {string} eventName
     * @param {*} ... Any additional args are passed to the event handler after the event object
     */
    var trigger = function (eventName) {
        var event = { type: eventName, target: this },
            handlerList = this._eventHandlers && this._eventHandlers[eventName],
            i;
        
        if (!handlerList) {
            return;
        }
        
        // Use a clone of the list in case handlers call on()/off() while we're still in the loop
        handlerList = handlerList.slice();

        // Pass 'event' object followed by any additional args trigger() was given
        var applyArgs = Array.prototype.slice.call(arguments, 1);
        applyArgs.unshift(event);

        for (i = 0; i < handlerList.length; i++) {
            try {
                // Call one handler
                handlerList[i].handler.apply(null, applyArgs);
            } catch (err) {
                console.error("Exception in '" + eventName + "' listener on", this, String(err), err.stack);
                console.assert();  // causes dev tools to pause, just like an uncaught exception
            }
        }
    };
    
    
    /**
     * Adds the EventDispatcher APIs to the given object: on(), one(), off(), and trigger(). May also be
     * called on a prototype object - each instance will still behave independently.
     * @param {!Object} obj Object to add event-dispatch methods to
     */
    function makeEventDispatcher(obj) {
        $.extend(obj, {
            on: on,
            off: off,
            one: one,
            trigger: trigger,
            _EventDispatcher: true
        });
        // Later, on() may add _eventHandlers: Object.<string, Array.<{event:string, namespace:?string,
        //   handler:!function(!{type:string, target:!Object}, ...)}>> - map from eventName to an array
        //   of handler records
        // Later, markDeprecated() may add _deprecatedEvents: Object.<string, string|boolean> - map from
        //   eventName to deprecation warning info
    }
    
    /**
     * Utility for calling on() with an array of arguments to pass to event handlers (rather than a varargs
     * list). makeEventDispatcher() must have previously been called on 'dispatcher'.
     * @param {!Object} dispatcher
     * @param {string} eventName
     * @param {!Array.<*>} argsArray
     */
    function triggerWithArray(dispatcher, eventName, argsArray) {
        var triggerArgs = [eventName].concat(argsArray);
        dispatcher.trigger.apply(dispatcher, triggerArgs);
    }
    
    /**
     * Utility for attaching an event handler to an object that has not YET had makeEventDispatcher() called
     * on it, but will in the future. Once 'futureDispatcher' becomes a real event dispatcher, any handlers
     * attached here will be retained.
     * 
     * Useful with core modules that have circular dependencies (one module initially gets an empty copy of the
     * other, with no on() API present yet). Unlike other strategies like waiting for htmlReady(), this helper
     * guarantees you won't miss any future events, regardless of how soon the other module finishes init and
     * starts calling trigger().
     * 
     * @param {!Object} futureDispatcher
     * @param {string} events
     * @param {?function(!{type:string, target:!Object}, ...)} fn
     */
    function on_duringInit(futureDispatcher, events, fn) {
        on.call(futureDispatcher, events, fn);
    }
    
    /**
     * Mark a given event name as deprecated, such that on() will emit warnings when called with it.
     * May be called before makeEventDispatcher(). May be called on a prototype where makeEventDispatcher()
     * is called separately per instance (i.e. in the constructor). Should be called before clients have
     * a chance to start calling on().
     * @param {!Object} obj Event dispatcher object
     * @param {string} eventName Name of deprecated event
     * @param {string=} insteadStr Suggested thing to use instead
     */
    function markDeprecated(obj, eventName, insteadStr) {
        // Mark event as deprecated - on() will emit warnings when called with this event
        if (!obj._deprecatedEvents) {
            obj._deprecatedEvents = {};
        }
        obj._deprecatedEvents[eventName] = insteadStr || true;
    }
    
    
    exports.makeEventDispatcher = makeEventDispatcher;
    exports.triggerWithArray    = triggerWithArray;
    exports.on_duringInit       = on_duringInit;
    exports.markDeprecated      = markDeprecated;
});

},{}],13:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var Component = require("../component/Component.js");

    var GameObject = cc.Node.extend({
        properties: ["name", "tag"],

        ctor : function (){
            this._super();

            this._components = [];
            this._properties = [];
            this._updateRequest = 0;

            this.name = "GameObject";

            this.addComponent("TransformComponent");
            
        },

        _getComponents: function(){
            return this._components;
        },

        addComponent : function(className){
            var c;

            if(typeof className === 'string') {
                c = this._components[className];
                if(c) return c;

                c = cl.ComponentManager.create(className);
                if(c == null){
                    console.log(className + "is not a valid Component");
                    return null;
                }

                this._components[className] = c;
            } else if(typeof className === 'object'){
                c = className;
                this._components[c.className] = c;
            }


            c._bind(this);
            this._components.push(c);

            if(c.onUpdate) {
                if(this._updateRequest === 0 && this.isRunning()) {
                    this.scheduleUpdate();
                }
                this._updateRequest++;
            }

            if(this.isRunning()) {
                c._enter(this);
            }

            return c;
        },

        addComponents : function(classnames){
            for(var key in classnames){
                this.addCompoent(classnames[key]);
            }
        },

        getComponent: function(className){
            return this._components[className];
        },

        removeComponent: function (className) {
            if(typeof className === 'object') {
                className = className.className;
            }

            var c = this._components[className];

            if(c != null) {
                c._unbind();

                if(c.onUpdate) {
                    this._updateRequest--;
                    if(this._updateRequest === 0) {
                        this.unscheduleUpdate();
                    }
                }


                delete this._components[className];
                var index = this._components.indexOf(c);
                this._components.splice(index, 1);
            }

            return c;
        },

        onEnter: function() {
            cc.Node.prototype.onEnter.call(this);

            for(var i=0; i<this._components.length; i++){
                this._components[i]._enter(this);
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
        },

        toJSON: function(){
            var json = {};

            var components = json.components = [];

            var cs = this.components;
            for(var i=0; i<cs.length; i++) {
                components.push(cs[i].toJSON());
            }

            for(var k=0; k<this.children.length; k++){
                var child = this.children[k];
                if(child.constructor === cl.GameObject){
                    
                    if(!json.children) {
                        json.children = [];
                    }

                    var cj = child.toJSON();
                    json.children.push(cj);
                }
            }

            var self = this;
            this.properties.forEach(function(p) {
                json[p] = self[p];
            });

            return json;
        },

        clone: function() {
            var json = this.toJSON();
            return GameObject.fromJSON(json);
        }
    });

    GameObject.fromJSON = function(json) {
        var o = new GameObject();

        o.properties.forEach(function(p) {
            o[p] = json[p] === undefined ? o[p] : json[p];
        });

        for(var i=0; i<json.components.length; i++) {
            Component.fromJSON(o, json.components[i]);
        }

        if(json.children) {
            for(var i=0; i<json.children.length; i++){
                GameObject.fromJSON(o, json.children[i]);
            }
        }

        return o;
    };

    cl.defineGetterSetter(GameObject.prototype, "components", "_getComponents");

    module.exports = cl.GameObject = GameObject;
});

},{"../component/Component.js":2}],14:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var KeyManager = function(element) {

        var _map = {};

        this.isKeyDown = function(key) {
            return _map[key];
        };
        
        this.matchKeyDown = function(keys) {
            keys = keys.length ? keys : [keys];

            if(Object.keys(_map).length !== keys.length) {
                return false;
            }

            var match = true;

            for(var i in keys) {
                if(!_map[keys[i]]) {
                    match = false;
                    break;
                }
            }

            return match;
        };

        this.onKeyPressed = function(key) {
            _map[key] = true;
        }

        this.onKeyReleased = function(key) {
            delete _map[key];
        }

        // for web application
        if(element) {
            var self = this;

            element.addEventListener('keydown', function(e) {
                self.onKeyPressed(e.which);
            });

            element.addEventListener('keyup', function(e) {
                self.onKeyReleased(e.which);
            });
        }
    }
    
    cl.keyManager = new KeyManager;
    cl.KeyManager = KeyManager;

    cc.eventManager.addListener(cc.EventListener.create({

        event: cc.EventListener.KEYBOARD,

        onKeyPressed : cl.keyManager.onKeyPressed,
        onKeyReleased: cl.keyManager.onKeyReleased

    }), 10000);

    module.exports = cl.keyManager;
});

},{}],15:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";

    var GameObject = require("./GameObject.js");

    // private
    var _sceneMap = {};

    // SceneManager
    var SceneManager = {};



    SceneManager.loadScene = function(path, cb, force) {
        var json = _sceneMap[path];
        var self = this;

        var parseComplete = function(scene){
            if(scene && cb) cb(scene);
        }

        if(json && !force){
            parseData(json, parseComplete);
        } else {
            cc.loader.loadJson(path, function(err, json){
                if(err) throw err;

                _sceneMap[path] = json;
                
                self.parseData(json, parseComplete);
            });
        }
    };

    SceneManager.loadSceneWithContent = function(content, cb) {

        try{
            var json = JSON.parse(content); 

            var parseComplete = function(scene){
                if(scene && cb) cb(scene);
            }

            this.parseData(json, parseComplete);   
        }
        catch(err) {
            throw err;
        }
        
    };

    SceneManager.initPhysics = function(scene, data) {
        scene.physics = data;
        scene.space = cl.space = new cp.Space();

        var space = cl.space ;

        // Gravity
        space.gravity = cp.v(0, -100);


        var debugNode = new cc.PhysicsDebugNode( space );
        debugNode.visible = true ;

        var parent = scene;
        if(scene.canvas) {
            parent = scene.canvas;
        }
        parent.addChild( debugNode );

        scene.scheduleUpdate();
        scene.update = function( delta ) {
            cl.space.step( delta );
        }

    }

    SceneManager.parseData = function(json, cb){
        var data = json.root;
        var self = this;

        cc.LoaderScene.preload(data.res, function () {

            var scene = new cc.Scene();

            scene.res = data.res;

            var parent = scene;
            if(cl.createCanvas) {
                parent = cl.createCanvas(scene, data.canvas);
            }

            if(cl.config.physics !== 'None') {
                self.initPhysics(scene, data.physics);
            }

            for(var i=0; i<data.children.length; i++){
                var o = GameObject.fromJSON(data.children[i]);
                parent.addChild(o);
            }

            if(cb) {
                cb(scene);
            }

        }, this);
    };

    module.exports = cl.SceneManager = SceneManager;
});

},{"./GameObject.js":13}],16:[function(require,module,exports){
cl.EnumValue = function(Enum, key, value) {
    this.Enum = Enum;
    this.value = value;
    
    this.toString = function() {
        return 'cl.Enum' + Enum.name + '.' + key;
    }
}

// cl.Enum
cl.Enum = function() {
    
    var name = arguments[0];
    Array.prototype.splice.call(arguments, 0,1);

    if(cl[name]) {
        console.log("Can't regiseter Enum with an existed name [%s]", name);
    }


    var currentNumber = 0;
    var Enum = {};
    Enum.name = name;

    for(var i=0; i<arguments.length; i++) {
        var arg = arguments[i];

        var key, value;

        if(Array.isArray(arg)) {
            key = arg[0];
            currentNumber = value = arg[1];
        } else {
            key = arg;
            value = currentNumber;
        }

        Enum[key] = new cl.EnumValue(Enum, key, value);

        currentNumber++;
    }

    Enum.forEach = function(cb) {
        for(var k in this) {
            if(k !== 'name' && k !== 'forEach') {
                cb(k, this[k]);
            }
        }
    }

    cl.Enum[name] = Enum;

    return Enum;
}



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

    var abc = ab.cross(ac);
    var abp = ab.cross(ap);
    var apc = ap.cross(ac);
    var pbc = abc - abp - apc;  

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

},{}],17:[function(require,module,exports){
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

    var Component  = require("../frameworks/cocos2d-html5/cocoslite/component/Component.js");
    var KeyManager = require("../frameworks/cocos2d-html5/cocoslite/core/KeyManager.js");

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
},{"../frameworks/cocos2d-html5/cocoslite/component/Component.js":2,"../frameworks/cocos2d-html5/cocoslite/core/KeyManager.js":14}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]);
