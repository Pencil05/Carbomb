"use client";
import { useState, useEffect } from "react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, arrayUnion } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState([]);
  const [message, setMessage] = useState("Welcome to Exploding Cat! 🐱💣");
  const [roomId, setRoomId] = useState(null);
  const [playerName, setPlayerName] = useState("Player1");

  useEffect(() => {
    createSnowEffect();
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      return onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setDeck(data.deck);
          setHand(data.players[playerName]?.hand || []);
          setMessage(data.status);
        }
      });
    }
  }, [roomId, playerName]);

  const resetGame = async () => {
    const newDeck = shuffleDeck(["Cat", "Exploding Cat", "Defuse", "Skip", "Shuffle", "Peek", "Attack", "Favor", "Nope"]);
    setDeck(newDeck);
    setHand(["Defuse"]);
    setMessage("Game reset! Draw a card to begin.");
  };

  const shuffleDeck = (deck) => deck.sort(() => Math.random() - 0.5);

  const drawCard = async () => {
    if (deck.length === 0) {
      setMessage("The deck is empty! The game ends in a draw.");
      return;
    }
  
    const newDeck = [...deck];
    const drawnCard = newDeck.pop();
    setDeck(newDeck);
    setHand([...hand, drawnCard]);
  
    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        deck: newDeck,
        [`players.${playerName}.hand`]: arrayUnion(drawnCard),
      });
    }
  
    if (drawnCard === "Exploding Cat") {
      const defuseIndex = hand.indexOf("Defuse");
      
      if (defuseIndex !== -1) {
        // ลบแค่ 1 ใบ
        let updatedHand = [...hand];
        updatedHand.splice(defuseIndex, 1);
        setHand(updatedHand);
  
        // ใส่ Exploding Cat กลับไปในกองแบบสุ่ม
        newDeck.splice(Math.floor(Math.random() * newDeck.length), 0, "Exploding Cat");
  
        if (roomId) {
          const roomRef = doc(db, "rooms", roomId);
          await updateDoc(roomRef, {
            deck: newDeck,
            [`players.${playerName}.hand`]: updatedHand,
          });
        }
  
        setMessage("You used a Defuse! The Exploding Cat is back in the deck.");
      } else {
        setMessage("💥 You exploded! Game Over.");
      }
    } else {
      setMessage(`You drew: ${drawnCard}`);
    }
  };
  
  const playCard = async (card) => {
    let newHand = hand.filter((c, i) => i !== hand.indexOf(card));
    setHand(newHand);

    const effects = {
      "Skip": "You played Skip! Your turn is skipped.",
      "Shuffle": "You played Shuffle! The deck has been shuffled.",
      "Peek": `You played Peek! Top 3 cards: ${deck.slice(0, 3).join(", ")}`,
      "Attack": "You played Attack! The next player takes two turns.",
      "Favor": "You played Favor! (No target player yet in single-player mode)",
      "Nope": "You played Nope! Cancelled the last action.",
    };

    if (card === "Shuffle") setDeck(shuffleDeck(deck));

    setMessage(effects[card] || `You played ${card}, but nothing happened.`);

    if (roomId) {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`players.${playerName}.hand`]: newHand,
        deck: shuffleDeck(deck),
      });
    }
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
      speed: Math.random() * 1 + 0.1,
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

  const createRoom = async () => {
    try {
      const newRoomId = Math.random().toString(36).substr(2, 9);
      const newRoomData = {
        players: { [playerName]: { hand: ["Defuse"] } },
        deck: shuffleDeck(["Cat", "Exploding Cat", "Defuse", "Skip", "Shuffle", "Peek", "Attack", "Favor", "Nope"]),
        status: "waiting",
      };
  
      // บันทึกลง Local Storage
      localStorage.setItem(`room_${newRoomId}`, JSON.stringify(newRoomData));
  
      setRoomId(newRoomId);
      setMessage("Waiting for players to join...");
    } catch (error) {
      console.error("Error creating room:", error);
      setMessage("Failed to create room. Please try again.");
    }
  };
  
  
  
  const joinRoom = (inputRoomId) => {
    if (!inputRoomId) return;
  
    // ตรวจสอบว่า localStorage มีข้อมูลห้องที่มี ID ตรงกับที่กรอกหรือไม่
    const storedRoom = localStorage.getItem(`room_${inputRoomId}`);
    
    if (!storedRoom) {
      setMessage("Room not found! Please check the Room ID.");
      return;
    }
  
    let roomData = JSON.parse(storedRoom);
  
    // เพิ่มตัวเองเข้าไปในห้อง
    roomData.players[playerName] = { hand: ["Defuse"] };
  
    // บันทึกห้องกลับไปใน localStorage
    localStorage.setItem(`room_${inputRoomId}`, JSON.stringify(roomData));
  
    // ตั้งค่าห้องที่ผู้เล่นเข้าร่วม
    setRoomId(inputRoomId);
    setMessage("Joined the game! Ready to play.");
  };
  

  return (
    <div className="p-4 flex flex-col items-center bg-gray-900 min-h-screen text-white relative w-full max-w-screen-md mx-auto">
      <h1 className="text-2xl font-bold">แมวระเบิด💣</h1>
      <div className="p-4 my-4 border rounded-md shadow-md bg-gray-800 w-full text-center">
        <p>{message}</p>
        {roomId && <p className="mt-2 text-green-400">Room ID: {roomId}</p>}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <button onClick={drawCard} className="px-4 py-2 bg-blue-500 rounded-md">Draw Card</button>
        <button onClick={resetGame} className="px-4 py-2 bg-red-500 rounded-md">Reset Game</button>
        {!roomId ? (
          <>
            <button onClick={createRoom} className="px-4 py-2 bg-green-500 rounded-md">Create Room</button>
            <button onClick={() => joinRoom(prompt("Enter Room ID"))} className="px-4 py-2 bg-yellow-500 rounded-md">Join Room</button>
          </>
        ) : (
          <p>Room ID: {roomId}</p>
        )}
      </div>
      
      <div className="mt-4 w-full">
        <h2 className="font-bold text-center">Your Hand:</h2>
        <div className="flex gap-2 flex-wrap justify-center">
          {hand.map((card, index) => (
            <div key={index} onClick={() => playCard(card)} className="p-4 bg-gray-700 rounded-lg shadow-lg border w-40 h-64 flex flex-col items-center justify-between p-2 cursor-pointer hover:scale-105 transition-transform">
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
