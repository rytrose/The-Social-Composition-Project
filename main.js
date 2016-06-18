var user_access_token = -1;
var pagesOfPostIds = 0;
var ids = [];

var postIdArray = [];
var nameArray = [];
var reactionArray = [];
var nameArrayofArrays = [];
var reactionArrayofArrays = [];


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

function myFacebookLogin() {
  FB.login(function(response){
    if (response.authResponse) {
      console.log('Welcome!  Fetching your information.... ');
      FB.api('/me', function(response) {
        console.log(response);
        console.log('Good to see you, ' + response.name + '.');
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
  FB.api('/92017720030/feed', {
    access_token: user_access_token,
    fields: 'id'
  }, function(response){
    nextIdPage(response, callback, response.paging);
  });
};

// Recursively pages through post results and stores ids
function nextIdPage(response, callback, nextURL){
  if(response.data == undefined){
    console.log("No post id returned.")
  }
  else if((nextURL == undefined)||(pagesOfPostIds > 6)){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    callback(printReactions);
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

function captureNamesReactions(callback){
  console.log(ids)
  var dest = ''
  for(i = 0; i < ids.length; i++){
    dest = '/' + ids[i] + '/reactions'
    postIdArray.push(ids[i]);
    FB.api(dest, {
      access_token: user_access_token,
      fields: 'name,type'
    }, function(response){
      nextReactionsPage(response, callback, response.paging);
    });
  }
}

// Recursively pages through posts and stores names and reactions
function nextReactionsPage(response, callback, nextURL){
  if((response.data.length == 0)||(response.paging == undefined)){
    console.log("No post reactions returned.")
  }
  else if(nextURL.hasOwnProperty('next') == false){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      nameArray.push(response.data[i].name);
      reactionArray.push(response.data[i].type);
    }
    callback();
  }
  else{
    console.log("Reading page...")
    console.log(response)
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

function printReactions(){
  console.log(nameArray);
  nameArrayofArrays.push(nameArray);
  nameArray = [];
  console.log(reactionArray);
  reactionArrayofArrays.push(reactionArray);
  reactionArray = [];

}

function finish(){
  debugger;
}
