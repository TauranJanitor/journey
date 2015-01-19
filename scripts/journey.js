$(document).ready(function() {
  //The tempo of Separate Ways used for backdrop strobe, bouncer and fan animation
  var TEMPO = 0.452;
  //bounce sound bypasses Quintus' Audio which uses AJAX from a server
  //This allows development on a local machine
  var bounce = new Audio("audio/bounce.wav");

  //jQuery code allowing user to change tracks
  $("input[type=radio][name=song]").change(function() {
    var song = $(this).val();
    $("#audio").attr("src", "audio/Journey - " + song + ".mp3");
    $("#gamecanvas").focus();
  });
  
  //Load Quintus modules
  var Q = new Quintus().include("Sprites, Scenes, Input, Touch, Anim");

  //bind to existing tag with width and height set
  Q.setup("gamecanvas");
  //add generic UI (keyboard)
  Q.controls();
  //add touch device controls
  //Q.touch();
  
  //strobing yellow and red eye behind the stage
  Q.Sprite.extend("Backdrop", {
    init: function(p) {
      this._super(p, {
        sprite: "backdrop",
        sheet: "backdrop",
        x: 240,
        y: 80,
        z: 0,
        w: 480,
        h: 160
      });
      this.add("animation");
      this.play("strobe");
    }
  });
  
  Q.animations("backdrop", {
    strobe: { frames: [0, 1], rate: TEMPO },
  });

  //stationary sprite for the ground
  Q.Sprite.extend("Ground", {
    init: function(p) {
      this._super(p, {
        asset: "ground.png",
        x: 240,
        y: 336,
        z: 0,
        w: 480,
        h: 352
      });
    }
  });
  
  //stationary sprite for the platform.
  //Could break it up so that fans disappear under doorway using a higher Z
  Q.Sprite.extend("Platform", {
    init: function(p) {
      this._super(p, {
        asset: "platform.png",
        x: 240,
        y: 174,
        z: 1,
        w: 416,
        h: 188
      });
    }
  });
  
  //Player-controlled bouncer. Not much more than a breakout paddle
  Q.Sprite.extend("Bouncer", {
    init: function(p) {
      this._super(p, {
        sprite: "bouncer",
        sheet: "bouncer",
        x: 240,
        y: 256,
        z: 2,
        w: 50,
        h: 32,
        vx: 0,
        speed: 2,
      });
      this.add("animation");
      this.play("push");
    },
    step: function(p) {
      //originally with the input 'on' method, key repeat was too unresponsive,
      //so vectors were used
      if (Q.inputs['left'] && this.p.x > 145) {
        this.p.vx = -this.p.speed;
      } else if (Q.inputs['right'] && this.p.x < 335) {
        this.p.vx = this.p.speed;
      } else {
        this.p.vx = 0;
      };
      this.p.x += this.p.vx;
    }
  });
  
  Q.animations("bouncer", {
    push: { frames: [0, 1], rate: TEMPO }
  });
  
  Q.Sprite.extend("Fan", {
    init: function(p) {
      this._super(p, {
        sprite: "fans",
        sheet: "fans",
        fanType: Math.floor(Math.random() * 2),
        isRusher: false,
        x: Math.round(Math.random() * 435 + 25),
        y: Math.round(Math.random() * 160 + 325),
        z: 3,
        w: 25,
        h: 32,
        speed: 2,
        vx: 0,
        vy: 0
      });
      this.add("animation");
      if (this.p.fanType == 0) this.play("dance1");
      else this.play("dance2");
    },
    step: function(dt) {
      if (this.p.isRusher) {
        this.p.x += this.p.vx;
        this.p.y += this.p.vy;
        //My custom collision detection
        //simply a Math.abs distance check with the player bouncer
        var bouncer = Q("Bouncer").first();
        if (Math.abs(bouncer.p.y - this.p.y) < 1) {
          if (Math.abs(bouncer.p.x - this.p.x) < 37) {
            //go back!
            this.p.vy = -this.p.vy;
            this.p.vx = -this.p.vx;
            bounce.play();
          }
        }
        //destroy fans who get bounced back or who get past the bouncer
        if (this.p.y > 375 || this.p.y < 232) {
          this.destroy();
        }
      }
    }
  });
  
  Q.animations("fans", {
    dance1: { frames: [0, 1], rate: TEMPO },
    dance2: { frames: [2, 3], rate: TEMPO }
  });
  
  Q.load("ground.png, bouncer.png, platform.png, fans.png, backdrop.png", function() {
    //load animation sheets for backdrop, bouncer, and fans
    Q.sheet("backdrop", "backdrop.png", {tilew: 480, tileh: 160});
    Q.sheet("bouncer", "bouncer.png", {tilew: 50, tileh: 32});
    Q.sheet("fans", "fans.png", {tilew: 25, tileh: 32});
    //stage the scene for the game
    Q.stageScene("escape", 0);
  });
  
  Q.scene("escape", function(stage) {
    //insert backdrop
    stage.insert(new Q.Backdrop());
    
    //insert Ground sprite
    stage.insert(new Q.Ground());

    //insert Platform sprite
    stage.insert(new Q.Platform());

    //insert Player, animate his pushing
    var player = stage.insert(new Q.Bouncer());

    //insert 50 fans
    var fanCount = 50;
    var fan = [];
    for (var i = 0; i < fanCount; i++) {
      fan[i] = stage.insert(new Q.Fan());
    }
    
    //spawn stage rushers using setInterval event
    var delay = 1500;
    setInterval(function() {
      //randomize to three doorways, -1, 0, and 1
      var start = Math.floor(Math.random() * 3) - 1;
      //set their rushing origin and vector based on start
      var rusher = new Q.Fan({x: 240 + 30 * start, y: 370, vy: -1, vx: start * 0.5, isRusher: true});
      //put 'em in!
      stage.insert(rusher);
    }, delay);
  });
});