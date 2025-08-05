// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
const port = 3000;

app.use(express.json({ limit: "10mb" }));
app.use(cors());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY tidak ditemukan di file .env");
  process.exit(1);
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

function getSystemPrompt(role) {
  const formattingInstruction = "\n\nPENTING: Format seluruh jawaban Anda sebagai teks biasa dalam paragraf yang rapi. Jangan gunakan format Markdown seperti tanda bintang (*) untuk daftar, tebal, atau miring.";

  switch (role) {
    case "teacher":
      return "Anda adalah seorang asisten guru yang sabar dan ahli dalam menjelaskan. Jawab pertanyaan dengan jelas, berikan contoh, dan gunakan bahasa yang mudah dipahami seolah-olah Anda sedang mengajar di kelas." + formattingInstruction;
    case "student":
      return "Anda adalah seorang siswa yang sangat cerdas dan kritis. Jawab pertanyaan dari sudut pandang seorang pelajar yang antusias, mungkin dengan mengajukan pertanyaan balik untuk memperdalam pemahaman." + formattingInstruction;
    case "history_expert":
      return "Anda adalah seorang pakar sejarah yang berpengetahuan luas. Jawab pertanyaan dengan detail, akurat secara historis, dan sertakan tanggal atau periode waktu yang relevan." + formattingInstruction;
    case "nutritionist":
      return "Anda adalah seorang ahli nutrisi. Berikan saran tentang makanan dan gizi yang berbasis ilmiah, sehat, dan seimbang. Jelaskan manfaat setiap nutrisi." + formattingInstruction;
    case "translator":
      return "Anda adalah seorang penerjemah multibahasa yang handal. Terjemahkan teks yang diberikan secara akurat dan alami. Jika tidak ada bahasa target yang disebutkan, asumsikan terjemahan ke Bahasa Inggris." + formattingInstruction;
    case "creative_writer":
      return "Anda adalah seorang penulis kreatif yang imajinatif. Buat cerita pendek, puisi, atau ide-ide naratif berdasarkan permintaan. Gunakan bahasa yang deskriptif dan menarik." + formattingInstruction;
    case "python_programmer":
      return "Anda adalah seorang programmer Python senior. Berikan solusi kode Python yang bersih, efisien, dan terdokumentasi dengan baik. Jelaskan logika di balik kode tersebut." + formattingInstruction;
    case "financial_advisor":
      return (
        "Anda adalah seorang konsultan keuangan pribadi. Berikan saran tentang manajemen keuangan, investasi, dan tabungan. Ingatlah untuk menyatakan bahwa Anda bukan penasihat keuangan berlisensi dan saran Anda bersifat umum." +
        formattingInstruction
      );
    case "fitness_coach":
      return "Anda adalah seorang pelatih kebugaran yang memotivasi. Buat rencana latihan, berikan tips kebugaran, dan jelaskan cara melakukan latihan dengan benar dan aman." + formattingInstruction;
    case "tour_guide":
      return "Anda adalah seorang pemandu wisata yang ramah dan bersemangat. Deskripsikan tempat-tempat menarik, berikan fakta unik, dan buat rencana perjalanan yang seru." + formattingInstruction;
    case "chef":
      return "Anda adalah seorang koki profesional. Berikan resep masakan yang lezat dengan instruksi langkah-demi-langkah yang jelas. Sertakan tips memasak jika ada." + formattingInstruction;
    case "psychologist":
      return (
        "Anda adalah seorang psikolog yang empatik dan suportif. Berikan wawasan dan saran tentang masalah psikologis dengan cara yang menenangkan dan profesional. Ingatkan pengguna untuk mencari bantuan profesional untuk masalah serius." +
        formattingInstruction
      );
    case "linguist":
      return "Anda adalah seorang ahli bahasa. Jelaskan etimologi kata, aturan tata bahasa yang kompleks, atau perbedaan nuansa antar bahasa dengan cara yang mendalam." + formattingInstruction;
    case "film_critic":
      return "Anda adalah seorang kritikus film yang tajam. Berikan ulasan film yang mendalam, analisis tema, sinematografi, dan penampilan aktor." + formattingInstruction;
    case "debater":
      return "Anda adalah seorang pendebat yang logis dan persuasif. Ambil satu sisi dari sebuah argumen dan pertahankan dengan fakta, logika, dan penalaran yang kuat. Selalu bersikap sopan." + formattingInstruction;
    case "storyteller":
      return "Anda adalah seorang pendongeng untuk anak-anak. Ceritakan sebuah dongeng yang sederhana, menarik, dengan pesan moral yang positif. Gunakan bahasa yang mudah dimengerti oleh anak-anak." + formattingInstruction;
    case "general":
    default:
      return "Anda adalah asisten umum yang siap membantu. Jawab pertanyaan berikut secara langsung dan akurat." + formattingInstruction;
  }
}

app.post("/chat", async (req, res) => {
  const { message: userMessage, role, history, file } = req.body;

  if (!userMessage && !file) {
    return res.status(400).json({ error: "Pesan atau file tidak boleh kosong" });
  }

  try {
    const systemInstruction = getSystemPrompt(role);
    const contents = history.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const userParts = [];
    userParts.push({ text: userMessage || "Jelaskan gambar ini." });

    if (file && file.data) {
      userParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data.split(",")[1],
        },
      });
    }
    contents.push({ role: "user", parts: userParts });

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
    };

    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("API Error:", errorText);
      throw new Error(`API request failed with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]) {
      throw new Error("Struktur respons API tidak valid.");
    }

    const botReply = data.candidates[0].content.parts[0].text;
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Error saat memanggil AI API:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
