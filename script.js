// Initial player balance
let balance = 1000;
document.getElementById('balance').textContent = balance;

// Betting function
document.getElementById('betButton').addEventListener('click', placeBet);

function placeBet() {
    const betAmount = parseInt(document.getElementById('betAmount').value);
    const multiplierBox = document.getElementById('multiplierBox');
    const resultBox = document.getElementById('resultBox');

    // Validate bet amount
    if (isNaN(betAmount) || betAmount < 1 || betAmount > balance) {
        alert('Enter a valid bet amount within your balance.');
        return;
    }

    // Generate random multipliers for both players (range 1.0 to 3.0)
    const player1Multiplier = (Math.random() * 2 + 1).toFixed(2);
    const player2Multiplier = (Math.random() * 2 + 1).toFixed(2);

    // Display multipliers
    multiplierBox.innerHTML = `
        Your Multiplier: ${player1Multiplier} <br>
        Opponent's Multiplier: ${player2Multiplier}
    `;

    // Determine winner
    if (player1Multiplier > player2Multiplier) {
        const winnings = (betAmount * player1Multiplier).toFixed(2);
        balance += parseFloat(winnings) - betAmount; // Win amount after subtracting bet
        resultBox.textContent = `You win $${winnings}! Your new balance is $${balance}.`;
    } else if (player1Multiplier < player2Multiplier) {
        balance -= betAmount;
        resultBox.textContent = `You lose! Your new balance is $${balance}.`;
    } else {
        resultBox.textContent = `It's a tie! No money lost.`;
    }

    // Update balance display
    document.getElementById('balance').textContent = balance;
}
