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

// Handle the Dialogflow intent named 'Track Match'.
app.intent('Track Match', (conv,{Teams, Teams1}) => {
  conv.user.storage.team1 = Teams;
  conv.user.storage.team2 = Teams1;

  conv.ask(`Tracking match ${Teams} vs ${Teams1}, For ${Teams} points say home and for ${Teams1} points say away`);
  conv.ask(new Suggestions('home 3 points 12', 'away double number 4'));
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
   conv.ask("Welcome to Basketball Feed, What you want to do ?");
   conv.ask(new Suggestions('What can i do?', 'Track match', 'Score of'));
 } else {
   conv.ask(`Te current score is Nul Fia 34, Dragons 30`);
 }
});



// Set the DialogflowApp object to handle the HTTPS POST request.
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
