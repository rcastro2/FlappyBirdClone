var mouse = {x:0,y:0};
var key = {Y:89,N:78,pressed:-1,space:32,enter:13,left:37,up:38,right:39,down:40,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123};

// Game Objects
function Game(canvas){
  this.canvas = document.getElementById("game");
  this.canvas.tabIndex = 1;
  this.canvas.addEventListener('mousemove', function(e) {
    var rect = this.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  },false);

  window.addEventListener('keydown', function(e) {
    key.pressed = e.keyCode;
  },false);
  window.addEventListener('keyup', function(e) {
    key.pressed = null;
  },false);

  this.context = this.canvas.getContext('2d');
  this.width = this.canvas.width;
  this.height = this.canvas.height;
  this.over = false;
  this.pause = false;
  this.score = 0;
  this.showBoundingBoxes = false;
  this.images = {};
  this.audios = {};
  this.preload = function(sources,callback){
    var ct = 0;
    for(var i = 0; i < sources.images.length; i++) {
        this.images[sources.images[i].id] = new Image();
        this.images[sources.images[i].id].onload = function() {
            if(++ct >= sources.images.length + sources.audios.length) {
                callback();
            }
        }
        this.images[sources.images[i].id].src = sources.images[i].src;
    }
    for(var i = 0; i < sources.audios.length; i++) {
        this.audios[sources.audios[i].id] = new Audio();
        this.audios[sources.audios[i].id].oncanplaythrough = function() {
            if(++ct >= sources.images.length + sources.audios.length) {
                callback();
            }
        }
        this.audios[sources.audios[i].id].src = sources.audios[i].src;
        this.audios[sources.audios[i].id].load();
    }
  }
  this.background = null;
  this.setBackground = function(bkGraphics){
    this.background = bkGraphics;
  }
  this.scrollBackground = function(dx,dy){
    this.background.x += dx;
    this.background.y += dy;
    this.background.draw();
    this.background.draw(this.background.x + this.canvas.width,this.background.y);
    if(this.background.x + this.canvas.width <= 0){
      this.background.x = 0;
    }
  }
  this.drawText = function(msg,x,y,font,color){
     var shadowStart = (font == undefined)?-1:font.indexOf("shadow");
     if(shadowStart != -1){
       var colorStart = font.indexOf("-")
       var shadowColor = font.substring(colorStart+1);
       font = font.substring(0,shadowStart);
       this.drawText(msg, x + 2, y + 2,font,shadowColor)
     }
     this.context.font = font || '20pt Calibri';
     this.context.fillStyle = color || "black";
     this.context.fillText(msg, x, y);
  }
}

function Sound(audio){
  this.audio = audio;
  this.play = function(){
    this.audio.play();
  }
}
function Sprite(image,game,x,y){
  this.game = game;
  this.image = image;
  this.x = (x == undefined)? 0: x;
  this.y = y || 0;
  this.width = this.image.width;
  this.height = this.image.height;
  this.left = this.x;
  this.top = this.y;
  this.right = this.x + this.width;
  this.bottom = this.y + this.height;
  this.scale = 1;
  this.visible = true;
  this.draw = function(x,y){
    var pos = {x:x || this.x,y:y || this.y};
    this.left = this.x;
    this.top = this.y;
    this.right = this.x + this.width * this.scale;
    this.bottom = this.y + this.height * this.scale;
    this.game.context.drawImage(this.image,0, 0,this.width,this.height,pos.x,pos.y,this.width * this.scale, this.height * this.scale);
    if(this.game.showBoundingBoxes) drawBoundingBox(this);
  }
  this.moveTo = function(x,y){
    this.x = x;
    this.y = y;
  }
  this.collidedWith = function(obj){
    return intersectRect(this,obj) && obj.visible;
  }
}

function Animation(image,game,w,h,frames,x,y){
  this.game = game;
  this.image = image;
  this.x = (x == undefined)? 0: x;
  this.y = y || 0;
  this.width = w;
  this.height = h;
  this.left = this.x;
  this.top = this.y;
  this.right = this.x + this.width;
  this.bottom = this.y + this.height;
  this.frames = frames;
  this.frame = 0;
  this.scale = 1;
  this.state = null;
  this.visible = true;
  this.perRow = Math.floor(this.image.width / this.width);
  this.draw = function(x,y){
    if(this.visible){
      var pos = {x:x || this.x,y:y || this.y};
      this.frame = this.frame % this.frames;
      var row = Math.floor(Math.floor(this.frame) / this.perRow);
      var col = Math.floor(this.frame) % this.perRow;
      this.frame += 0.1;
      this.game.context.drawImage(this.image,col * this.width,row * this.height, this.width, this.height,pos.x - (this.width * this.scale / 2),pos.y - (this.height * this.scale / 2),this.width * this.scale, this.height * this.scale);
      this.left = pos.x - (this.width * this.scale / 2);
      this.top = pos.y - (this.height * this.scale / 2);
      this.right = pos.x + (this.width * this.scale / 2);
      this.bottom = pos.y + (this.height * this.scale / 2);
      if(this.game.showBoundingBoxes) drawBoundingBox(this);
    }
  }
  this.moveTo = function(x,y){
    this.x = x;
    this.y = y;
  }
  this.collidedWith = function(obj){
    return intersectRect(this,obj) && obj.visible;
  }
}

// Supporting Functions
function intersectRect(r1, r2) {
  return !(r2.left > r1.right ||
           r2.right < r1.left ||
           r2.top > r1.bottom ||
           r2.bottom < r1.top);
}
function drawBoundingBox(obj){
  obj.game.context.beginPath();
  obj.game.context.rect(obj.left, obj.top, obj.right - obj.left, obj.bottom - obj.top);
  obj.game.context.lineWidth = 7;
  obj.game.context.strokeStyle = 'red';
  obj.game.context.stroke();
}
function rnd(sp,range){
  return Math.floor(Math.random()*(range-sp)+sp);
}
