document.addEventListener("DOMContentLoaded", () => {
    // Firebase configuration (replace with your Firebase project's configuration)
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
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(app);

    // Select DOM elements
    const betAmountInput = document.getElementById("betAmount");
    const betButton = document.getElementById("betButton");
    const multiplierDisplay = document.querySelector(".mltplier-display");
    const moneyDisplay = document.querySelector(".money-display");
    const notificationDisplay = document.querySelector(".notification");

    // Check if elements exist
    if (!betAmountInput || !betButton || !multiplierDisplay || !moneyDisplay || !notificationDisplay) {
        console.error("One or more elements are missing in the HTML. Please check your element IDs and classes.");
        return;
    }

    let currentPlayer = {
        id: "player1", // Change this to a unique ID for each player (e.g., using Firebase Auth)
        money: 1000
    };

    // Update player's money display
    function updateMoneyDisplay() {
        moneyDisplay.textContent = `Balance: $${currentPlayer.money}`;
    }

    // Sync player data with Firestore
    async function syncPlayerData() {
        const playerRef = db.collection("players").doc(currentPlayer.id);
        const playerSnapshot = await playerRef.get();
        if (playerSnapshot.exists) {
            currentPlayer.money = playerSnapshot.data().money;
            updateMoneyDisplay();
        } else {
            // Initialize player data if it doesn't exist
            await playerRef.set({ money: currentPlayer.money });
        }
    }

    // Handle creating a 1v1 challenge
    betButton.addEventListener("click", async () => {
        const betAmount = parseInt(betAmountInput.value, 10);
        if (betAmount > 0 && betAmount <= currentPlayer.money) {
            // Create a challenge in Firestore
            await db.collection("challenges").add({
                challengerId: currentPlayer.id,
                amount: betAmount,
                status: "pending"
            });
            notificationDisplay.textContent = "1v1 challenge created! Waiting for an opponent.";
        } else {
            notificationDisplay.textContent = "Invalid bet amount. Please try again.";
        }
    });

    // Listen for challenge acceptance
    db.collection("challenges")
        .where("status", "==", "pending")
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === "added") {
                    const challenge = change.doc.data();
                    
                    // Skip if the challenge was created by the current player
                    if (challenge.challengerId !== currentPlayer.id) {
                        if (confirm(`Accept challenge from ${challenge.challengerId} for $${challenge.amount}?`)) {
                            await acceptChallenge(change.doc.id, challenge);
                        }
                    }
                }
            });
        });

    // Accept a challenge and resolve winner
    async function acceptChallenge(challengeId, challenge) {
        const betAmount = challenge.amount;
        const challengerId = challenge.challengerId;

        // Deduct bet amount from both players if they have enough funds
        if (currentPlayer.money >= betAmount) {
            // Get the challenger data from Firestore
            const challengerRef = db.collection("players").doc(challengerId);
            const challengerSnapshot = await challengerRef.get();
            
            if (challengerSnapshot.exists && challengerSnapshot.data().money >= betAmount) {
                // Update both players' money in Firestore
                currentPlayer.money -= betAmount;
                await db.collection("players").doc(currentPlayer.id).update({ money: currentPlayer.money });

                const challengerMoney = challengerSnapshot.data().money - betAmount;
                await challengerRef.update({ money: challengerMoney });

                // Generate random multipliers and determine the winner
                const playerMultiplier = parseFloat((Math.random() * 3).toFixed(2));
                const opponentMultiplier = parseFloat((Math.random() * 3).toFixed(2));
                
                let winner, winnings;
                if (playerMultiplier > opponentMultiplier) {
                    winner = currentPlayer.id;
                    winnings = betAmount * playerMultiplier;
                    currentPlayer.money += winnings;
                    await db.collection("players").doc(currentPlayer.id).update({ money: currentPlayer.money });
                } else if (opponentMultiplier > playerMultiplier) {
                    winner = challengerId;
                    winnings = betAmount * opponentMultiplier;
                    await challengerRef.update({ money: challengerMoney + winnings });
                } else {
                    notificationDisplay.textContent = "It's a tie! No winnings.";
                    return;
                }

                notificationDisplay.textContent = `Winner: ${winner}! Multiplier: ${winner === currentPlayer.id ? playerMultiplier : opponentMultiplier}. Winnings: $${winnings}`;
                updateMoneyDisplay();

                // Mark the challenge as completed
                await db.collection("challenges").doc(challengeId).update({ status: "completed" });
            } else {
                notificationDisplay.textContent = "Opponent does not have enough funds.";
            }
        } else {
            notificationDisplay.textContent = "You don't have enough funds to accept this bet.";
        }
    }

    // Initialize player data on page load
    syncPlayerData();
});
