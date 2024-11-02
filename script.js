// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbSyocu6e8t7UTLJ4VBwULgBxt38ggw1k",
    authDomain: "casino777-7.firebaseapp.com",
    projectId: "casino777-7",
    storageBucket: "casino777-7.appspot.com",
    messagingSenderId: "824259346500",
    appId: "1:824259346500:web:1ace23689863864cc23c11",
    measurementId: "G-LHMDCMRY9E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Request Page Elements
const betAmountInput = document.getElementById('betAmount');
const createRequestButton = document.getElementById('createRequest');
const availableRequestsDiv = document.getElementById('availableRequests');

// Create a new bet request
createRequestButton.addEventListener('click', () => {
    const betAmount = parseInt(betAmountInput.value);
    if (isNaN(betAmount) || betAmount < 1) {
        alert("Enter a valid bet amount.");
        return;
    }

    db.collection("bets").add({
        amount: betAmount,
        status: "open",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Bet request created!");
        betAmountInput.value = "";
    }).catch(error => {
        console.error("Error creating request: ", error);
    });
});

// Fetch and display open requests
function fetchRequests() {
    db.collection("bets")
      .where("status", "==", "open")
      .onSnapshot(snapshot => {
          availableRequestsDiv.innerHTML = "";
          snapshot.forEach(doc => {
              const data = doc.data();
              const requestItem = document.createElement('div');
              requestItem.textContent = `Bet: $${data.amount}`;
              const joinButton = document.createElement('button');
              joinButton.textContent = "Join Bet";
              joinButton.addEventListener('click', () => acceptBet(doc.id));
              requestItem.appendChild(joinButton);
              availableRequestsDiv.appendChild(requestItem);
          });
      });
}

// Accept a bet request
function acceptBet(requestId) {
    db.collection("bets").doc(requestId).update({
        status: "accepted"
    }).then(() => {
        window.location.href = `1v1.html?requestId=${requestId}`;
    }).catch(error => {
        console.error("Error accepting bet: ", error);
    });
}

fetchRequests();
