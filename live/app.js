const auth = firebase.auth();

const whenSignedIn  = id('whenSignedIn');
const whenSignedOut = id('whenSignedOut');

const signInBtn     = id('signInBtn');
const signOutBtn    = id('signOutBtn');

const userDetails   = id('userDetails');

const provider      = new firebase.auth.GoogleAuthProvider();

// Sign in event handlers

signInBtn.onclick = () => auth.signInWithPopup(provider);
signOutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged(user => {
    if (user) {
        // signed in
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p>`;
    } else {
        // not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = '';
    }
});

// Firestore

const db = firebase.firestore();

const listUpdate = document.getElementById('listUpdate');
const thingsList  = document.getElementById('thingsList');

let gamesListRef;
let unsubscribe;

auth.onAuthStateChanged(user => {
    if (user) {
        listUpdate.onclick = () => {
            listUpdate.hidden = true;
            update_database();
        }
    } 
});