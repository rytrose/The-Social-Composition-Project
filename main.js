var user_access_token = -1;
var ids = [];
var reactionArray = [];

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

function capturePostIds(callback) {
  FB.api('/10351802587/feed', {
    access_token: user_access_token,
    fields: 'id'
  }, function(response){
    nextIdPage(response, callback, response.paging);
  });
};

// Test recursive function
function nextIdPage(response, callback, nextURL){
  if(response.data == undefined){
    console.log("No post id returned.")
  }
  else if(nextURL == undefined){
    console.log("No more pages.")
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    callback();
  }
  else{
    console.log("Reading page...")
    console.log(response)
    for(i = 0; i < response.data.length; i++){
      ids.push(response.data[i].id);
    }
    FB.api(nextURL.next, {
      access_token: user_access_token,
      fields: 'id'
    }, function(response){
      nextIdPage(response, callback, response.paging)
    });
  }
}

function generateReactionArray(callback2){
  for(i = 0; i < ids.length; i++){
    var dest = '/' + ids[i] + '/reactions'
    FB.api(dest, {
      access_token: user_access_token
    }, function(response){
      if((response.data != undefined)&&(response.data.length != 0)){
        for(i = 0; i < response.data.length; i++){
          reactionArray.push(response.data[i].type);
        }
        var nextURL = response.paging.next;
        while(nextURL != undefined){
          nextURL = evaluateReactionAndIteratePage(nextURL)
        }
      }
    })
  }
  callback2()
  return;
}

function evaluateReactionAndIteratePage(nextURL){
  FB.api(nextURL, function(response){
      if(response.data != undefined){
        for(i = 0; i < response.data.length; i++){
          reactionArray.push(response.data[i].type);
        }
      }
      return response.paging.next
  })
}

function printIds(){
  console.log(ids)
}
