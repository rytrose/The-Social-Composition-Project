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

// Facebook global variables
var user_access_token = -1;
var pagesOfPostIds = 0;
var ids = []; // Array of post ids first gathered from the given page
var postIdArray = []; // Array of post ids rebuilt after ids[]
var nameArray = []; // temp
var reactionArray = []; // temp
var nameArrayofArrays = []; // Stores the names of users who reacted for every post gathered
var reactionArrayofArrays = []; // Stores the reactions for every post gathered


var indexOfLongest = 0; // Used to find one post to compose off of
var likeCount = 0; // Used to determine when to play LIKE sequence phrase

var highlightFlag = -1; // Used to trigger animations alongside music

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
        // Begin retrieving data from the input page
        callback(reactionProcessing);
      });
      FB.getLoginStatus(function(response){
        if (response.status === 'connected') {
          user_access_token = response.authResponse.accessToken;
        } else if (response.status === 'not_authorized') {
          // the user is logged in to Facebook, but has not authenticated the app
          console.log("User has not authorized this app.")
        } else {
          // the user isn't logged in to Facebook
          console.log("User has not logged into Facebook.")
        }
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
   }, {scope: 'user_friends,user_likes'});
};

/*
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *  This section holds the Facebook data collection functions.
 * XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 */

// Gathers the post ids of a given page
function capturePostIds(callback) {
  // Get page id from input
  var pageIdElement = document.getElementById("pageId");
  var pageId = pageIdElement.value;
  var queryString = '/' + pageId + '/feed';

  // Try to get the post ids for the page id given, serves as input validation
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
  // Remove the Generate Composition button
  var button = document.getElementById("generate");
  button.style.display = "none";
  // Display the loading GIF
  var loading = document.getElementById("loading");
  loading.style.display = "block";
};

// Recursively page through 'page/feed' results and store post ids
function nextIdPage(response, callback, nextURL){
  if(response.data == undefined){
    console.log("No post id returned.")
  }
  // Recursive base case: Reached the last page of returned data
  // CURRENTLY CODED TO ONLY RETURN ONE PAGE TO REDUCE LOAD TIME
  else if((nextURL == undefined)||(pagesOfPostIds > 0)){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    callback(finish);
  }
  // Read the returned page and try the next page
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
    // Gather the reactions and the names of who reacted for each post
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

// Upon completeing the gathering of data choose one post and present the option to play the associated composition
function finish(){
  var length = 0;
  // Choose post
  // CURRENTLY HARDCODED TO BE LARGEST POST LESS THAN 100 REACTIONS DUE TO VISUALIZATION
  for(i = 0; i < reactionArrayofArrays.length; i++){
    if(reactionArrayofArrays[i].length > length && reactionArrayofArrays[i].length < 100){
      indexOfLongest = i;
      length = reactionArrayofArrays[i].length;
    }
  }

  // Remove loading GIF and present Play Composition button
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
  var loader = new BufferLoader(context,['sounds/like1_8_counts.mp3',       // 0: LIKE phrase
                                          'sounds/drone1.mp3',              // 1: Underlying drone phrase
                                          'sounds/4like_seq_drone.mp3',     // 2: 4 LIKE sequence phrase
                                          'sounds/beep1.mp3' ], onloaded);   // 3: Non-LIKE beep
  // Buffer audio into memory
  function onloaded(buffers){
    ctx.buffers = buffers;
    }

  loader.load();
}

CompositionGeneration.prototype.playComposition = function(){
  // Start animating
  animation();

  // Get rid of Play Composition button so user can't play more than once
  var div = document.getElementById("playcomp");
  div.style.display = "none";

  // Set up time paradigm for music and animation generation
  var time = context.currentTime;
  var quarterNote = 0.5357143; // quarter note = 112bpm
  var intro = 16 * quarterNote; // One drone cycle intro

  // Used to highlight the reaction that is "playing"
  var highlightViz = function( ind ){
    highlightFlag = ind;
    if (ind < reactionArrayofArrays[indexOfLongest].length - 1){
      setTimeout(function(){highlightViz(ind + 1)}, Math.floor(1000 * quarterNote * 8))
    }
  }

  // Start the highlighting after the intro
  setTimeout(function(){highlightViz(0)},  Math.floor(1000 * intro));

  // Start the intro
  var droneSource0 = this.makeDroneSource(this.buffers[1]);
  droneSource0[droneSource0.start ? 'start' : 'noteOn'](time);

  // Generate the composition!
  for(i = 0; i < reactionArrayofArrays[indexOfLongest].length; i++){

    // handle the melody
    // If LIKE
    if(reactionArrayofArrays[indexOfLongest][i] == 'LIKE'){
      // Keep track of like sequence
      likeCount++;

      // Normal LIKE phrase
      var source = this.makeReactionSource(this.buffers[0]);
      source[source.start ? 'start' : 'noteOn'](time + intro + i * 8 * quarterNote);

      // 4 LIKE sequence phrase
      if(i > 0 && likeCount % 4 == 0){
        var droneSource2 = this.makeDroneSource(this.buffers[2]);
        droneSource2[droneSource2.start ? 'start' : 'noteOn'](time + intro + (i + 1) * 8 * quarterNote);
      }
    }
    else{
      // Reset LIKE sequence count
      likeCount = 0;

      // Non-LIKE phrase
      var reactionSource = this.makeReactionSource(this.buffers[3]);
      reactionSource[reactionSource.start ? 'start' : 'noteOn'](time + intro + i * 8 * quarterNote);
    }

    // Drone is twice as long as reaction phrases, play and outro of 4 drone cycles
    if(i < (reactionArrayofArrays[indexOfLongest].length / 2) + 4){
      // Drone
      var droneSource = this.makeDroneSource(this.buffers[1]);
      droneSource[droneSource.start ? 'start' : 'noteOn'](time + intro + i * 16 * quarterNote);
    }
  }
}

// Source for reaction phrases, more gain than drone
CompositionGeneration.prototype.makeReactionSource = function(buffer) {
  var source = context.createBufferSource();
  var gain = context.createGain();
  gain.gain.value = 0.4;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(context.destination);
  return source;
};

// Source for drone phrases, less gain than reactions
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
  // THREE.js elements
  var camera, scene, renderer;
  var controls;

  var positions = []; // Holds the reactions' positions in the animation
  var objects = [];
  var current = 0;

  // Names and reactions of post for the composition
  var names = nameArrayofArrays[indexOfLongest];
  var reactions = reactionArrayofArrays[indexOfLongest];

  init();
  animate();

  function init() {

    // Create the camera and point it at the center of the animation space
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set( 2000, 1600, 3000 );
    camera.target = new THREE.Vector3();
    camera.lookAt( new THREE.Vector3() );

    scene = new THREE.Scene();

    // Creates reaction sprites
    var image = document.createElement( 'img' );
    image.addEventListener( 'load', function ( event ) {

      // Sprites begin in a sphere
      var radius = reactions.length * 5;

      for ( var i = 0; i < reactions.length; i ++ ) {
        var sprite = image.cloneNode();
        // Set the correct image based on reaction
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
        if(reactions[i] == "WOW")
          sprite.src = 'Facebook Reaction PNGs/wow.png';
        sprite.title = names[i];
        var object = new THREE.CSS3DSprite( sprite );

        // Sphere math
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

    // Random math
    for ( var i = 0; i < reactions.length; i ++ ) {

      positions.push(
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000,
        Math.random() * 4000 - 2000
      );

    }

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    // Initialize Trackball Controls
    controls = new THREE.TrackballControls( camera, renderer.domElement );
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.4;

    // Handle window resizing
    window.addEventListener( 'resize', onWindowResize, false );

    window.scrollTo(0,356);
  }

  // Handle window resizing
  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function transition() {
    var offset = current * reactions.length * 3;
    var duration = 2000;

    for ( var i = 0, j = offset; i < reactions.length; i ++, j += 3 ) {
      // Transition from sphere to random
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

  // Highlights and displays the name of the user who reacted to the post, in time with its
  // generated musical phrase in the composition
  var highlight = function () {
    var img = document.createElement( 'img' );
    if(reactions[highlightFlag] == "LIKE")
      img.src = 'Facebook Reaction PNGs/like1.png';
    if(reactions[highlightFlag] == "LOVE")
      img.src = 'Facebook Reaction PNGs/love1.png';
    if(reactions[highlightFlag] == "SAD")
      img.src = 'Facebook Reaction PNGs/sad1.png';
    if(reactions[highlightFlag] == "ANGRY")
      img.src = 'Facebook Reaction PNGs/angry1.png';
    if(reactions[highlightFlag] == "HAHA")
      img.src = 'Facebook Reaction PNGs/haha1.png';
    if(reactions[highlightFlag] == "WOW")
      img.src = 'Facebook Reaction PNGs/wow1.png';
    img.title = names[highlightFlag];
    var obj = new THREE.CSS3DSprite( img );
    obj.position.x = objects[highlightFlag].position.x;
    obj.position.y = objects[highlightFlag].position.y;
    obj.position.z = objects[highlightFlag].position.z;
    objects[highlightFlag] = obj;
    var toRemove = scene.children[0];
    var name = scene.children[0].element.title;

    // Create and display the label
    var number = document.createElement( 'div' );
    number.className = 'label';
    number.textContent = name;
    label = new THREE.CSS3DObject( number );
    label.position.x = objects[highlightFlag].position.x;
    label.position.y = objects[highlightFlag].position.y - 100;
    label.position.z = objects[highlightFlag].position.z;
    scene.remove(toRemove);
    scene.add(obj);
    scene.add(label);
  }

  // Animation loop
  function animate() {

    requestAnimationFrame( animate );

    TWEEN.update();

    controls.update();

    // Highlight a reaction when triggered
    if(highlightFlag > -1){
      highlight();
      highlightFlag = -1;
    }

    var time = performance.now();

    // Make the sprites "float"
    for ( var i = 0, l = objects.length; i < l; i ++ ) {

      var object = objects[ i ];
      var scale = Math.sin( ( Math.floor( object.position.x ) + time ) * 0.002 ) * 0.3 + 1;
      object.scale.set( scale, scale, scale );

    }

    renderer.render( scene, camera );
  }
}
