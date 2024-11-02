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

    const betAmountInput = document.getElementById("betAmount");
    const betButton = document.getElementById("betButton");
    const notificationDisplay = document.querySelector(".notification");
    const challengeListContainer = document.getElementById("challengeList");

    let currentPlayer = {
        id: "player1", // Example player ID, should be unique per user
        money: 1000
    };

    // Sync player data
    async function syncPlayerData() {
        const playerRef = db.collection("players").doc(currentPlayer.id);
        const playerSnapshot = await playerRef.get();
        if (playerSnapshot.exists) {
            currentPlayer.money = playerSnapshot.data().money;
            console.log("Player data loaded:", currentPlayer);
        } else {
            await playerRef.set({ money: currentPlayer.money });
            console.log("Player data initialized:", currentPlayer);
        }
    }

    // Create a challenge
    betButton.addEventListener("click", async () => {
        const betAmount = parseInt(betAmountInput.value, 10);
        if (betAmount > 0 && betAmount <= currentPlayer.money) {
            try {
                await db.collection("challenges").add({
                    challengerId: currentPlayer.id,
                    amount: betAmount,
                    status: "pending"
                });
                notificationDisplay.textContent = "Challenge created! Waiting for an opponent.";
                console.log("Challenge created with amount:", betAmount);
            } catch (error) {
                console.error("Error creating challenge:", error);
            }
        } else {
            notificationDisplay.textContent = "Invalid bet amount.";
        }
    });

    // Fetch and display active challenges
    function fetchChallenges() {
        db.collection("challenges")
            .where("status", "==", "pending")
            .onSnapshot((snapshot) => {
                challengeListContainer.innerHTML = ""; // Clear current list
                if (snapshot.empty) {
                    console.log("No active challenges found.");
                } else {
                    snapshot.forEach((doc) => {
                        const challenge = doc.data();
                        console.log("Active challenge found:", challenge);
                        if (challenge.challengerId !== currentPlayer.id) {
                            const challengeItem = document.createElement("div");
                            challengeItem.classList.add("challenge-item");
                            challengeItem.innerHTML = `
                                <p>Challenge by ${challenge.challengerId} - Amount: $${challenge.amount}</p>
                                <button class="accept-btn" data-id="${doc.id}">Accept</button>
                            `;
                            challengeListContainer.appendChild(challengeItem);
                        }
                    });
                }
            });
    }

    // Accept a challenge
    challengeListContainer.addEventListener("click", async (event) => {
        if (event.target.classList.contains("accept-btn")) {
            const challengeId = event.target.getAttribute("data-id");
            const challengeDoc = await db.collection("challenges").doc(challengeId).get();

            if (challengeDoc.exists) {
                const challenge = challengeDoc.data();
                const betAmount = challenge.amount;

                if (currentPlayer.money >= betAmount) {
                    const challengerRef = db.collection("players").doc(challenge.challengerId);
                    const challengerSnapshot = await challengerRef.get();

                    if (challengerSnapshot.exists && challengerSnapshot.data().money >= betAmount) {
                        currentPlayer.money -= betAmount;
                        await db.collection("players").doc(currentPlayer.id).update({ money: currentPlayer.money });

                        const challengerMoney = challengerSnapshot.data().money - betAmount;
                        await challengerRef.update({ money: challengerMoney });

                        const playerMultiplier = parseFloat((Math.random() * 3).toFixed(2));
                        const opponentMultiplier = parseFloat((Math.random() * 3).toFixed(2));

                        let winner, winnings;
                        if (playerMultiplier > opponentMultiplier) {
                            winner = currentPlayer.id;
                            winnings = betAmount * playerMultiplier;
                            currentPlayer.money += winnings;
                            await db.collection("players").doc(currentPlayer.id).update({ money: currentPlayer.money });
                        } else if (opponentMultiplier > playerMultiplier) {
                            winner = challenge.challengerId;
                            winnings = betAmount * opponentMultiplier;
                            await challengerRef.update({ money: challengerMoney + winnings });
                        } else {
                            notificationDisplay.textContent = "It's a tie! No winnings.";
                            return;
                        }

                        notificationDisplay.textContent = `Winner: ${winner}! Multiplier: ${winner === currentPlayer.id ? playerMultiplier : opponentMultiplier}. Winnings: $${winnings}`;

                        // Mark challenge as completed
                        await db.collection("challenges").doc(challengeId).update({ status: "completed" });
                    } else {
                        notificationDisplay.textContent = "Opponent does not have enough funds.";
                    }
                } else {
                    notificationDisplay.textContent = "You don't have enough funds to accept this bet.";
                }
            }
        }
    });

    // Load player data and active challenges on page load
    syncPlayerData();
    fetchChallenges();
});

