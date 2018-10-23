const URLReader = new URLSearchParams(window.location.search);
const DEBUG = false; {
  let fallback = console.log.bind(console);
  console.log = function() {
    if (DEBUG) fallback.apply(console, arguments)
  }
}

function chooseElement(probabilities) {
  let currVal = probabilities.def;
  for (i = 0; i < 50; i++) {
    if (currVal == probabilities.def && Math.random() <= probabilities.allProbs[i]) {
      currVal = i;
    }
  }
  return currVal;
}

let platformerFactory = function(list, renderSpot /*renderSpot is either an empty container or an object of two premade canvas elements, 3 and 2*/ , levelData) {
  var levelArr;
  var ret = {};
  var states = {};
  var renderContexts = {
    3: {
      canvas: undefined,
      context: undefined
    },
    2: {
      canvas: undefined,
      context: undefined
    }
  };
  var blockColor;
  var dims = {
    x: {
      totalBlocks: 50,
      blockSize: 10,
      playerSize: 8,
      padding: 1,
      vel: 0
    },
    y: {
      vel: 0
    },
    z: {
      vel: 0
    }
  }; //Each dimension has a totalBlocks, a blockSize, a playerSize, a playerPosition, a maxVel, a startPosition, a padding when spawning and a velocity.
  var platformColor = null;
  var physicsInterval = null;
  var tempBlocks = []; //Blocks that change every restart of the game, each has an id and a function to run - see below in the if statement
  var flat = false; //2D or 3D (only affects rendering)


  ret.changeOpacity = function(coords, opacity) {
    if (opacity < 1 && opacity > 0 && opacity instanceof float && coords.hasOwnProperty("x") && coords.hasOwnProperty("y")) {
      states[coords.y][coords.x].opacity = opacity;
    }
  }

  ret.updateLevel = function(newLevel) {
    if (newLevel instanceof String) {
      newLevel = ret.deserialize(newLevel);
    } else if (!(newLevel instanceof Array)) {
      throw new TypeError("Level must be a level string or a level array.");
    }
    newDims = getDims(newLevel);
    dims.x.totalBlocks = newDims[1];
    dims.y.totalBlocks = newDims[2];
    dims.z.totalBlocks = newDims[0];
    levelArr = newLevel;
    //Restart game:

  }

  ret.end = function(str) { //str is a value to display when the game is over
    if (physicsInterval) {
      clearInterval(physicsInterval);
      physicsInterval = null;
      teleport(checkpoint);
      if (str) {
        notificationText(str);
      }
    }
  }

  ret.start = function() {
    if (physicsInterval) {
      ret.end()
    }
    physicsInterval = setInterval(physicsCycle, 50);
  }

  ret.serialize = function(arr) {
    if (!arr) {
      arr = levelArr;
    }
    return arr.map(i => {
      return i.join("")
    }).join(",");
  }
  ret.deserialize = function(str) { //Also, do dimension testing
    if (str) {
      return arr.map(i => {
        return i.split("")
      }).split(",");
    } else {
      return levelArr;
    }
  }

  ret.initPlatformer = function(l, rs, ld) {
    if (ld) {
      if (ld.hasOwnProperty("x")) {
        dims.x = ld.x;
      }
      if (ld.hasOwnProperty("y")) {
        dims.y = ld.y;
      }
      if (ld.hasOwnProperty("z")) {
        dims.z = ld.z;
      }
      if (ld.hasOwnProperty("platformColor")) {
        platformColor = ld.platformColor;
      }
      if (ld.hasOwnProperty('tempBlocks')) {
        tempBlocks = ld.tempBlocks;
      } else {
        tempBlocks = [{
          id: 7,
          onReset: (states, lvlArr, methods) => {
            //Iterate through the loop, reset all coins with an opacity of 0 to existing
          }
        }]
      }
      if (ld.hasOwnProperty("isFlat") && ld.isFlat) {
        flat = true;
      }
    }
    if (rs) {
      for (i = 2; i < 4; i++) {
        if (rs.hasOwnProperty(i)) {
          let thisDimInfo = rs[i]; //This is an object, to allow for potential future usage of both context and element, or extra settings
          if (thisDimInfo.hasOwnProperty("canvas") && thisDimInfo.canvas instanceof HTMLElement) {
            renderContexts[i].canvas = thisDimInfo.canvas;
            renderContexts[i].context = thisDimInfo.canvas.getContext({
              3: "webgl",
              2: "2d"
            } [i]); //Not necessary for threeJS, just for fun
          }
        }
      }
    }
  }

  ret.setRender = function(do3D) {
    if (do3D) {
      ret.render = render3D;
    } else {
      ret.render = render2D;
    }
  }

  function animate() {
    if (physicsInterval) {
      requestAnimationFrame(animate);
    }

    ret.render();

  }

  function render3D() {
    if (isSetup) {
      sphere.position.set(x - 250, -y + 250, z);
      renderer.render(scene, camera);
    } else {
      throw ValueError("Undefined context for 3D rendering");
    }
  }

  function getDims(arr) { //Takes in a matrix, just for speed - Can be converted to a 3D tensor
    allDims = [1]; //Starts with a z-dimension of 1
    if (arr instanceof Array) {
      allDims.push(arr.length);
      for (i in arr) {
        if (allDims.length < 2) allDims.push(arr[i].length)
        if (arr[i].length != allDims[2]) {
          throw ValueError("Irregular matrix dimensions.");
        }
      }
    } else {
      throw TypeError("Argument must be an Array.");
    }
  }


  function makeRandom(probabilities, dimensions) {
    if (probabilities) {
      let allPossibilities = Object.keys(probabilities);
      let newArr = Array(dimensions.y).fill(0).map(i => {
        return Array(dimensions.x).fill(0).map(i => {
          return chooseElement(probabilities);
        })
      });
      return newArr;
    } else {
      //Run defaults
      return ret.makeRandom({
        def: 0,
        allProbs: [0, 0.25, 1 / 9, 1 / 15]
      }, {
        x: 50,
        y: 50
      });
    }
  }

  function physicsCycle() {
    //Do physics stuff
  }

  function resetLevel() {
    // Reset coins and other temp things
    tempBlocks.map(i => {
      i.onReset(levelState, levelArr, ret)
    });
  }

  function runMapGen(numCycles, mapGenName, toRun) {
    if (mapGenName) {
      //For a custom mapgen--later
      return toRun;
    } else {
      for (i = 0; i < numCycles; i++) {
        toRun = runCavingCycle(toRun);
      }
      return toRun;
    }
  }

  function teleport(location, isBlocks) {
    locs = Object.keys(location);
    for (i in locs) {
      if (location.hasOwnProperty(locs[i])) {
        dims[locs[i]].position = (isBlocks ? location[locs[i]] * dims[locs[i]].blockHeight : location[locs[i]])
      }
    }
    //Do optional 3D stuff, if the user has selected 3D mode
  }
  ret.initPlatformer(list, renderSpot, levelData);
  ret.setRender(true);
  ret.start();
  return ret;
  // console.log(getDims([[0, 0, 0], [0, 0, 0]]))
}

/*Todo:
- Rewrite code, make it nice
- Allow 2D, 3D rendering - In 2D, just don't use threjs and use the 2D canvas to draw it all
*/