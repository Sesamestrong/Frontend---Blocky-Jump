var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var socket=io();
socket.on('levelList',(listLevels)=>{
  let allLevelNames=[];
  for(i=0;i<listLevels.length;i++){
    allLevelNames.push([null,null]);
    allLevelNames[i][0]='/levels/'+encodeURIComponent(listLevels[i]);
    allLevelNames[i][1]=listLevels[i];
  }
  sortableList.update(allLevelNames);
})
function toggleModal(){
  socket.emit("listLevels");
  document.getElementById("menu-check").checked = false;
  document.getElementById("levelList").classList.toggle("hidden");
  if(!document.getElementById("levelList").classList.contains("hidden")){
    document.getElementById("search").focus();
  }
}
socket.emit("listLevels");
var sortableList = (function(l){
  var USPEED = 100;
  var elements = l||[];
  var list = document.getElementById("list");

  var ret = {};
  
  ret.renderList = function(l, q){
    if(l.length > 0){
      var g = document.createDocumentFragment();
      for(var i = 0; i < l.length; i++){
        var j = document.createElement('a');
        j.classList.add('list-item')
        j.innerText = l[i][1];
        j.href = l[i][0];
        g.appendChild(j);
      }
      list.innerHTML = "";
      list.appendChild(g); 
    } else {
      list.innerHTML = "<p class='no-results'>No results found for '"+q+"'<p>";
    }
  }
  ret.sort = function(query){
    console.log(query)
    if(query) ret.renderList(elements.filter(function(e){
      console.log(e);
      return e[1].toLowerCase().indexOf(query.toLowerCase()) !== -1;
    }).sort(function(a, b){
      return a[1].toLowerCase().indexOf(query.toLowerCase())-b[1].toLowerCase().indexOf(query.toLowerCase());
    }), query);
    else ret.renderList(elements, query);
  }
  ret.render = function(){
    if(r){
      ret.sort(document.getElementById("search").value);
      r = false;
    }
  }
  ret.update = function(newL){
    elements = newL;
    ret.renderList(newL);
  }

  var r = true;
  // /*
  window.setInterval(ret.render, USPEED)
  document.getElementById('search').addEventListener('keydown', function(e){
    r = true
  });
  /*/
    document.getElementById('search').addEventListener('keypress', render);
  // */
  
  ret.renderList('');
  
  return ret;
})([]);
document.body.addEventListener('click', function(e){
  if(e.target.dataset.close){
    document.querySelector('#'+e.target.dataset.close).classList.add('hidden');
  }
});

var joystick = isMobile?(function(parent){
  Element.prototype.on = Element.prototype.addEventListener;
  function $(e){return (e instanceof HTMLElement?e:(typeof e === "string"?document.querySelector(e):e))}
  
  let canvas = $(parent||'body');
  let joy = document.createElement('div');
  let mover = document.createElement('div');
  let MAXDIST = 300;
  joy.id="joy-container";

  let ret = (function(mover, joy){
    let mousedown = false;
    let pos = {x: 0, y: 0};
    let size1 = {w:56, h:56};
    let size2 = {w:112, h:112};
    let observers = {start: [], end: [], update: []};
    let lastVals = {x: 0, y: 0};
    let ret = {
      show: function(x, y){
        mover.style.left = x-size2.w+'px';
        mover.style.top = y-size2.h+'px';
        pos.x = x;
        pos.y = y;
        mover.style.display = "block";
       console.log(mover.style.left, mover.style.right)
        observers['start'].forEach(i=>i.call(ret, x, y))
      },
      hide: function(x, y){
        mover.style.display = "none";
        observers['update'].forEach(i=>i.call(ret, 0, 0, MAXDIST))
        observers['end'].forEach(i=>i.call(ret, x, y))
      },
      update: function(x, y){
        if(mousedown){
          let dx = x-pos.x;
          let dy = y-pos.y;
          var hyp = Math.sqrt(dx*dx+dy*dy);
          let signx = 1, signy = -1;
          var ratio = (hyp>MAXDIST)?Math.abs(MAXDIST/hyp):1;
          // var ratio = 1;

          let rx = Math.round(dx*ratio);
          let ry = Math.round(dy*ratio);
          joy.style.left = rx-size1.w+size2.w+'px';
          joy.style.top = ry-size1.h+size2.h+'px';

          if(lastVals.x !== rx || lastVals.y !== ry) observers['update'].forEach(i=>i.call(ret, signx * rx, signy * ry, MAXDIST))
        }
      },
      mousedown: function(e){
        // console.log(4);
        mousedown = true;
        ret.show(e.clientX, e.clientY);
        ret.update(e.clientX, e.clientY);
      },
      mousemove: function(e){
        ret.update(e.clientX, e.clientY);
      },
      mouseup: function(e){
        mousedown = false;
        ret.hide(e.clientX, e.clientY);
        observers['end'].forEach(i=>i.call(ret, e.clientX, e.clientY))
      },
      touchstart: function(e){
        // console.log(e.touches)
        // console.log(4);
        mousedown = true;
        ret.show(e.touches[0].clientX, e.touches[0].clientY);
        ret.update(e.touches[0].clientX, e.touches[0].clientY);
      },
      touchmove: function(e){
        // console.log(e.touches)
        ret.update(e.touches[0].clientX, e.touches[0].clientY);
      },
      touchend: function(e){
        // console.log(e.touches)
        mousedown = false;
        ret.hide(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        observers['end'].forEach(i=>i.call(ret, e.changedTouches[0].clientX, e.changedTouches[0].clientY))
      },
      getValues: function(){
        return {x: 0, y:0}
      },
      on: function(event, func){
        observers[event].push(func);
      }
    };
    return ret;
  })(joy, mover);
  
  joy.appendChild(mover);
  joy.classList.add('joystick');
  mover.classList.add('joystick');
  document.body.appendChild(joy);

  canvas.on("mousedown", ret.mousedown);

  mover.on("mouseup", ret.mouseup);
  joy.on("mouseup", ret.mouseup);
  canvas.on("mouseup", ret.mouseup);

  canvas.on("mousemove", ret.mousemove);
  mover.on("mousemove", ret.mousemove);
  joy.on("mousemove", ret.mousemove);

  mover.on("dragstart", e=>e.preventDefault());
  joy.on("dragstart", e=>e.preventDefault());
  
  canvas.on("touchstart", ret.touchstart);

  mover.on("touchend", ret.touchend);
  joy.on("touchend", ret.touchend);
  canvas.on("touchend", ret.touchend);

  canvas.on("touchmove", ret.touchmove);
  mover.on("touchmove", ret.touchmove);
  joy.on("touchmove", ret.touchmove);

  mover.on("dragstart", e=>e.preventDefault());
  joy.on("dragstart", e=>e.preventDefault());
  return ret;
}('#overlaid')):({on: e=>false});
function toggleMusic(){
  document.getElementById("song").volume="0";
}