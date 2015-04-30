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
    
    var Component = require("./Component.js");

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

    exports.Component = ColorComponent;
});

},{"./Component.js":3}],3:[function(require,module,exports){
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

        var folder = params._folder_
        delete params._folder_;

        var ret = parent.extend(params);

        if(gs) {
            cl.defineGetterSetter(ret.prototype, gs);
        }

        ret.prototype.className = ret.className = className;
        ret.folder = folder;

        ComponentManager.register(className, ret);

        return ret;
    }

    Component.init = function(obj, params) {
        for(var k in params) {
            obj[k] = params[k];
        }
    }

    module.exports = cl.Component = Component;
});

},{"./ComponentManager.js":4}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

    exports.Component = MeshComponent;
});


},{"./Component.js":3}],6:[function(require,module,exports){
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

    exports.Component = SpriteComponent;
});

},{"./Component.js":3}],7:[function(require,module,exports){
(function (factory) {
    if(typeof exports === 'object') {
        factory(require, module.exports, module);
    } else if(typeof define === 'function') {
        define(factory);
    }
})(function(require, exports, module) {
    "use strict";
    
    var Component = require("./Component.js");

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
                    } else {
                        this.target.rotationX = val.x;
                        this.target.rotationY = val.y;
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

    exports.Component = TransformComponent;
});

},{"./Component.js":3}],8:[function(require,module,exports){
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

            if(c.onUpdate) {
                if(this._updateRequest === 0 && this.isRunning()) {
                    this.scheduleUpdate();
                }
                this._updateRequest++;
            }

            if(this.isRunning()) {
                c.onEnter(this);
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
            }

            delete this._components[className];

            return c;
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
        },

        toJSON: function(){
            var json = {};

            var components = json.components = [];

            var cs = this.components;
            for(var i in cs) {
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

},{"../component/Component.js":3}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./GameObject.js":8}],11:[function(require,module,exports){
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
},{"../frameworks/cocos2d-html5/cocoslite/component/Component.js":3,"../frameworks/cocos2d-html5/cocoslite/core/KeyManager.js":9}],13:[function(require,module,exports){
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

    
    cl.DynamicMesh = function(){
        this.clear();
    };

    var _p = cl.DynamicMesh.prototype;
    _p.clear = function(){
        this._indices = [];
        this._verts = [];

        this._color = cc.color.WHITE;
    };

    _p.build = function(aMesh){
        aMesh.vertices = this._verts;
        aMesh.rebindVertices();
    };

    _p.addVertex = function() {
        var aX, aY, aZ, aU, aV;

        if(arguments.length === 5){
            aX = arguments[0]; aY=arguments[1]; aZ=arguments[2]; aU=arguments[3]; aV=arguments[4];
        } else if(arguments.length === 3){
            if(typeof arguments[0] === "number"){
                aX = arguments[0]; aY=arguments[1]; aZ=arguments[2]; aU=aV=0;
            }
            else{
                aX = arguments[0].x; aY=arguments[0].y; aZ=arguments[1]; aU=arguments[2].x; aV=arguments[2].y;
            }
        } 
//        else if(arguments.length === 4){
//
//        }

        // cc.log("vertex : %f, %f, %f, %f, %f     %i", aX, aY, aZ, aU, aV, this._verts.length);
        var v = new cc.V3F_C4B_T2F({x:aX,y:aY,z:aZ}, this._color, {u:aU,v:aV});
        this._verts.push(v);
        return this._verts.length-1;
    };

    _p.addFace = function(aV1, aV2, aV3, aV4) {
        var indices = this._indices;

        if(arguments.length === 3){
            indices.push (aV1);
            indices.push (aV2);
            indices.push (aV3);
        } else if(arguments.length === 4) {
            indices.push (aV3);
            indices.push (aV2);
            indices.push (aV1);

            indices.push (aV4);
            indices.push (aV3);
            indices.push (aV1);
        }
    };

    _p.getCurrentTriangleList = function(aStart) {
        aStart = aStart ? aStart : 0;

        var result = [];
        for (var i = aStart; i < this._indices.length; i++) {
            result.push(this._indices[i]);
        }
        return result;
    };

    _p._getVertCount = function(){
        return this._verts.length;
    };

    cl.defineGetterSetter(_p, "vertCount", "_getVertCount");

});

},{}],14:[function(require,module,exports){
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

    var Component = require("../../frameworks/cocos2d-html5/cocoslite/component/Component.js");

    var TerrainFillMode = cl.Enum(
        "TerrainFillMode",

        // The interior of the path will be filled, and edges will be treated like a polygon.
        "Closed",
        // Drops some extra vertices down, and fill the interior. Edges only around the path itself.
        "Skirt",
        // Doesn't fill the interior at all. Just edges.
        "None",
        // Fills the outside of the path rather than the interior, also inverts the edges, upside-down.
        "InvertedClosed"
    );

    var Params = function() {

        // private
        var path = null,
            mesh = null,
            terrainMaterial = null,
            dMesh = null,
            unitsPerUV = cl.p(1,1);

        Component.init(this, {
            fill: TerrainFillMode.Closed,
            fillY: 0,
            fillZ: -0.5,
            splitCorners: true,
            smoothPath: false,
            splistDist: 4,
            pixelsPerUnit: 32,
            vertexColor: cc.color.White,
            createCollider: true,
            depth: 4,
            sufaceOffset: [0,0,0,0],

            ctor: function () {

                terrainMaterial = new cl.TerrainMaterial();

                this._super(["MeshComponent", "TerrainPathComponent"]);
            },

            onEnter: function() {
                // this.recreatePath();
            },

            _getTerrainMaterial: function() {
                return terrainMaterial;
            },
            _setTerrainMaterial: function(file) {
                terrainMaterial.initWithFile(file);
            },

            toJSONterrainMaterial: function() {
                return terrainMaterial ? terrainMaterial.file : "";
            },

            recreatePath: function() {
                var fill = this.fill;

                if(!dMesh) { dMesh = new cl.DynamicMesh(); }
                if(!path)  { path = this.getComponent("TerrainPathComponent"); }
                if(!mesh)  { mesh = this.getComponent("MeshComponent"); }

                if(!terrainMaterial || terrainMaterial.loading || !mesh){
                    return;
                }

                if (mesh.materials.length === 0 || mesh.materials[0].file !== terrainMaterial.edgeMaterial.file || mesh.materials[1].file !== terrainMaterial.fillMaterial.file)
                {
                    mesh.materials.set(0, terrainMaterial.fillMaterial);
                    mesh.materials.set(1, terrainMaterial.edgeMaterial);

                    if (!terrainMaterial.has(cl.Enum.TerrainDirection.Left) &&
                        !terrainMaterial.has(cl.Enum.TerrainDirection.Right))
                    {
                        this.splitCorners = false;
                    }
                    // else
                    // {
                    //     this.splitCorners = true;
                    // }
                }

                dMesh.clear();
                if(path.count < 2){
                    this.getComponent("MeshComponent").file = null;
                    return;
                }

                this._unitsPerUV = cl.p(5.33333, 5.33333);

                var segments = [];
                var self = this;
                segments = this._getSegments(path.getVerts(this.smoothPath, this.splistDist, this.splitCorners));
                segments = segments.sort(function(a,b){
                    var d1 = self._getDescription(a);
                    var d2 = self._getDescription(b);
                    return d2.zOffset < d1.zOffset;
                });

                for (var i = 0; i < segments.length; i++) {
                    this._addSegment (segments[i], segments.length <= 1 && path.closed);
                }
                var submesh1 = dMesh.getCurrentTriangleList();

                // add a fill if the user desires
                if (fill === TerrainFillMode.Skirt && terrainMaterial.fillMaterial !== null)
                {
                    this._addFill(true);
                }
                else if ((fill === TerrainFillMode.Closed || fill === TerrainFillMode.InvertedClosed) && terrainMaterial.fillMaterial !== null)
                {
                    this._addFill(false);
                }
    //            else if (fill === TerrainFillMode.None) { }
                var submesh2 = dMesh.getCurrentTriangleList(submesh1.length);

                mesh.setSubMesh(1, submesh1);
                mesh.setSubMesh(0, submesh2);
                dMesh.build(mesh);
            },

            // private function

            _getDescription: function (aSegment) {
                var dir = path.getDirectionWithSegment(aSegment, 0, this.fill === TerrainFillMode.InvertedClosed);
                return terrainMaterial.getDescriptor(dir);
            },

            _getSegments: function (aPath)
            {
                var segments = [];
                if (this.splitCorners)
                {
                    segments = path.getSegments(aPath);
                }
                else
                {
                    segments.push(aPath);
                }
                if (path.closed && this.smoothPath === false)
                {
                    path.closeEnds(segments, this.splitCorners);
                }
                return segments;
            },

            _addSegment: function(aSegment, aClosed) {
                var unitsPerUV  = this._unitsPerUV;
                var fill        = this.fill;

                var desc        = this._getDescription(aSegment);
                var bodyID      = Math.round(Math.random() * (desc.body.length-1));
                var body        = terrainMaterial.toUV( desc.body[bodyID] );
                var bodyWidth   = body.width * unitsPerUV.x;

                // int tSeed = UnityEngine.Random.seed;

                var capLeftSlideDir  = aSegment[1].sub(aSegment[0]);
                var capRightSlideDir = aSegment[aSegment.length-2].sub(aSegment[aSegment.length-1]);
                capLeftSlideDir  = cc.pNormalize(capLeftSlideDir);
                capRightSlideDir = cc.pNormalize(capRightSlideDir);
                aSegment[0                ].subToSelf(cc.pMult(capLeftSlideDir,  desc.capOffset));
                aSegment[aSegment.length-1].subToSelf(cc.pMult(capRightSlideDir, desc.capOffset));

                for (var i = 0; i < aSegment.length-1; i++) {
                    var norm1   = cl.p();
                    var norm2   = cl.p();
                    var   length  = cc.pDistance(aSegment[i+1], aSegment[i]);
                    var   repeats = Math.max(1, Math.floor(length / bodyWidth));

                    norm1 = path.getNormal(aSegment, i,   aClosed);
                    norm2 = path.getNormal(aSegment, i+1, aClosed);

                    for (var t = 1; t < repeats+1; t++) {
                        // UnityEngine.Random.seed = (int)(transform.position.x * 100000 + transform.position.y * 10000 + i * 100 + t);
                        bodyID = Math.round(Math.random() * (desc.body.length-1));
                        body   = this.terrainMaterial.toUV( desc.body[bodyID] );
                        var pos1, pos2, n1, n2;

                        pos1 = cl.Point.lerp(aSegment[i], aSegment[i + 1], (t - 1) / repeats);
                        pos2 = cl.Point.lerp(aSegment[i], aSegment[i + 1], t / repeats);
                        n1   = cl.Point.lerp(norm1, norm2, (t - 1) / repeats);
                        n2   = cl.Point.lerp(norm1, norm2, t / repeats);

                        var d    = (body.height / 2) * unitsPerUV.y;
                        var yOff = fill === TerrainFillMode.InvertedClosed ? -desc.yOffset : desc.yOffset;
                        var   v1 = dMesh.addVertex(pos1.x + n1.x * (d + yOff), pos1.y + n1.y * (d + yOff), desc.zOffset, body.x,    fill === TerrainFillMode.InvertedClosed ? body.yMax : body.y);
                        var   v2 = dMesh.addVertex(pos1.x - n1.x * (d - yOff), pos1.y - n1.y * (d - yOff), desc.zOffset, body.x,    fill === TerrainFillMode.InvertedClosed ? body.y    : body.yMax);
                        var   v3 = dMesh.addVertex(pos2.x + n2.x * (d + yOff), pos2.y + n2.y * (d + yOff), desc.zOffset, body.xMax, fill === TerrainFillMode.InvertedClosed ? body.yMax : body.y);
                        var   v4 = dMesh.addVertex(pos2.x - n2.x * (d - yOff), pos2.y - n2.y * (d - yOff), desc.zOffset, body.xMax, fill === TerrainFillMode.InvertedClosed ? body.y    : body.yMax);
                        dMesh.addFace(v1, v3, v4, v2);
                    }
                }
                if (!aClosed)
                {
                    this._addCap(aSegment, desc, -1);
                    this._addCap(aSegment, desc, 1);
                }
                // UnityEngine.Random.seed = tSeed;
            },

            _addCap: function (aSegment, aDesc, aDir) {
                var unitsPerUV  = this._unitsPerUV;
                var fill        = this.fill;

                var index = 0;
                var dir   = cl.p();
                if (aDir < 0) {
                    index = 0;
                    dir   = aSegment[0].sub(aSegment[1]);
                } else {
                    index = aSegment.length-1;
                    dir   = aSegment[aSegment.length-1].sub(aSegment[aSegment.length-2]);
                }
                dir.normalize();
                var norm = path.getNormal(aSegment, index, false);
                var pos  = aSegment[index];
                var    lCap = fill === TerrainFillMode.InvertedClosed ? terrainMaterial.toUV(aDesc.rightCap) : terrainMaterial.toUV(aDesc.leftCap);
                var    rCap = fill === TerrainFillMode.InvertedClosed ? terrainMaterial.toUV(aDesc.leftCap ) : terrainMaterial.toUV(aDesc.rightCap);
                var    yOff = fill === TerrainFillMode.InvertedClosed ? -aDesc.yOffset : aDesc.yOffset;

                if (aDir < 0) {
                    var width =  lCap.width     * unitsPerUV.x;
                    var scale = (lCap.height/2) * unitsPerUV.y;

                    var v1 = dMesh.addVertex(pos.add(dir.mult(width)).add(norm.mult(scale + yOff)), aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed? lCap.xMax : lCap.x, fill === TerrainFillMode.InvertedClosed ? lCap.yMax : lCap.y));
                    var v2 = dMesh.addVertex(pos.add(norm.mult(scale + yOff)), aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? lCap.x : lCap.xMax, fill === TerrainFillMode.InvertedClosed ? lCap.yMax : lCap.y));

                    var v3 = dMesh.addVertex(pos.sub(norm.mult(scale - yOff)), aDesc.zOffset, cc.p(fill === TerrainFillMode.InvertedClosed ? lCap.x : lCap.xMax, fill === TerrainFillMode.InvertedClosed ? lCap.y : lCap.yMax));
                    var v4 = dMesh.addVertex(pos.add(dir.mult(width)).sub(norm.mult(scale - yOff)), aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? lCap.xMax : lCap.x, fill === TerrainFillMode.InvertedClosed ? lCap.y : lCap.yMax));
                    dMesh.addFace(v1, v2, v3, v4);
                } else {
                    var width =  rCap.width     * unitsPerUV.x;
                    var scale = (rCap.height/2) * unitsPerUV.y;

                    var v1 = dMesh.addVertex(pos.add(dir.mult(width)).add(norm.mult(scale + yOff)), aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? rCap.x : rCap.xMax, fill === TerrainFillMode.InvertedClosed ? rCap.yMax : rCap.y));
                    var v2 = dMesh.addVertex(pos.add(norm.mult(scale + yOff)),               aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? rCap.xMax : rCap.x, fill === TerrainFillMode.InvertedClosed ? rCap.yMax : rCap.y));

                    var v3 = dMesh.addVertex(pos.sub(norm.mult(scale - yOff)),               aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? rCap.xMax : rCap.x, fill === TerrainFillMode.InvertedClosed ? rCap.y : rCap.yMax));
                    var v4 = dMesh.addVertex(pos.add(dir.mult(width)).sub(norm.mult(scale - yOff)), aDesc.zOffset, cl.p(fill === TerrainFillMode.InvertedClosed ? rCap.x : rCap.xMax, fill === TerrainFillMode.InvertedClosed ? rCap.y : rCap.yMax));
                    dMesh.addFace(v4, v3, v2, v1);
                }
            },

            _addFill: function (aSkirt) {

                var fillVerts = path.getVerts(this.smoothPath, this.splistDist, this.splitCorners);
                var scale     = cl.p();

                // scale is different for the fill texture
                if (terrainMaterial.fillMaterial !== null)
                {
                    scale = cc.p(
                        terrainMaterial.fillMaterial.width  / this.pixelsPerUnit,
                        terrainMaterial.fillMaterial.height / this.pixelsPerUnit);
                }

                if (aSkirt)
                {
                    var start = fillVerts[0];
                    var end   = fillVerts[fillVerts.length - 1];

                    fillVerts.push(cl.p(end.x, this.fillY));
                    fillVerts.push(cl.p(Math.lerp(end.x, start.x, 0.33), this.fillY));
                    fillVerts.push(cl.p(Math.lerp(end.x, start.x, 0.66), this.fillY));
                    fillVerts.push(cl.p(start.x, this.fillY));
                }

                var offset  = dMesh.vertCount;
                var indices = cl.Triangulator.getIndices(fillVerts, true, this.fill === TerrainFillMode.InvertedClosed);
                for (var i = 0; i < fillVerts.length; i++) {
                    dMesh.addVertex(fillVerts[i].x, fillVerts[i].y, this.fillZ, fillVerts[i].x / scale.x, fillVerts[i].y / scale.y);
                }
                for (var i = 0; i < indices.length; i+=3) {
                    dMesh.addFace(indices[i] + offset,
                                  indices[i+1] + offset,
                                  indices[i+2] + offset);
                }
            }
        });

        this.properties = ["fill", "fillY", "fillZ", "splitCorners", "smoothPath", "splistDist", "pixelsPerUnit", "vertexColor",
                                    "createCollider", "terrainMaterial"];
        this._folder_ =  "terrain";
    }

    var TerrainComponent = Component.extendComponent("TerrainComponent", new Params);


    var _p = TerrainComponent.prototype;
    cl.defineGetterSetter(_p, "terrainMaterial", "_getTerrainMaterial", "_setTerrainMaterial");

    exports.Params = Params;
    exports.Component = TerrainComponent;

});

},{"../../frameworks/cocos2d-html5/cocoslite/component/Component.js":3}],15:[function(require,module,exports){
/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global cl, cc*/

(function(){
    "use strict";
    
    var TerrainDirection = cl.Enum('TerrainDirection', 'Top', 'Left', 'Right', 'Bottom');

    cl.TerrainSegmentDescription = function(applyTo) {
        this.zOffset = 0;
        this.yOffset = 0;
        this.capOffset = 0;
        this.applyTo = applyTo ? applyTo : TerrainDirection.Top;
    };


    cl.TerrainMaterial = function() {
        this._fillMaterialFile = "";
        this._edgeMaterialFile = "";

        this._fillMaterial = null;
        this._edgeMaterial = null;

        this.descriptors = [];

        var self = this;
        TerrainDirection.forEach(function(key, value) {
            self.descriptors.push(new cl.TerrainSegmentDescription(value));
        });
    };

    var _p = cl.TerrainMaterial.prototype;

    _p._getFillMaterial = function(){
        return this._fillMaterial;
    };
    
    _p._setFillMaterial = function(texture){
        if(texture && (cc.isString(texture))){
            if(texture === this._fillMaterialFile) {
                return;
            }

            this._fillMaterialFile = texture;
            this._fillMaterial = cc.textureCache.addImage(texture);
            this._fillMaterial.file = texture;
        }
    };

    _p._getEdgeMaterial = function(){
        return this._edgeMaterial;
    };
    
    _p._setEdgeMaterial = function(texture){
        if(texture && (cc.isString(texture))){
            if(texture === this._edgeMaterialFile) {
                return;
            }

            this._edgeMaterialFile = texture;
            this._edgeMaterial = cc.textureCache.addImage(texture);
            this._edgeMaterial.file = texture;
        }
    };

    _p.getDescriptor = function(aDirection) {
        var descriptors = this.descriptors;
        for (var i = 0; i < descriptors.length; i++) {
            if (descriptors[i].applyTo === aDirection) {
                return descriptors[i];
            }
        }
        if (descriptors.length > 0) {
            return descriptors[0];
        }
        return new cl.TerrainSegmentDescription();
    };

    _p.toUV = function(aPixelUVs) {
        if(!aPixelUVs) {
            return;
        }

        var edgeMaterial = this.edgeMaterial;
        if (edgeMaterial === null) {
            return aPixelUVs;
        }
        var rect = new cc.rect(
            aPixelUVs.x        / edgeMaterial.width,
            aPixelUVs.y        / edgeMaterial.height,
            aPixelUVs.width    / edgeMaterial.width,
            aPixelUVs.height   / edgeMaterial.height);

        rect.xMax = rect.x + rect.width;
        rect.yMax = rect.y + rect.height;
        return rect;
    };

    _p.has = function(aDirection){
        for (var i = 0; i < this.descriptors.length; i++) {
            if (this.descriptors[i].applyTo === aDirection) {
                return true;
            }
        }
        return false;   
    };


    cl.defineGetterSetter(_p, "fillMaterial", "_getFillMaterial", "_setFillMaterial");
    cl.defineGetterSetter(_p, "edgeMaterial", "_getEdgeMaterial", "_setEdgeMaterial");

    cl.TerrainMaterial.prototype.initWithFile = function(file, cb){
        var self = this;

        if(file && this.file !== file){

            this.file = file;
            this.loading = true;

            var url = cc.loader.getUrl(cc.loader.resPath, file);
            cc.loader.loadJson(url, function(err, json){
                if(err) {
                    throw err;
                }

                self.initWithJson(json);
                self.loading = false;

                if(cb) {
                    cb();
                }
            }, cl.SceneManager.tryReviver.bind(cl.SceneManager));
        }
    };

    cl.TerrainMaterial.prototype.initWithJson = function(json){

        this.fillMaterial = json.fillMaterial;
        this.edgeMaterial = json.edgeMaterial;
        this.descriptors  = json.descriptors;

        return this;
    };
})();
},{}],16:[function(require,module,exports){
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

    var Component = require("../../frameworks/cocos2d-html5/cocoslite/component/Component.js");
    
    var TerrainPathComponent = Component.extendComponent("TerrainPathComponent", {
        properties: ["closed", "pathVerts"],
        
        ctor: function () {

            this.closed = false;
            this._pathVerts = [];

            this._super();
        },

        _getPathVerts: function(){
            return this._pathVerts;
        },
        _setPathVerts: function(verts){
            this._pathVerts.splice(0, this._pathVerts.length);

            for(var i=0; i<verts.length; i++){
                this._pathVerts.push(cl.p(verts[i]));
            }
        },

        _getCount: function(){
            return this.pathVerts.length;
        },

        // todo
        reCenter: function() {
//            var center = cc.p(0,0);
//            var transform = this.getComponent("TransformComponent");
//
//            for(var i=0; i<this.pathVerts.length; i++){
//                center.addToSelf(this.pathVerts[i]);
//            }
//            center = center.divide(this.pathVerts.length).add(cc.p(t.x, t.y));
        },

        getVerts: function (aSmoothed, aSplitDistance, aSplitCorners)
        {
            if (aSmoothed) {
                return this.getVertsSmoothed(aSplitDistance, aSplitCorners);
            }
            else {
                return this.getVertsRaw();
            }
        },

        getVertsRaw: function ()
        {
            var result = [];
            for(var i=0; i<this.pathVerts.length; i++){
                result.push(cl.p(this.pathVerts[i]));
            }
            return result;
        },

        getVertsSmoothed: function(aSplitDistance, aSplitCorners)
        {
            var closed = this.closed;
            var result = [];
            if (aSplitCorners)
            {
                var segments = this.getSegments(this.pathVerts);
                if (closed) {
                    this.closeEnds(segments, aSplitCorners);
                }
                
                if (segments.length > 1)
                {
                    for (var i = 0; i < segments.length; i++)
                    {
                        segments[i] = this.smoothSegment(segments[i], aSplitDistance, false);
                        
                        if (i !== 0 && segments[i].length > 0) {
                            segments[i].splice(0,1);
                        }
                        
                        for(var j=0; j<segments[i].length; j++){
                            result.push(segments[i][j]);
                        }
                    }
                }
                else
                {
                    result = this.smoothSegment(this.pathVerts, aSplitDistance, closed);
                    if (closed) {
                        result.push(this.pathVerts[0]);
                    }
                }
            }
            else
            {
                result = this.smoothSegment(this.pathVerts, aSplitDistance, closed);
                if (closed) {
                    result.push(this.pathVerts[0]);
                }
            }
            return result;
        },

        getClosestSeg: function (aPoint)
        {
            var pathVerts = this.pathVerts;
            var closed = this.closed;

            var dist  = 100000000; //float.MaxValue;
            var seg   = -1;
            var count = closed ? pathVerts.length : pathVerts.length-1;
            for (var i = 0; i < count; i++)
            {
                var next  = i === pathVerts.length -1 ? 0 : i + 1;
                var pt    = this.getClosetPointOnLine(pathVerts[i], pathVerts[next], aPoint, true);
                var tDist = cl.Point.sqrMagnitude(aPoint.sub(pt));
                if (tDist < dist)
                {
                    dist = tDist;
                    seg  = i;
                }
            }
            if (!closed)
            {
                var tDist = cl.Point.sqrMagnitude(aPoint.sub(pathVerts[pathVerts.length - 1]));
                if (tDist <= dist)
                {
                    seg = pathVerts.length - 1;
                }
                tDist = cl.Point.sqrMagnitude(aPoint.sub(pathVerts[0]));
                if (tDist <= dist)
                {
                    seg = pathVerts.length - 1;
                }
            }
            return seg;
        },

        // static function
        getSegments: function(aPath)
        {
            var segments = [];
            var currSegment = [];
            for (var i = 0; i < aPath.length; i++)
            {
                currSegment.push(cl.p(aPath[i]));
                if (this.isSplit(aPath, i))
                {
                    segments.push(currSegment);
                    currSegment = [];
                    currSegment.push(cl.p(aPath[i]));
                }
            }
            segments.push(currSegment);
            return segments;
        },

        smoothSegment: function(aSegment, aSplitDistance, aClosed){
            var result = aSegment.slice(0);
            var curr   = 0;
            var count  = aClosed ? aSegment.length : aSegment.length - 1;
            for (var i = 0; i < count; i++)
            {
                var next   = i === count - 1 ? aClosed ? 0 : aSegment.length-1 : i+1;
                var splits = Math.floor(cc.pDistance(aSegment[i], aSegment[next]) / aSplitDistance);
                for (var t = 0; t < splits; t++)
                {
                    var percentage = (t + 1) / (splits + 1);
                    result.splice(curr + 1, 0, this.hermiteGetPt(aSegment, i, percentage, aClosed));
                    curr += 1;
                }
                curr += 1;
            }
            return result;
        },

        hermiteGetPt: function (aSegment, i, aPercentage, aClosed, aTension, aBias)
        {
            aTension = aTension ? aTension : 0;
            aBias    = aBias    ? aBias    : 0;

            var a1 = aClosed ? i - 1 < 0 ? aSegment.length - 2 : i - 1 : Math.clamp(i - 1, 0, aSegment.length - 1);
            var a2 = i;
            var a3 = aClosed ? (i + 1) % (aSegment.length) : Math.clamp(i + 1, 0, aSegment.length - 1);
            var a4 = aClosed ? (i + 2) % (aSegment.length) : Math.clamp(i + 2, 0, aSegment.length - 1);

            return cl.p(
                this.hermite(aSegment[a1].x, aSegment[a2].x, aSegment[a3].x, aSegment[a4].x, aPercentage, aTension, aBias),
                this.hermite(aSegment[a1].y, aSegment[a2].y, aSegment[a3].y, aSegment[a4].y, aPercentage, aTension, aBias));
        },

        hermite: function(v1, v2, v3, v4, aPercentage, aTension, aBias)
        {
            var mu2 = aPercentage * aPercentage;
            var mu3 = mu2 * aPercentage;
            var m0 = (v2 - v1) * (1 + aBias) * (1 - aTension) / 2;
            m0 += (v3 - v2) * (1 - aBias) * (1 - aTension) / 2;
            var m1 = (v3 - v2) * (1 + aBias) * (1 - aTension) / 2;
            m1 += (v4 - v3) * (1 - aBias) * (1 - aTension) / 2;
            var a0 = 2 * mu3 - 3 * mu2 + 1;
            var a1 = mu3 - 2 * mu2 + aPercentage;
            var a2 = mu3 - mu2;
            var a3 = -2 * mu3 + 3 * mu2;

            return (a0 * v2 + a1 * m0 + a2 * m1 + a3 * v3);
        },

        isSplit: function(aSegment, i)
        {
            if (i === 0 || i === aSegment.length - 1) {
                return false;
            }

            return this.getDirection(aSegment[i - 1], aSegment[i]) !== this.getDirection(aSegment[i], aSegment[i + 1]);
        },

        getDirection: function(aOne, aTwo)
        {
            var dir = aOne.sub(aTwo);
            dir = cl.p(-dir.y, dir.x);
            if (Math.abs(dir.x) > Math.abs(dir.y))
            {
                if (dir.x < 0) {
                    return cl.Enum.TerrainDirection.Left;
                }
                else {
                    return cl.Enum.TerrainDirection.Right;
                }
            }
            else
            {
                if (dir.y < 0) {
                    return cl.Enum.TerrainDirection.Bottom;
                }
                else {
                    return cl.Enum.TerrainDirection.Top;
                }
            }
        },

        getDirectionWithSegment: function(aSegment, i, aInvert, aClosed)
        {
            var next = i+1;
            if (i < 0) {
                if (aClosed) {
                    i    = aSegment.length-2;
                    next = 0;
                } else {
                    i=0;
                    next = 1;
                }
            }
            var dir = aSegment[next > aSegment.length-1? (aClosed? aSegment.length-1 : i-1) : next].sub(aSegment[i]);
            dir         = new cc.p(-dir.y, dir.x);
            if (Math.abs(dir.x) > Math.abs(dir.y))
            {
                if (dir.x < 0) {
                    return aInvert ? cl.Enum.TerrainDirection.Right : cl.Enum.TerrainDirection.Left;
                }
                else {
                    return aInvert ? cl.Enum.TerrainDirection.Left  : cl.Enum.TerrainDirection.Right;
                }
            }
            else
            {
                if (dir.y < 0) {
                    return aInvert ? cl.Enum.TerrainDirection.Top    : cl.Enum.TerrainDirection.Bottom;
                }
                else {
                    return aInvert ? cl.Enum.TerrainDirection.Bottom : cl.Enum.TerrainDirection.Top;
                }
            }
        },

        closeEnds: function(aSegmentList, aCorners)
        {
            var start = aSegmentList[0][0];
            var startNext = aSegmentList[0][1];

            var end = aSegmentList[aSegmentList.length - 1][aSegmentList[aSegmentList.length - 1].length - 1];
            var endPrev = aSegmentList[aSegmentList.length - 1][aSegmentList[aSegmentList.length - 1].length - 2];

            if (aCorners === false) {
                aSegmentList[0].push(start);
                return true;
            }

            var endCorner = this.getDirection(endPrev, end) !== this.getDirection(end, start);
            var startCorner = this.getDirection(end, start) !== this.getDirection(start, startNext);

            if (endCorner && startCorner)
            {
                var lastSeg = [];
                lastSeg.push(end);
                lastSeg.push(start);

                aSegmentList.push(lastSeg);
            }
            else if (endCorner && !startCorner)
            {
                aSegmentList[0].splice(0, 0, end);
            }
            else if (!endCorner && startCorner)
            {
                aSegmentList[aSegmentList.length - 1].push(start);
            }
            else
            {
                aSegmentList[0].splice(0, 0, aSegmentList[aSegmentList.length - 1]);
                aSegmentList.remove(aSegmentList.length - 1);
            }
            return true;
        },

        getNormal: function (aSegment, i,  aClosed) {
            var curr = aClosed && i === aSegment.length - 1 ? aSegment[0] : aSegment[i];

            // get the vertex before the current vertex
            var prev = cl.p();
            if (i-1 < 0) {
                if (aClosed) {
                    prev = aSegment[aSegment.length-2];
                } else {
                    prev = curr.sub(aSegment[i+1].sub(curr));
                }
            } else {
                prev = aSegment[i-1];
            }

            // get the vertex after the current vertex
            var next = cl.p();
            if (i+1 > aSegment.length-1) {
                if (aClosed) {
                    next = aSegment[1];
                } else {
                    next = curr.sub(aSegment[i-1].sub(curr));
                }
            } else {
                next = aSegment[i+1];
            }

            prev = prev.sub(curr);
            next = next.sub(curr);

            prev.normalize();
            next.normalize();

            prev = new cl.p(-prev.y, prev.x);
            next = new cl.p(next.y, -next.x);

            var norm = (prev.add(next)).divide(2);
            norm.normalize();

            norm.y *= -1;
            norm.x *= -1;

            return norm;
        },

        getClosetPointOnLine: function(aStart, aEnd, aPoint, aClamp)
        {
            var AP = aPoint.sub(aStart);
            var AB = aEnd.sub(aStart);
            var ab2 = AB.x*AB.x + AB.y*AB.y;
            var ap_ab = AP.x*AB.x + AP.y*AB.y;
            var t = ap_ab / ab2;
            if (aClamp) {
                 if (t < 0) {
                     t = 0;
                 }
                 else if (t > 1) {
                     t = 1;
                 }
            }
            var Closest = aStart.add(AB.mult(t));
            return Closest;
        },

        _folder_:  "terrain"
    });

    var _p = TerrainPathComponent.prototype;

    cl.defineGetterSetter(_p, "count", "_getCount");
    cl.defineGetterSetter(_p, "pathVerts", "_getPathVerts", "_setPathVerts");

});

},{"../../frameworks/cocos2d-html5/cocoslite/component/Component.js":3}],17:[function(require,module,exports){
/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global cl*/

(function(){
    "use strict";
    
    cl.Triangulator = {};

    cl.Triangulator.getIndices = function (aPoints, aTreatAsPath, aInvert) {
        var tris   = [];
        var bounds = cl.Triangulator.getBounds(aPoints);

        // it's easiest if we add in some all-encompassing tris, and then remove them later
        aPoints.push(cl.p(bounds.x - (bounds.z - bounds.x)*1, bounds.w - (bounds.y - bounds.w)*1)); // 4
        aPoints.push(cl.p(bounds.z + (bounds.z - bounds.x)*1, bounds.w - (bounds.y - bounds.w)*1)); // 3
        aPoints.push(cl.p(bounds.z + (bounds.z - bounds.x)*1, bounds.y + (bounds.y - bounds.w)*1)); // 2
        aPoints.push(cl.p(bounds.x - (bounds.z - bounds.x)*1, bounds.y + (bounds.y - bounds.w)*1)); // 1
        tris.push(aPoints.length - 1);
        tris.push(aPoints.length - 2);
        tris.push(aPoints.length - 3);
        tris.push(aPoints.length - 1);
        tris.push(aPoints.length - 3);
        tris.push(aPoints.length - 4);

        // add in all the vers of the path
        for (var i = 0; i < aPoints.length - 4; i += 1)
        {
            var tri = cl.Triangulator.getSurroundingTri(aPoints, tris, aPoints[i]);

            if (tri !== -1)
            {
                var t1 = tris[tri];
                var t2 = tris[tri + 1];
                var t3 = tris[tri + 2];

                tris[tri] = t1;
                tris[tri+1] = t2;
                tris[tri+2] = i;

                tris.push(t2);
                tris.push(t3);
                tris.push(i);

                tris.push(t3);
                tris.push(t1);
                tris.push(i);

                cl.Triangulator.edgeFlip(aPoints, tris, tri);
                cl.Triangulator.edgeFlip(aPoints, tris, tris.length-3);
                cl.Triangulator.edgeFlip(aPoints, tris, tris.length-6);
            }
        }

        // hacky solution to the stack overflow on the recursive edge flipping I was getting
        for (var i = 0; i < tris.length*2; i+=3) {
            cl.Triangulator.edgeFlip(aPoints,tris, i%tris.length);
        }

        // remove the encompassing triangles
        if (!aInvert) {
            aPoints.splice(aPoints.length - 4, 4);
        }
        var result = [];
        var invertMesh = aInvert ? 0 : 1;
        for (var i=0;i<tris.length;i+=3) {
            if (aInvert || 
               (tris[i  ] < aPoints.length &&
                tris[i+1] < aPoints.length &&
                tris[i+2] < aPoints.length)) {

                var center = aPoints[tris[i]].add( aPoints[tris[i+1]] ).add( aPoints[tris[i+2]] ).divide(3);
                if (!aTreatAsPath || (cl.Triangulator.getSegmentsUnder(aPoints, center.x, center.y, aInvert).length/2) % 2 === invertMesh) {
                    if (cl.Triangulator.isClockwise(aPoints[tris[i]], aPoints[tris[i+1]], aPoints[tris[i+2]])) {
                        result.push(tris[i+2]);
                        result.push(tris[i+1]);
                        result.push(tris[i  ]);
                    } else {
                        result.push(tris[i  ]);
                        result.push(tris[i+1]);
                        result.push(tris[i+2]);
                    }
                }
            }
        }

        return result;
    };

    cl.Triangulator.getSegmentsUnder = function (aPath, aX, aY, aIgnoreLast) {
        var result = [];
        var off = aIgnoreLast ? 4 : 0;
        for (var i=0;i<aPath.length-off;i+=1) {
            var next = i+1 >= aPath.length-off ? 0 : i+1;
            var min = aPath[i].x < aPath[next].x ? i : next;
            var max = aPath[i].x > aPath[next].x ? i : next;

            if (aPath[min].x <= aX && aPath[max].x > aX) {
                var height = Math.lerp(aPath[min].y, aPath[max].y, (aX - aPath[min].x) / (aPath[max].x - aPath[min].x));
                if (aY > height) {
                    result.push(min);
                    result.push(max);
                }
            }
        }

        return result;
    };
    
    /// <summary>
    /// Gets a bounding rectangle based on the given points
    /// </summary>
    /// <param name="aPoints">List of points.</param>
    /// <returns>x = left, y = top, z = right, w = bottom</returns>
    cl.Triangulator.getBounds = function (aPoints) {
        if (aPoints.length <=0) {
            return {x:0, y:0, z:1, w:1};
        }
        
        var left   = aPoints[0].x;
        var right  = aPoints[0].x;
        var top    = aPoints[0].y;
        var bottom = aPoints[0].y;

        for (var i=0; i<aPoints.length; i+=1) {
            if (aPoints[i].x < left  ) { left   = aPoints[i].x; }
            if (aPoints[i].x > right ) { right  = aPoints[i].x; }
            if (aPoints[i].y > top   ) { top    = aPoints[i].y; }
            if (aPoints[i].y < bottom) { bottom = aPoints[i].y; }
        }
        return {x:left, y:top, z:right, w:bottom};
    };
    
    /// <summary>
    /// Is the given point inside a 2D triangle?
    /// </summary>
    /// <param name="aTri1">Triangle point 1</param>
    /// <param name="aTri2">Triangle point 2</param>
    /// <param name="aTri3">Triangle point 9001</param>
    /// <param name="aPt">The point to test!</param>
    /// <returns>IS IT INSIDE YET?</returns>
    cl.Triangulator.ptInTri = function (aTri1,  aTri2, aTri3, aPt) {
        var as_x = aPt.x - aTri1.x;
        var as_y = aPt.y - aTri1.y;
        var  s_ab = (aTri2.x - aTri1.x) * as_y - (aTri2.y - aTri1.y) * as_x > 0;

        if ((aTri3.x - aTri1.x) * as_y - (aTri3.y - aTri1.y) * as_x > 0 === s_ab) { return false; }
        if ((aTri3.x - aTri2.x) * (aPt.y - aTri2.y) - (aTri3.y - aTri2.y) * (aPt.x - aTri2.x) > 0 !== s_ab) { return false; }

        return true;
    };
    /// <summary>
    /// Gets the point where two lines intersect, really useful for determining the circumcenter.
    /// </summary>
    /// <param name="aStart1">Line 1 start</param>
    /// <param name="aEnd1">Line 1 llamma</param>
    /// <param name="aStart2">Line 2 start</param>
    /// <param name="aEnd2">Line 2 end</param>
    /// <returns>WHERE THEY INTERSECT</returns>
    cl.Triangulator.lineIntersectionPoint = function (aStart1, aEnd1, aStart2, aEnd2)
    {
        var A1 = aEnd1  .y - aStart1.y;
        var B1 = aStart1.x - aEnd1  .x;
        var C1 = A1 * aStart1.x + B1 * aStart1.y;

        var A2 = aEnd2  .y - aStart2.y;
        var B2 = aStart2.x - aEnd2  .x;
        var C2 = A2 * aStart2.x + B2 * aStart2.y;

        var delta = A1*B2 - A2*B1;

        return cl.p( (B2*C1 - B1*C2)/delta, (A1*C2 - A2*C1)/delta);
    };
    /// <summary>
    /// Determines if these points are in clockwise order.
    /// </summary>
    cl.Triangulator.isClockwise = function (aPt1, aPt2, aPt3) {
        return (aPt2.x - aPt1.x)*(aPt3.y - aPt1.y) - (aPt3.x - aPt1.x)*(aPt2.y - aPt1.y) > 0;
    };



    // private function

    cl.Triangulator.getCircumcenter = function (aPoints, aTris, aTri) {
        // find midpoints on two sides
        var midA = aPoints[aTris[aTri  ]].add(aPoints[aTris[aTri+1]]).divide(2);
        var midB = aPoints[aTris[aTri+1]].add(aPoints[aTris[aTri+2]]).divide(2);
        // get a perpendicular line for each midpoint
        var dirA = aPoints[aTris[aTri  ]].sub(aPoints[aTris[aTri+1]]); dirA = cl.p(dirA.y, -dirA.x);
        var dirB = aPoints[aTris[aTri+1]].sub(aPoints[aTris[aTri+2]]); dirB = cl.p(dirB.y, -dirB.x);
        // the intersection should give us the circumcenter
        return cl.Triangulator.lineIntersectionPoint(midA, midA.add(dirA), midB, midB.add(dirB));
    };

    cl.Triangulator.edgeFlip = function (aPoints, aTris, aTri) {
        var xyz      = [];
        var abc      = [];
        var shared   = [];
        var opposing = [];

        xyz.push ( aTris[aTri]   );
        xyz.push ( aTris[aTri+1] );
        xyz.push ( aTris[aTri+2] );
        var center = cl.Triangulator.getCircumcenter(aPoints, aTris, aTri);
        var distSq = cl.Point.sqrMagnitude(aPoints[xyz[0]].sub(center));

        for (var i = 0; i < aTris.length; i+=3) {
            if (i === aTri) { continue; }

            shared   = [];
            opposing = [];
            abc      = [];
            abc.push (aTris[i]);
            abc.push (aTris[i+1]);
            abc.push (aTris[i+2]);

            for (var triID1 = 0; triID1 < 3; triID1++) {
                var count = 0;
                for (var triID2 = 0; triID2 < 3; triID2++) {
                    if (xyz[triID1] === abc[triID2]) {
                        shared.push(xyz[triID1]);
                        count += 1;
                    }
                }
                if (count === 0) {
                    opposing.push (xyz[triID1]);
                }
            }
            if (opposing.length === 1 && shared.length === 2) {
                for (var triID1 = 0; triID1 < 3; triID1++) {
                    if (abc[triID1] !== shared[0] &&
                        abc[triID1] !== shared[1] &&
                        abc[triID1] !== opposing[0]) {
                        opposing.push (abc[triID1]);
                        break;
                    }
                }
            }

            if (opposing.length === 2 && shared.length === 2) {
                var sqr = cl.Point.sqrMagnitude(aPoints[opposing[1]].sub(center));
                // cc.log("sqr : %f   %f", sqr, distSq);
                if(sqr < distSq) {

                    aTris[aTri  ] = opposing[0];
                    aTris[aTri+1] = shared  [0];
                    aTris[aTri+2] = opposing[1];

                    aTris[i  ] = opposing[1];
                    aTris[i+1] = shared  [1];
                    aTris[i+2] = opposing[0];

                    //EdgeFlip(aPoints, aTris, aTri);
                    //EdgeFlip(aPoints, aTris, i);
                    return true;
                }
            }
        }
        return false;
    };

    cl.Triangulator.getSurroundingTri = function (aPoints, aTris, aPt) {
        for (var i=0; i<aTris.length; i+=3) {
            if (cl.Triangulator.ptInTri(aPoints[aTris[i]],
                        aPoints[aTris[i+1]],
                        aPoints[aTris[i+2]],
                        aPt )) {
                return i;
            }
        }
        return -1;
    };


})();
},{}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]);
