// Copyright 2018, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// Import the Dialogflow module from the Actions on Google client library.
const {
  dialogflow,
  BasicCard,
  Permission,
  Suggestions,
  Carousel,
  Image,
} = require('actions-on-google');

// Import the firebase-functions package for deployment.
const functions = require('firebase-functions');

//Import firebase admin and initialize
const admin = require('firebase-admin');
admin.initializeApp();

// Instantiate the Dialogflow client.
const app = dialogflow({debug: true});


app.intent('Score', (conv, {Teams, Teams1}) => {
 const match = conv.user.storage.currentMatch;
 if (!match) {
   // Ask user missing data
   if(!Teams){
     conv.ask("Please tell me the teams that play the match");
   }else if(!Teams1){
     conv.ask("and the other team?");
   }else{
     return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
       let score = snapshot.child("score1").val();
       let score1 = snapshot.child("score2").val();
       let isFinish = snapshot.child("isFinish").val();

       conv.close(`The score was ${Teams} ${score},  ${Teams1} ${score1}`);  

    });
   }
 } else {
   let Teams = conv.user.storage.team1;
   let Teams1 = conv.user.storage.team2;
   return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
     let score = snapshot.child("score1").val();
     let score1 = snapshot.child("score2").val();
     let isFinish = snapshot.child("isFinish").val();

     conv.ask(`The current score is ${Teams} ${score},  ${Teams1} ${score1}`);
     conv.ask(new Suggestions('home 3 points 12', 'away double number 4'));

  });
 }
});

// Handle the Dialogflow intent named 'EndMatch'.
app.intent('Add points', (conv,{Status, points, number}) => {
  let Teams = conv.user.storage.team1;
  let Teams1 = conv.user.storage.team2;
  let updates = {};
  let scoreString = "";
  let poitsValue = 0;

  if(Status == "Home"){
    scoreString = "score1"
  }else if(Status == "Away"){
    scoreString = "score2"
  }

  if(points == "1 point"){
    poitsValue = 1;
  }else if(points == "2 points"){
    poitsValue = 2;
  }else if(points == "3 points"){
    poitsValue = 3;
  }

  return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
      let score = snapshot.child(scoreString).val();
      updates[`/teams/${Teams}/${Teams1}/${scoreString}`] =score+poitsValue ;
      conv.ask(`${points} number ${number}`);
      return admin.database().ref().update(updates);
      });
});

// Handle the Dialogflow intent named 'EndMatch'.
app.intent('EndMatch', (conv) => {
  let Teams = conv.user.storage.team1;
  let Teams1 = conv.user.storage.team2;
  let updates = {};
  conv.user.storage.currentMatch = false;
  updates[`/teams/${Teams}/${Teams1}/isFinish`] = true;

  return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
      let score = snapshot.child("score1").val();
      let score1 = snapshot.child("score2").val();
      conv.close(`The match end with score of ${Teams} ${score},  ${Teams1} ${score1}`);
      return admin.database().ref().update(updates);

      });
});

// Handle the Dialogflow intent named 'Track Match'.
app.intent('Track Match', (conv,{Teams, Teams1}) => {
  conv.user.storage.team1 = Teams;
  conv.user.storage.team2 = Teams1;

  //Read the match details from the database
  return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
      let score = snapshot.child("score1").val();
      let score1 = snapshot.child("score2").val();
      let isFinish = snapshot.child("isFinish").val();
      //conv.ask(`Score1: ${score}`);
      if(isFinish){
        conv.close(`The match finish with a score of ${Teams}  ${score}, ${Teams1}  ${score1}`)
      }else {
        conv.user.storage.currentMatch = true;
        conv.ask(`Tracking match ${Teams} vs ${Teams1}, For ${Teams} points say home and for ${Teams1} points say away `);
        conv.ask(new Suggestions('home 3 points 12', 'away double number 4'));
      }
    });


});



// Handle the Dialogflow intent named 'Information'.
app.intent('Information', (conv) => {
  conv.ask("You can track and add the score of a current match by saying 'Track match' or you can ask a match score, What you want to do?");
  conv.ask(new Suggestions('Track match', 'Score of'));
});

// Handle the Dialogflow intent named 'Default Welcome Intent'.
app.intent('Default Welcome Intent', (conv) => {
 const match = conv.user.storage.currentMatch;
 if (!match) {
   // Asks the user's permission to know their name, for personalization.
   conv.ask("Welcome to Basketball Feed, What do you want to do ?");
   conv.ask(new Suggestions('What can i do?', 'Track match', 'Score of'));
 } else {
   let Teams = conv.user.storage.team1;
   let Teams1 = conv.user.storage.team2;
   return admin.database().ref(`/teams/${Teams}/${Teams1}`).once("value", (snapshot) => {
       let score = snapshot.child("score1").val();
       let score1 = snapshot.child("score2").val();
       let isFinish = snapshot.child("isFinish").val();

       if(isFinish){
         conv.ask(`The match finish with a score of ${Teams}  ${score}, ${Teams1}  ${score1}`)
       }else{
         conv.user.storage.currentMatch = true;
         conv.ask(`The current score is ${Teams} ${score},  ${Teams1} ${score1}`);
         conv.ask(new Suggestions('home 3 points 12', 'away double number 4'));
       }
     });
 }
});



// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
