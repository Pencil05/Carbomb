"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [message, setMessage] = useState("Welcome to Exploding Cat! 🐱💣");

  useEffect(() => {
    resetGame();
    createSnowEffect();
  }, []);

  const resetGame = () => {
    setDeck(shuffleDeck(["Cat", "Exploding Cat", "Defuse", "Skip", "Shuffle", "Peek", "Attack", "Favor", "Nope"]));
    setHand(["Defuse"]);
    setMessage("Game reset! Draw a card to begin.");
  };

  const shuffleDeck = (deck) => {
    return deck.sort(() => Math.random() - 0.5);
  };

  const drawCard = () => {
    if (deck.length === 0) {
      setMessage("The deck is empty! The game ends in a draw.");
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop();
    setDeck(newDeck);
    setHand([...hand, drawnCard]);

    if (drawnCard === "Exploding Cat") {
      if (hand.includes("Defuse")) {
        let updatedHand = [...hand];
        updatedHand.splice(updatedHand.indexOf("Defuse"), 1);
        setHand(updatedHand);
        newDeck.splice(Math.floor(Math.random() * newDeck.length), 0, "Exploding Cat");
        setMessage("You used a Defuse! The Exploding Cat is back in the deck.");
      } else {
        setMessage("💥 You exploded! Game Over.");
      }
    } else {
      setMessage(`You drew: ${drawnCard}`);
    }
  };

  const playCard = (card) => {
    let newHand = hand.filter((c, i) => i !== hand.indexOf(card));
    setHand(newHand);

    const effects = {
      "Skip": "You played Skip! Your turn is skipped.",
      "Shuffle": "You played Shuffle! The deck has been shuffled.",
      "Peek": `You played Peek! Top 3 cards: ${deck.slice(0, 3).join(", ")}`,
      "Attack": "You played Attack! The next player takes two turns.",
      "Favor": "You played Favor! (No target player yet in single-player mode)",
      "Nope": "You played Nope! Cancelled the last action."
    };

    if (card === "Shuffle") {
      setDeck(shuffleDeck(deck));
    }

    setMessage(effects[card] || `You played ${card}, but nothing happened.`);
  };

  const createSnowEffect = () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = "none";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    let flakes = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.5
    }));

    const updateSnow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach(flake => {
        flake.y += flake.speed;
        if (flake.y > canvas.height) flake.y = 0;
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, " + flake.opacity + ")";
        ctx.fill();
      });
      requestAnimationFrame(updateSnow);
    };

    updateSnow();
  };

  const cardEffects = {
    "Exploding Cat": "If you draw this card without a Defuse, you lose!",
    "Defuse": "Use this to stop an Exploding Cat and put it back in the deck.",
    "Skip": "Skip your turn without drawing a card.",
    "Shuffle": "Shuffle the entire deck.",
    "Peek": "Look at the top 3 cards of the deck.",
    "Attack": "Force the next player to take two turns.",
    "Favor": "Another player must give you a card.",
    "Nope": "Cancel the last action played."
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-900 min-h-screen text-white relative overflow-hidden w-full max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold">Exploding Cat</h1>
      <div className="p-4 my-4 border rounded-md shadow-md bg-gray-800 text-white w-full text-center">
        <p>{message}</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        <button onClick={drawCard} className="px-4 py-2 bg-blue-500 text-white rounded-md">Draw Card</button>
        <button onClick={resetGame} className="px-4 py-2 bg-red-500 text-white rounded-md">Reset Game</button>
      </div>
      <div className="mt-4 w-full">
        <h2 className="font-bold text-center">Your Hand:</h2>
        <div className="flex gap-2 flex-wrap justify-center">
          {hand.map((card, index) => (
            <div key={index} onClick={() => playCard(card)} className="p-4 bg-gray-700 text-white rounded-lg shadow-lg border border-gray-500 w-40 h-64 flex flex-col items-center justify-between p-2 cursor-pointer hover:scale-105 transition-transform">
              <div className="text-lg font-bold text-center">{card}</div>
              <div className="w-24 h-32 bg-gray-500"></div>
              <div className="text-sm italic text-center">{cardEffects[card]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
