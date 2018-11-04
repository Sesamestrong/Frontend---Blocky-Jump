const URLReader = new URLSearchParams(window.location.search);;
const RGB = /rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/i;
const HEX = /([0-9abcdef]{2})([0-9abcdef]{2})([0-9abcdef]{2})/i
/*
{
  let fallback = console.log.bind(console);
  console.log = function() {
    fallback.apply(console, arguments)
  }
}*/

function hexToRGB(hex) { //Takes seed (random number) and generates a hexadecimal color code from it (this is for the levels)
  hi = hex.toString(16).padStart(6, "0");
  theArr = HEX.exec(hi);
  theArr.shift()
  return ["rgb("].concat(theArr).reduce((old, next) => old + parseInt(theArr.shift(), 16).toString() + ", ").replace(/, $/g, ")");

}



function addOpacities(rgb, opacity) {
  if (RGB.exec(rgb)) {
    let hi = (opacity < 1 ? rgb.replace(RGB, "rgba($1, $2, $3, " + opacity + ")") : rgb);
    return hi;
  } else if (typeof rgb == "number") {
    rgb = hexToRGB(rgb);
    return addOpacities(rgb, opacity);
  } else {}

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

var platformerFactory = function(list, renderSpot /*renderSpot is either an empty container or an object of two premade canvas elements, 3 and 2*/ , levelData) {

  var levelArr;
  var ret = {};
  var states = {};
  var checkpoint = [];
  var renderContexts = {
    3: {
      canvas: undefined,
      context: undefined
    },
    2: {
      canvas: undefined,
      context: undefined
    },
    notifications: {
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
      vel: 0,
      playerPosition: 250
    },
    y: {
      totalBlocks: 50,
      blockSize: 10,
      playerSize: 8,
      padding: 1,
      vel: 0,
      playerPosition: 250
    },
    z: {
      vel: 0
    }
  }; //Each dimension has a totalBlocks, a blockSize, a playerSize, a playerPosition, a maxVel, a startPosition, a padding when spawning, a screenSize and a velocity.
  var physicsInterval = null;
  var blockData = []; //Blocks that change every restart of the game, each has an id and a function to run - see below in the if statement
  var flat = false; //2D or 3D (only affects rendering)


  ret.changeOpacity = function(coords, opacity) {
    if (opacity < 1 && opacity > 0 && opacity instanceof float && coords.hasOwnProperty("x") && coords.hasOwnProperty("y")) {
      states[coords.y][coords.x].opacity = opacity;
    }
  }

  ret.updateLevel = function(newLevel) {
    if (typeof newLevel == 'string') {
      newLevel = ret.deserialize(newLevel);
    } else if (!(newLevel instanceof Array)) {
      throw "Level must be a level string or a level array.";
    }
    newDims = getDims(newLevel);
    dims.x.totalBlocks = newDims[1];
    dims.y.totalBlocks = newDims[2];
    dims.z.totalBlocks = newDims[0];
    levelArr = newLevel;
    //Restart game:

  }

  ret.end = function(str) { //str is a value to display when the game is over
    if (physicsInterval || true) {
      clearInterval(physicsInterval);
      physicsInterval = null;
      teleport(checkpoint);
      if (str) {
        notificationText(str, renderContexts.notifications.context);
        console.log("hmm")
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
    if (typeof str == 'string') {
      let theArray = str.split(",").map((i) => {
        return i.split("").map((e) => {
          return parseInt(e);
        })
      })
      return theArray
    } else {
      return levelArr;
    }
  }

  ret.initPlatformer = function(l, rs, ld) {
    if (l) {
      ret.updateLevel(l)
    } else {
      throw "Level list is undefined and random levels are not yet implemented."
    }
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
      if (ld.hasOwnProperty('blockData')) {
        blockData = ld.blockData;
      } else {
        blockData = {
          7: {
            name: "Coin",
            onReset: (lvlArr, methods) => {
              //Iterate through the loop, reset all coins with an opacity of 0 to existing
              states.Coin = {
                opacity: 0.7,
                collected: [],
              }
            },
            onPhysics: (states, lvlArr, methods) => {
              let myCols = Object.values(getCollisions(lvlArr, true));
              for (i in myCols) {
                console.log(myCols)
                if (getBlock(myCols[i]) == 7 && !states.Coin.collected.includes(myCols[i])) {
                  collected.push(myCols[i]);
                }
              }
            },
            render: {
              2: (lvlArr, methods, coords, blockData) => {
                //Draw using opacity state for coins
                let wc = (states.Coin || {
                  collected: []
                }).collected.includes(coords) ? blockData[7].collected : blockData[7].default
                let sc = screenDims(2);
                makeRect(addOpacities(wc.color, wc.opacity || 1.0), [Math.floor(sc.x / 2) - dims.x.playerPosition + coords.x * dims.x.blockSize, Math.floor(sc.y / 2) - dims.y.playerPosition + coords.y * dims.y.blockSize, dims.x.blockSize, dims.y.blockSize], renderContexts[2].context);
              },
              3: (lvlArr, methods, coords, blockData) => {
                //Later
              }
            },
            default: {
              color: 0xFFFFF00,
              opacity: 0.7
            },
            collected: {
              color: 0x000000,
              opacity: 0
            }
          },
          1: {
            name: "Stone",
            onPhysics: (lvlArr, methods) => {
              //Do collision with player
              console.log(dims)
              let myCols = getCollisions(lvlArr, true, {
                x: dims.x.vel,
                y: dims.y.vel
              });
              if (dims.y.velocity > 0 && (getBlock(myCols.dl) == 1 || getBlock(myCols.dr) == 1)) {
                dims.y.playerPosition = myCols.dr.y * dims.y.blockSize - 1;
                dims.y.velocity = 0;
              } else if (dims.y.velocity < 0 && (getBlock(myCols.ul) == 1 || getBlock(myCols.ur) == 1)) {
                dims.y.playerPosition = myCols.ul.y * dims.y.blockSize + dims.y.blockSize + 1;
                dims.y.velocity = 0;
              }
            },
            defaultColor: 0x000000,
            defaultOpacity: 1.0
          },
          0: {
            name: "Air",
            onPhysics: (lvlArr, methods) => {
              //Nothing
            },
            defaultColor: "rgb(50,50,50)",
            defaultOpacity: 0.2
          },
          2: {
            name: "Water",
            onPhysics: (lvlArr, methods) => {
              //Let the player swim
            },
            defaultColor: 0x0022FF,
            defaultOpacity: 0.5
          },
          3: {
            name: "Lava",
            onPhysics: (lvlArr, methods) => {
              let closeBlocks = getCollisions(lvlArr);
              if (Object.values(closeBlocks).includes(3)) {
                methods.end("You lose! Click to restart.")
              }
            },
            defaultColor: 0xFF0000,
            defaultOpacity: 0.6
          },
          4: {
            name: "Win",
            onPhysics: (lvlArr, methods) => {
              let closeBlocks = getCollisions(lvlArr);
              //Make them win
              if (Object.values(closeBlocks).includes(4)) {
                methods.end("You win! Click to restart.");
              }
            },
            defaultColor: 0x00FF00,
            defaultOpacity: 1.0
          },
          5: {
            name: "Trampoline",
            onPhysics: (lvlArr, methods) => {
              //Make the player jump if touching a trampoline
            },
            defaultColor: 0x888800,
            defaultOpacity: 1.0
          },
          6: {
            name: "Checkpoint",
            onPhysics: (lvlArr, methods) => {
              //Set checkpoints
            },
            defaultColor: 0xFF00FF,
            defaultOpacity: 0.8
          },
          8: {
            name: "Physics",
            onReset: (lvlArr, methods) => {
              dims.x.velocity = 0;
              dims.y.velocity = 0;
            }
          }
        }
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
      renderContexts.notifications = rs.notifications;
      renderContexts.notifications.context = renderContexts.notifications.canvas.getContext("2d")
    }
    checkpoint = [];
  }

  ret.setRender = function(do3D, headless) {
    if (do3D) {
      ret.render = render3D;
    } else {
      ret.render = render2D;
    }
    isSetup = true;
    if (headless) {
      ret.render = () => { /*Do nothing; headless mode does not include rendering*/ }
      isSetup = false;
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
      renderContexts[3].objects.player.position.set(x - 250, -y + 250, z);
      renderer.render(scene, camera);
    } else {
      throw "Undefined context for 3D platformer";
    }
  }

  function screenDims(specification) {
    return {
      x: renderContexts[specification].canvas.width,
      y: renderContexts[specification].canvas.height
    };
  }

  function getCollisions(lvlArr, vals, offsets) {
    let whichOption = (vals ? getBlock : a => a)
    offsets = offsets || {
      x: 0,
      y: 0
    };
    console.log(offsets)
    return {
      ul: getBlock(getMods({
        x: {
          fullSize: dims.x.playerPosition + offsets.x + 1,
          unitSize: dims.x.blockSize
        },
        y: {
          fullSize: dims.y.playerPosition + offsets.y + 1,
          unitSize: dims.y.blockSize
        }
      }), lvlArr),
      ur: getBlock(getMods({
        x: {
          fullSize: dims.x.playerPosition + dims.x.playerSize + offsets.x - 1,
          unitSize: dims.x.blockSize
        },
        y: {
          fullSize: dims.y.playerPosition + offsets.y + 1,
          unitSize: dims.y.blockSize
        }
      }), lvlArr),
      dr: getBlock(getMods({
        x: {
          fullSize: dims.x.playerPosition + dims.x.playerSize + offsets.x - 1,
          unitSize: dims.x.blockSize
        },
        y: {
          fullSize: dims.y.playerPosition + dims.y.playerSize + offsets.y - 1,
          unitSize: dims.y.blockSize
        }
      }), lvlArr),
      dl: getBlock(getMods({
        x: {
          fullSize: dims.x.playerPosition + offsets.x + 1,
          unitSize: dims.x.blockSize
        },
        y: {
          fullSize: dims.y.playerPosition + dims.y.playerSize + offsets.y - 1,
          unitSize: dims.y.blockSize
        }
      }), lvlArr)
    }

  }

  function getBlock(indices, list) {
    console.log("getblock " + list)
    listDims = getDims(list);
    if (indices.x >= listDims[1] || indices.y >= listDims[0] || indices.x <= 0) {
      return 3; //Lava, so that if the player touches, they die
    } else if (indices.y <= 0) {
      return 4;
    } else {
      console.log(list, indices)
      return list[indices.y][indices.x]; //Otherwise normal block
    }
  }

  function clearCanvas(whichCanvas) {
    whichCanvas.width = whichCanvas.width;
    whichCanvas.height = whichCanvas.height;
  }

  function makeRect(color, size, context) {
    if (typeof color != "string") color = hexToRGB(color);
    context.fillStyle = color;
    context.fillRect(size[0], size[1], size[2], size[3]);
  }

  function notificationText(toDisplay, context) {
    if (toDisplay) {
      clearCanvas(context.canvas);
      currentText = toDisplay;
      makeRect("rgba(255,255,255,0.8)", [0, window.innerHeight / 4, window.innerWidth, window.innerHeight / 2], renderContexts.notifications.context)
      context.fillStyle = 0x000000
      context.font = parseInt(window.innerWidth / 20) + "px Helvetica";
      context.fillText(toDisplay, window.innerWidth / 2 - parseInt(window.innerWidth / 90) * toDisplay.length, window.innerHeight / 2);
    }
  }

  function render2D() {
    if (isSetup) {
      let count1 = -1;
      let count2 = -1;
      let screenDims = {
        x: renderContexts[2].canvas.width,
        y: renderContexts[2].canvas.height
      };
      let levelDims = {
        x: dims.x.totalBlocks * dims.x.blockSize,
        y: dims.y.totalBlocks * dims.y.blockSize
      };
      let myLocs = getCollisions(levelArr);
      renderContexts[2].context.fillStyle = "#FFFFFF";
      renderContexts[2].context.fillRect(0, 0, screenDims.x, screenDims.y);
      for (i = -1; i <= dims.y.totalBlocks; i++) {
        count1++;
        count2 = -1;
        for (
          e = -1; e <= dims.x.totalBlocks; e++
        ) {
          count2++;
          if (i >= 0 && i < dims.y.totalBlocks && e >= 0 && e < dims.x.totalBlocks) {
            if (blockData[levelArr[i][e]]) {
              let theData = blockData[levelArr[i][e]];
              if (theData.hasOwnProperty("render")) {
                theData.render[2](levelArr, false, {
                  x: e,
                  y: i
                }, blockData); //Setup later
              } else if (theData.hasOwnProperty("default")) {
                makeRect(addOpacities(theData.default.color, theData.default.opacity || 1.0), [Math.floor(screenDims.x / 2) - dims.x.playerPosition + e * dims.x.blockSize, Math.floor(screenDims.y / 2) - dims.y.playerPosition + i * dims.y.blockSize, dims.x.blockSize, dims.y.blockSize], renderContexts[2].context);
              } else {}
            } else {
              renderContexts[2].context.fillStyle = 'rgb(150,150,150)';
            }
          }
        }
        makeRect("rgb(100,100,100)", [Math.floor(screenDims.x / 2), Math.floor(screenDims.y / 2), dims.x.playerSize, dims.y.playerSize], renderContexts[2].context)

      }
    } else {
      throw "Undefined context for 2D platformer--Headless mode is not yet supported";
    }
  }

  function getDims(arr) { //Takes in a matrix, just for speed - Can be converted to a 3D tensor
    allDims = [1]; //Starts with a z-dimension of 1
    if (arr instanceof Array) {
      allDims.push(arr.length);
      for (i in arr) {
        if (allDims.length <= 2) allDims.push(arr[i].length)
        if (arr[i].length != allDims[2]) {
          throw "Irregular matrix dimensions.";
        }
      }
      return allDims;
    } else {
      throw "Argument must be an Array.";
    }
  } //Todo: convert to an actual Array method


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
    Object.values(blockData).map(i => {
      if (i.hasOwnProperty("onPhysics")) {
        i.onPhysics(states, levelArr, ret);
      }
    })
  }

  function getMods(blocksToGet) {
    if (blocksToGet instanceof Object) {
      let toReturn = {
        error: []
      };
      let allBlockNames = Object.keys(blocksToGet);
      for (i in allBlockNames) {
        if (blocksToGet[allBlockNames[i]] instanceof Object && blocksToGet[allBlockNames[i]].hasOwnProperty("fullSize") && blocksToGet[allBlockNames[i]].hasOwnProperty("unitSize")) {
          toReturn[allBlockNames[i]] = Math.floor(blocksToGet[allBlockNames[i]].fullSize / blocksToGet[allBlockNames[i]].unitSize);
        } else {
          toReturn.error.push("Error when calculating block of " + allBlockNames[i] + ": Each dimension query must be of shape {fullSize:____, unitSize:_____} where both fullSize and unitSize are integers")
        }
      }
      return toReturn;
    }
    throw "Error: Object must be of shape {myLocs.ul.x: {fullSize:dims.x.playerPosition,unitSize:dims.x.blockSize},myLocs.ul.y:...}"

  }

  function resetLevel() {
    // Reset coins and other temp things
    Object.values(blockData).map(i => {
      i.onReset(states, levelArr, ret);
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
  }

  ret.initPlatformer(list, renderSpot, levelData);
  ret.setRender(false);
  //ret.start();
  ret.getDims = () => {
    return dims;
  }
  ret.drawRect = function() {
    makeRect("rgb(100,100,100)", [0, 0, 50, 500], renderContexts[2].context, true);
  }
  ret.getMods = getMods;
  ret.getCollisions = getCollisions;
  return ret;
}
/*Todo:
- Rewrite code, make it nice
- Allow 2D, 3D rendering - In 2D, just don't use threjs and use the 2D canvas to draw it all
*/