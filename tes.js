import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const db = getFirestore(app);

// Fungsi ini bisa kamu panggil saat Game Over
async function submitScore(playerName, playerScore) {
  try {
    const docRef = await addDoc(collection(db, "leaderboard"), {
      name: playerName,
      score: playerScore,
      createdAt: serverTimestamp()
    });
    console.log("Skor tersimpan dengan ID: ", docRef.id);
    alert("Skor berhasil masuk ke Firebase!");
  } catch (e) {
    console.error("Error nambahin skor: ", e);
  }
}

// Coba panggil secara manual untuk tes
// submitScore("Dito", 100);