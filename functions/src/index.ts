import * as functions from 'firebase-functions';
import {propertyExist} from './utils';
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
const admin = require('firebase-admin');
admin.initializeApp();


// [START addMessage]
// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
// [START addMessageTrigger]
exports.addMessage = functions.https.onRequest(async (req, res) => {
// [END addMessageTrigger]
    // Grab the text parameter.
    const original = req.query.text;

    // [START adminSdkPush]
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const snapshot = await admin.database().ref('/messages').push({original: original});
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref.toString());
    // [END adminSdkPush]
});
// [END addMessage]

// [START makeUppercase]
// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const original = snapshot.val();
        console.log('Uppercasing', context.params.pushId, original);
        const uppercase = original.toUpperCase();
        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to the Firebase Realtime Database.
        // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
        return snapshot.ref.parent.child('uppercase').set(uppercase);
    });
// [END makeUppercase]
// [END all]

exports.createSample = functions.database.ref('/humanSample/{sampleId}').onCreate((snapshot, context) => {
    const {sampleOf, sampleSetId} = snapshot.val();
    console.log("sampleOf", sampleOf)
    const p1 = snapshot.ref.root.child('patient_sampleSet').child(sampleOf).child(sampleSetId).child('numberSampleCount').transaction((currentSampleCount) => {
        console.log('currentSampleSetCount in patient_sampleSet: ', currentSampleCount)
        return (currentSampleCount || 0) + 1;
    });
    const p2 = snapshot.ref.root.child('sampleSet').child(sampleSetId).child('numberSampleCount').transaction((currentSampleCount) => {

        // return snapshot.ref.root.child('human_sampleSet').transaction((currentSampleSetCount)=>{
        console.log('currentSampleSetCount in sampleSet: ', currentSampleCount)
        return (currentSampleCount || 0) + 1;
    });
    return Promise.all([p1, p2])
});

exports.updateSample = functions.database.ref('/humanSample/{sampleId}').onUpdate((snapshot, context) => {
    const before = snapshot.before;
    const after = snapshot.after;

    //destructs after snapshot object
    const {sampleOf, sampleSetId, url} = after.val();

    if(!propertyExist(before.val() , 'url') && propertyExist(after.val(), 'url')){
        //only use after.ref
        const p1 = after.ref.root.child('patient_sampleSet').child(sampleOf).child(sampleSetId).child('numberUploadedCount').transaction((currentUploadedCount) => {
            console.log('currentUploadedCount in patient_sampleSet: ', currentUploadedCount)
            return (currentUploadedCount || 0) + 1;
        });
        const p2 = after.ref.root.child('sampleSet').child(sampleSetId).child('numberUploadedCount').transaction((currentUploadedCount) => {
            console.log('currentUploadedCount in sampleSet: ', currentUploadedCount)
            return (currentUploadedCount || 0) + 1;
        });
        return Promise.all([p1, p2])
    }
    return Promise.resolve("nothing changed");


});
