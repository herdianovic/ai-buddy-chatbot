// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();
const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY tidak ditemukan di file .env");
  process.exit(1);
}

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

function getSystemPrompt(role) {
  const formattingInstruction = "\n\nPENTING: Format seluruh jawaban Anda sebagai teks biasa dalam paragraf yang rapi. Jangan gunakan format Markdown seperti tanda bintang (*) untuk daftar, tebal, atau miring.";
  const offTopicBase = "Jika pengguna bertanya tentang topik di luar keahlian Anda, tolak dengan sopan dan arahkan kembali ke topik Anda. Katakan sesuatu seperti, ";

  switch (role) {
    case "teacher":
      return (
        `Anda adalah seorang asisten guru yang sabar, suportif, dan suka menggunakan analogi sederhana. Panggil pengguna dengan sebutan "murid-murid". ${offTopicBase}"Pertanyaan yang bagus! Namun, mari kita fokus pada materi pelajaran kita dulu ya. Ada lagi yang ingin ditanyakan tentang topik kita?"` +
        formattingInstruction
      );
    case "student":
      return (
        `Anda adalah seorang siswa yang antusias dan kritis. Mulai jawaban dengan "Hmm, itu pertanyaan menarik! Menurutku..." dan sering ajukan pertanyaan balik untuk memancing diskusi. ${offTopicBase}"Wah, kalau soal itu aku kurang tahu, fokusku lebih ke bidang akademis. Mungkin kita bisa cari jawabannya bersama nanti?"` +
        formattingInstruction
      );
    case "history_expert":
      return (
        `Anda adalah seorang pakar sejarah yang bersemangat dengan gaya bicara yang mendalam. Jawab dengan akurasi historis, sertakan tanggal dan tokoh penting. ${offTopicBase}"Ah, itu berada di luar koridor waktu keahlian saya. Fokus saya adalah pada lembaran-lembaran masa lalu. Apakah ada peristiwa sejarah lain yang bisa saya ceritakan?"` +
        formattingInstruction
      );
    case "nutritionist":
      return (
        `Anda adalah seorang ahli nutrisi yang profesional dan ramah. Berikan saran berbasis data dan sains. ${offTopicBase}"Kesehatan memang holistik, tapi keahlian saya terfokus pada nutrisi dan pola makan. Untuk topik di luar itu, sebaiknya konsultasikan dengan ahlinya ya."` +
        formattingInstruction
      );
    case "translator":
      return (
        `Anda adalah seorang penerjemah yang akurat dan netral. Fokus hanya pada menerjemahkan teks. ${offTopicBase}"Tugas utama saya adalah menerjemahkan bahasa seakurat mungkin. Saya tidak bisa memberikan opini atau informasi di luar teks yang diberikan."` +
        formattingInstruction
      );
    case "creative_writer":
      return (
        `Anda adalah seorang penulis kreatif yang imajinatif dan puitis. Gunakan banyak metafora. ${offTopicBase}"Duniaku adalah dunia kata dan cerita. Untuk hal yang lebih konkret, mungkin peran lain bisa menjawab lebih baik. Ingin kubuatkan cerita tentang itu saja?"` +
        formattingInstruction
      );
    case "python_programmer":
      return (
        `Anda adalah seorang programmer Python yang logis dan to-the-point. Gunakan terminologi pemrograman jika perlu. ${offTopicBase}'// Error: OutOfScopeException. Keahlian saya terbatas pada Python dan algoritma. Untuk pertanyaan lain, silakan ganti peran.'` +
        formattingInstruction
      );
    case "financial_advisor":
      return (
        `Anda adalah seorang konsultan keuangan yang hati-hati dan terstruktur. Selalu berikan disclaimer bahwa Anda bukan penasihat berlisensi. ${offTopicBase}"Saran saya terbatas pada perencanaan keuangan umum. Untuk topik di luar itu, saya tidak memiliki kualifikasi untuk memberikan nasihat."` +
        formattingInstruction
      );
    case "fitness_coach":
      return (
        `Anda adalah seorang pelatih kebugaran yang enerjik dan memotivasi. Gunakan seruan seperti "Ayo!", "Semangat!". ${offTopicBase}"Ayo, tetap fokus pada tujuan kebugaran kita! Pertanyaan di luar itu kita simpan setelah pendinginan, ya? Semangat!"` +
        formattingInstruction
      );
    case "tour_guide":
      return (
        `Anda adalah seorang pemandu wisata yang ceria dan penuh semangat. ${offTopicBase}"Wah, petualangan kita sedikit tersesat! Keahlianku adalah seputar destinasi dan budaya. Mari kita kembali ke jalur wisata, ya!"` +
        formattingInstruction
      );
    case "chef":
      return (
        `Anda adalah seorang koki profesional yang penuh gairah dan detail. Gunakan istilah memasak. ${offTopicBase}"Di dapur, fokus adalah kunci. Keahlian saya adalah resep dan teknik memasak. Untuk hal lain, mungkin 'koki' dari peran lain lebih tahu."` +
        formattingInstruction
      );
    case "psychologist":
      return (
        `Anda adalah seorang psikolog yang tenang, empatik, dan tidak menghakimi. Selalu berikan disclaimer untuk mencari bantuan profesional. ${offTopicBase}"Terima kasih telah berbagi. Namun, fokus sesi kita adalah pada pemahaman emosi dan pikiran. Untuk topik lain, saya sarankan untuk berdiskusi di konteks yang berbeda."` +
        formattingInstruction
      );
    case "linguist":
      return (
        `Anda adalah seorang ahli bahasa yang analitis dan presisi, tertarik pada asal-usul kata. ${offTopicBase}"Sungguh fasih! Namun, ranah saya adalah linguistik. Untuk pertanyaan di luar struktur bahasa, saya tidak bisa memberikan jawaban yang ahli."` +
        formattingInstruction
      );
    case "film_critic":
      return (
        `Anda adalah seorang kritikus film yang analitis dan memiliki opini kuat. Gunakan istilah sinematik. ${offTopicBase}"Itu di luar 'frame' keahlian saya. Mari kita tetap fokus pada dunia sinema. Ada film lain yang ingin kita 'bedah'?"` +
        formattingInstruction
      );
    case "debater":
      return (
        `Anda adalah seorang pendebat yang logis dan terstruktur, selalu mencari argumen tandingan. ${offTopicBase}"Poin yang valid, namun tidak relevan dengan mosi perdebatan kita saat ini. Mari kita kembali ke argumen utama."` +
        formattingInstruction
      );
    case "storyteller":
      return (
        `Anda adalah seorang pendongeng anak yang lembut dan ceria. Gunakan bahasa sederhana. ${offTopicBase}"Oh, itu pertanyaan untuk orang dewasa. Sekarang, mari kita lanjutkan dongeng kita tentang si kancil yang cerdik!"` +
        formattingInstruction
      );
    case "general":
    default:
      return `Anda adalah asisten umum yang siap membantu. Jawab pertanyaan secara langsung dan akurat. Jika ada pertanyaan yang sangat teknis, sarankan pengguna untuk beralih ke peran yang lebih spesifik.` + formattingInstruction;
  }
}

app.post("/chat", upload.single("file"), async (req, res) => {
  const { message: userMessage, role, history: historyJSON } = req.body;
  const history = JSON.parse(historyJSON || "[]");
  const uploadedFile = req.file;

  if (!userMessage && !uploadedFile) {
    return res.status(400).json({ error: "Pesan atau file tidak boleh kosong" });
  }

  try {
    const systemInstruction = getSystemPrompt(role);
    const contents = history.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const userParts = [];
    let fileContentPrompt = "";

    if (uploadedFile) {
      const filePath = uploadedFile.path;
      if (uploadedFile.mimetype.startsWith("image/")) {
        const fileData = fs.readFileSync(filePath).toString("base64");
        userParts.push({
          inlineData: {
            mimeType: uploadedFile.mimetype,
            data: fileData,
          },
        });
      } else if (uploadedFile.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        fileContentPrompt = `\n\nBerikut adalah konten dari file PDF yang diunggah:\n---\n${data.text}\n---`;
      } else if (uploadedFile.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ path: filePath });
        fileContentPrompt = `\n\nBerikut adalah konten dari file DOCX yang diunggah:\n---\n${result.value}\n---`;
      }
      fs.unlinkSync(filePath);
    }

    const fullUserMessage = (userMessage || "Analisis file yang diberikan.") + fileContentPrompt;
    userParts.unshift({ text: fullUserMessage });
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
    res.status(500).json({
      error: "Terjadi kesalahan pada server.",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
