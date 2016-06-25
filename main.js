/*
 *XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *
 *  The Social Composition Project
 *    by Ryan Rose
 *   (c) June, 2016
 *
 *  This project seeks to interpret the humanity exhibited through social media into music,
 *  by procedurally generating a unique composition based upon a Facebook post's reactions.
 *  Each reaction has a distinct melodic phrase, which floats over an oscillating drone.
 *  A disproprtionate amount of 'LIKE's relative to the other reactions led me to compose special
 *  phrases for when a sequence of uninterrupted 'LIKE's is read.
 *
 *XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 */
var user_access_token = -1;
var pagesOfPostIds = 0;
var ids = [];

var postIdArray = [];
var nameArray = [];
var reactionArray = [];
var nameArrayofArrays = [];
var reactionArrayofArrays = [];


var indexOfLongest = 0;
var likeCount = 0;

var rFlag = -1;

// Facebook API Init
window.fbAsyncInit = function() {
  FB.init({
    appId      : '470173043180481',
    status     : true,
    xfbml      : true,
    version    : 'v2.6'
  });
};

(function(d, s, id){
   var js, fjs = d.getElementsByTagName(s)[0];
   if (d.getElementById(id)) {return;}
   js = d.createElement(s); js.id = id;
   js.src = "https://connect.facebook.net/en_US/all.js";
   fjs.parentNode.insertBefore(js, fjs);
   console.log()
 }(document, 'script', 'facebook-jssdk'));

function myFacebookLogin(callback) {
  FB.login(function(response){
    if (response.authResponse) {
      console.log('Welcome!  Fetching your information.... ');
      FB.api('/me', function(response) {
        console.log(response);
        console.log('Good to see you, ' + response.name + '.');
        callback(reactionProcessing);
      });
      FB.getLoginStatus(function(response){
        if (response.status === 'connected') {
          user_access_token = response.authResponse.accessToken;
        } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook,
          // but has not authenticated your app
          console.log("User has not authorized this app.")
        } else {
          // the user isn't logged in to Facebook.
          console.log("User has not logged into Facebook.")
        }
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
   }, {scope: 'user_friends,user_likes'});
};

// Gathers the post ids of a given page (currently hardcoded to Speakeasy page: https://www.facebook.com/CWRUSpeakeasy/)
function capturePostIds(callback) {
  var pageIdElement = document.getElementById("pageId");
  var pageId = pageIdElement.value;
  var queryString = '/' + pageId + '/feed';
  try{
      FB.api(queryString, {
      access_token: user_access_token,
      fields: 'id'
    }, function(response){
      nextIdPage(response, callback, response.paging);
    });
  }
  catch(e){
    window.alert("Facebook Page does not exist.");
    return;
  }
  var button = document.getElementById("generate");
  button.style.display = "none";
  var loading = document.getElementById("loading");
  loading.style.display = "block";
};

// Recursively pages through post results and stores ids
function nextIdPage(response, callback, nextURL){
  if(response.data == undefined){
    console.log("No post id returned.")
  }
  else if((nextURL == undefined)||(pagesOfPostIds > 0)){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    callback(finish);
  }
  else{
    console.log("Reading page...")
    console.log(response)
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    pagesOfPostIds += 1;
    FB.api(nextURL.next, {
      access_token: user_access_token,
      fields: 'id'
    }, function(response){
      nextIdPage(response, callback, response.paging)
    });
  }
}

// Uses recursion to get names and reactions from previous gathered Ids
function reactionProcessing(callback){
  if(ids.length == 0){
    callback();
  }
  else{
    captureNamesReactions(reactionProcessing);
  }
}

// Gathers the names and reactions for a given post
function captureNamesReactions(callback){
  var id = ids.shift();
  dest = '/' + id + '/reactions';
  postIdArray.push(id);
  FB.api(dest, {
    access_token: user_access_token,
    fields: 'name,type'
  }, function(response){
    nextReactionsPage(response, callback, response.paging);
  });
}

// Pages through posts and stores names and reactions
function nextReactionsPage(response, callback, nextURL){
  if(response.data == undefined){
    callback(finish);
  }
  else if((response.data.length == 0)||(response.paging == undefined)){
    console.log("No post reactions returned.")
      nameArrayofArrays.push(nameArray);
      nameArray = [];
      reactionArrayofArrays.push(reactionArray);
      reactionArray = [];
    callback(finish);
  }
  else if(nextURL.hasOwnProperty('next') == false){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      nameArray.push(response.data[i].name);
      reactionArray.push(response.data[i].type);
    }
    console.log(nameArray);
    nameArrayofArrays.push(nameArray);
    nameArray = [];
    console.log(reactionArray);
    reactionArrayofArrays.push(reactionArray);
    reactionArray = [];
    callback(finish);
  }
  else{
    console.log("Reading page...");
    console.log(response);
    for(i = 0; i < response.data.length; i++){
      nameArray.push(response.data[i].name);
      reactionArray.push(response.data[i].type);
    }
    FB.api(nextURL.next, {
      access_token: user_access_token,
      fields: 'name,type'
    }, function(response){
      nextReactionsPage(response, callback, response.paging)
    });
  }
}

function finish(){
  var length = 0;
  for(i = 0; i < reactionArrayofArrays.length; i++){
    if(reactionArrayofArrays[i].length > length && reactionArrayofArrays[i].length < 50){
      indexOfLongest = i;
      length = reactionArrayofArrays[i].length;
    }
  }

  console.log(reactionArrayofArrays[indexOfLongest]);
  var div = document.getElementById("loading");
  div.style.display = "none";
  var button = document.getElementById("playcomp");
  button.style.display = "block";
}

/*
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *  This section holds the music generation functions.
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 */
function CompositionGeneration(context){
  var ctx = this;
  var loader = new BufferLoader(context,['sounds/like1_8_counts.mp3','sounds/drone1.mp3', 'sounds/4like_seq_drone.mp3', 'sounds/beep1.mp3' ], onloaded)

  function onloaded(buffers){
    ctx.buffers = buffers;
    }

  loader.load();
}

CompositionGeneration.prototype.playComposition = function(){
  // Start animation
  animation();

  var time = context.currentTime;
  var quarterNote = 0.5357143; // quarter note = 112bpm
  var intro = 16 * quarterNote;

  var highlightViz = function( ind ){
    rFlag = ind;
    if (ind < reactionArrayofArrays[indexOfLongest].length - 1){
      setTimeout(function(){highlightViz(ind + 1)}, Math.floor(1000 * quarterNote * 8))
    }
  }

  setTimeout(function(){highlightViz(0)},  Math.floor(1000 * intro));


  var droneSource0 = this.makeDroneSource(this.buffers[1]);
  droneSource0[droneSource0.start ? 'start' : 'noteOn'](time);

  for(i = 0; i < reactionArrayofArrays[indexOfLongest].length; i++){

    // handle the melody
    // If LIKE
    if(reactionArrayofArrays[indexOfLongest][i] == 'LIKE'){
      likeCount++;

      // normal like sample
      var source = this.makeReactionSource(this.buffers[0]);
      source[source.start ? 'start' : 'noteOn'](time + intro + i * 8 * quarterNote);

      // 4-like sequence sample
      if(i > 0 && likeCount % 4 == 0){
        var droneSource2 = this.makeDroneSource(this.buffers[2]);
        droneSource2[droneSource2.start ? 'start' : 'noteOn'](time + intro + (i + 1) * 8 * quarterNote);
      }
    }
    else{
      likeCount = 0;
      var reactionSource = this.makeReactionSource(this.buffers[3]);
      reactionSource[reactionSource.start ? 'start' : 'noteOn'](time + intro + i * 8 * quarterNote);
    }

    if(i < (reactionArrayofArrays[indexOfLongest].length / 2) + 4){
      // handle the drone
      var droneSource = this.makeDroneSource(this.buffers[1]);
      droneSource[droneSource.start ? 'start' : 'noteOn'](time + intro + i * 16 * quarterNote);
    }
  }
}

CompositionGeneration.prototype.makeReactionSource = function(buffer) {
  var source = context.createBufferSource();
  var gain = context.createGain();
  gain.gain.value = 0.4;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(context.destination);
  return source;
};

CompositionGeneration.prototype.makeDroneSource = function(buffer) {
  var source = context.createBufferSource();
  var gain = context.createGain();
  gain.gain.value = 0.20;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(context.destination);
  return source;
};

/*
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *  This section holds the animation functions.
 *  Based off of the threejs.org example "css3d_sprites.html"
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 */
function animation(){
  var camera, scene, renderer;
  var controls;

  var particlesTotal = 512;
  var positions = [];
  var objects = [];
  var current = 0;
  var names = nameArrayofArrays[indexOfLongest];
  var reactions = reactionArrayofArrays[indexOfLongest];

  var ind = 0;

  init();
  animate();

  function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set( 2000, 1600, 3000 );
    camera.target = new THREE.Vector3();
    camera.lookAt( new THREE.Vector3() );

    scene = new THREE.Scene();

    var image = document.createElement( 'img' );
    image.addEventListener( 'load', function ( event ) {

      var radius = reactions.length * 5;

      for ( var i = 0; i < reactions.length; i ++ ) {
        var sprite = image.cloneNode();
        if(reactions[i] == "LIKE")
          sprite.src = 'Facebook Reaction PNGs/like.png';
        if(reactions[i] == "LOVE")
          sprite.src = 'Facebook Reaction PNGs/love.png';
        if(reactions[i] == "SAD")
          sprite.src = 'Facebook Reaction PNGs/sad.png';
        if(reactions[i] == "ANGRY")
          sprite.src = 'Facebook Reaction PNGs/angry.png';
        if(reactions[i] == "HAHA")
          sprite.src = 'Facebook Reaction PNGs/haha.png';
        sprite.title = names[i];
        var object = new THREE.CSS3DSprite( sprite );

        var phi = Math.acos( -1 + ( 2 * i ) / reactions.length );
        var theta = Math.sqrt( reactions.length * Math.PI ) * phi;

        object.position.x = radius * Math.cos( theta ) * Math.sin( phi ),
        object.position.y = radius * Math.sin( theta ) * Math.sin( phi ),
        object.position.z = radius * Math.cos( phi );
        scene.add( object );

        objects.push( object );

      }

      transition();

    }, false );
    image.src = 'Facebook Reaction PNGs/like.png';

    // Random

    for ( var i = 0; i < reactions.length; i ++ ) {

      positions.push(
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000
      );

    }

    // Sphere

    var radius = 500;

    for ( var i = 0; i < reactions.length; i ++ ) {

      var phi = Math.acos( -1 + ( 2 * i ) / reactions.length );
      var theta = Math.sqrt( reactions.length * Math.PI ) * phi;

      positions.push(
        radius * Math.cos( theta ) * Math.sin( phi ),
        radius * Math.sin( theta ) * Math.sin( phi ),
        radius * Math.cos( phi )
      );

    }

    //

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    //

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.4;

    //

    window.addEventListener( 'resize', onWindowResize, false );

    window.scrollTo(0,356);
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function transition() {
    var offset = current * reactions.length * 3;
    var duration = 2000;

    for ( var i = 0, j = offset; i < reactions.length; i ++, j += 3 ) {

      var object = objects[ i ];
      var tween1 = new TWEEN.Tween( object.position )
          .to( {
            x: positions[ j ],
            y: positions[ j + 1 ],
            z: positions[ j + 2 ]
          }, Math.random() * duration + duration )
          .easing( TWEEN.Easing.Exponential.InOut )
          .start();
    }
    var tween2 = new TWEEN.Tween( this )
      .to( {}, duration * 2 )
      .start();
    current = ( current + 1 ) % 2;
  }

  var test1 = function () {
    var img = document.createElement( 'img' );
    if(reactions[rFlag] == "LIKE")
      img.src = 'Facebook Reaction PNGs/like1.png';
    if(reactions[rFlag] == "LOVE")
      img.src = 'Facebook Reaction PNGs/love1.png';
    if(reactions[rFlag] == "SAD")
      img.src = 'Facebook Reaction PNGs/sad1.png';
    if(reactions[rFlag] == "ANGRY")
      img.src = 'Facebook Reaction PNGs/angry1.png';
    if(reactions[rFlag] == "HAHA")
      img.src = 'Facebook Reaction PNGs/haha1.png';
    img.title = names[rFlag];
    var obj = new THREE.CSS3DSprite( img );
    obj.position.x = objects[rFlag].position.x;
    obj.position.y = objects[rFlag].position.y;
    obj.position.z = objects[rFlag].position.z;
    objects[rFlag] = obj;
    var toRemove = scene.children[0];
    var name = scene.children[0].element.title;

    var number = document.createElement( 'div' );
    number.className = 'label';
    number.textContent = name;
    label = new THREE.CSS3DObject( number );
    label.position.x = objects[rFlag].position.x;
    label.position.y = objects[rFlag].position.y - 75;
    label.position.z = objects[rFlag].position.z;
    scene.remove(toRemove);
    scene.add(obj);
    scene.add(label);

    console.log("changed src");
  }

  function animate() {

    requestAnimationFrame( animate );

    TWEEN.update();

    controls.update();

    if(rFlag > -1){
      test1();
      rFlag = -1;
    }

    var time = performance.now();

    for ( var i = 0, l = objects.length; i < l; i ++ ) {

      var object = objects[ i ];
      var scale = Math.sin( ( Math.floor( object.position.x ) + time ) * 0.002 ) * 0.3 + 1;
      object.scale.set( scale, scale, scale );

    }

    renderer.render( scene, camera );

  }
}
