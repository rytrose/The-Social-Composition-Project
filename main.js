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
  var length = reactionArrayofArrays[0].length;
  for(i = 0; i < reactionArrayofArrays.length; i++){
    if(reactionArrayofArrays[i].length > length){
      indexOfLongest = i;
      length = reactionArrayofArrays[i].length;
    }
  }
  debugger;
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
  var time = context.currentTime;
  var quarterNote = 0.5357143; // quarter note = 112bpm

  var intro = 16 * quarterNote;
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

}
