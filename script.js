// script.js
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

const menuBtn = document.getElementById("header-menu-btn");
const roleMenu = document.getElementById("role-menu");
const headerSubtitle = document.getElementById("header-subtitle");
const headerAvatar = document.getElementById("header-avatar");

const attachBtn = document.getElementById("attach-btn");
const fileInput = document.getElementById("file-input");
const filePreviewContainer = document.getElementById("file-preview-container");
const filePreviewImage = document.getElementById("file-preview-image");
const removeFileBtn = document.getElementById("remove-file-btn");

let attachedFile = null;

const roleAvatars = {
  general: "https://placehold.co/40x40/4A80FF/FFFFFF?text=AI",
  teacher: "https://placehold.co/40x40/34A853/FFFFFF?text=G",
  student: "https://placehold.co/40x40/FBBC05/FFFFFF?text=S",
  history_expert: "https://placehold.co/40x40/8E44AD/FFFFFF?text=H",
  nutritionist: "https://placehold.co/40x40/2ECC71/FFFFFF?text=N",
  translator: "https://placehold.co/40x40/3498DB/FFFFFF?text=T",
  creative_writer: "https://placehold.co/40x40/E74C3C/FFFFFF?text=P",
  python_programmer: "https://placehold.co/40x40/16A085/FFFFFF?text=Py",
  financial_advisor: "https://placehold.co/40x40/F39C12/FFFFFF?text=F",
  fitness_coach: "https://placehold.co/40x40/D35400/FFFFFF?text=C",
  tour_guide: "https://placehold.co/40x40/2980B9/FFFFFF?text=Tg",
  chef: "https://placehold.co/40x40/C0392B/FFFFFF?text=K",
  psychologist: "https://placehold.co/40x40/9B59B6/FFFFFF?text=Ps",
  linguist: "https://placehold.co/40x40/7F8C8D/FFFFFF?text=L",
  film_critic: "https://placehold.co/40x40/2C3E50/FFFFFF?text=FC",
  debater: "https://placehold.co/40x40/E67E22/FFFFFF?text=D",
  storyteller: "https://placehold.co/40x40/1ABC9C/FFFFFF?text=St",
};

const chatHistories = {
  general: [{ sender: "bot", content: "Halo! Saya adalah Asisten Umum. Ada yang bisa saya bantu?" }],
  teacher: [{ sender: "bot", content: "Halo! Saya adalah Asisten Guru. Mari kita bahas materi pelajaran hari ini." }],
  student: [{ sender: "bot", content: "Halo! Saya adalah Siswa Cerdas. Ada topik menarik yang ingin didiskusikan?" }],
  history_expert: [{ sender: "bot", content: "Salam! Saya Pakar Sejarah. Peristiwa historis apa yang ingin Anda ketahui?" }],
  nutritionist: [{ sender: "bot", content: "Selamat datang! Saya Ahli Nutrisi. Apa tujuan kesehatan Anda?" }],
  translator: [{ sender: "bot", content: "Hello! I am a Translator. Teks apa yang perlu saya terjemahkan?" }],
  creative_writer: [{ sender: "bot", content: "Imajinasi menanti. Saya Penulis Kreatif, mari kita ciptakan sebuah cerita." }],
  python_programmer: [{ sender: "bot", content: '`print("Hello, World!")` Saya Programmer Python. Ada masalah kode yang bisa saya bantu selesaikan?' }],
  financial_advisor: [{ sender: "bot", content: "Selamat datang di konsultasi keuangan. Mari kita bicarakan tujuan finansial Anda." }],
  fitness_coach: [{ sender: "bot", content: "Siap berkeringat? Saya Pelatih Kebugaran Anda. Mari mulai latihan!" }],
  tour_guide: [{ sender: "bot", content: "Ayo berpetualang! Saya Pemandu Wisata Anda. Destinasi mana yang akan kita jelajahi hari ini?" }],
  chef: [{ sender: "bot", content: "Selamat datang di dapur saya! Saya Koki Profesional. Resep apa yang ingin Anda masak?" }],
  psychologist: [{ sender: "bot", content: "Selamat datang di ruang yang aman. Saya di sini untuk mendengarkan. Apa yang ada di pikiran Anda?" }],
  linguist: [{ sender: "bot", content: "Salam! Saya seorang Ahli Bahasa. Mari kita selami keindahan dan struktur bahasa." }],
  film_critic: [{ sender: "bot", content: "Lampu, kamera, aksi! Saya Kritikus Film. Film apa yang akan kita ulas hari ini?" }],
  debater: [{ sender: "bot", content: "Saya siap berdebat. Topik apa yang akan kita perdebatkan? Saya akan mengambil sisi yang berlawanan." }],
  storyteller: [{ sender: "bot", content: "Pada suatu waktu... Saya Pendongeng Anak. Cerita apa yang ingin kamu dengar?" }],
};
let currentRole = "general";

function appendMessage(sender, content, saveToHistory = true) {
  const messageElement = document.createElement("div");
  const senderClasses = sender.split(" ");
  messageElement.classList.add("message", ...senderClasses);

  const p = document.createElement("p");
  p.innerHTML = content;
  messageElement.appendChild(p);
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (saveToHistory) {
    const contentToSave = sender.includes("loading") ? "" : content;
    if (contentToSave || attachedFile) {
      chatHistories[currentRole].push({ sender: sender.split(" ")[0], content: contentToSave });
    }
  }
  return messageElement;
}

function renderChat(role) {
  chatBox.innerHTML = "";
  chatHistories[role].forEach((msg) => {
    appendMessage(msg.sender, msg.content, false);
  });
}

function clearAttachedFile() {
  attachedFile = null;
  fileInput.value = "";
  filePreviewContainer.style.display = "none";
}

menuBtn.addEventListener("click", () => {
  roleMenu.classList.toggle("hidden");
});

roleMenu.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const selectedRole = e.target.dataset.role;
    if (selectedRole && selectedRole !== currentRole) {
      currentRole = selectedRole;
      headerSubtitle.textContent = `Mode: ${e.target.textContent}`;
      headerAvatar.src = roleAvatars[currentRole];
      renderChat(currentRole);
    }
    roleMenu.classList.add("hidden");
  }
});

document.addEventListener("click", (e) => {
  if (!roleMenu.contains(e.target) && !menuBtn.contains(e.target)) {
    roleMenu.classList.add("hidden");
  }
});

attachBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (event) => {
      attachedFile = {
        data: event.target.result,
        mimeType: file.type,
      };
      filePreviewImage.src = event.target.result;
      filePreviewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

removeFileBtn.addEventListener("click", clearAttachedFile);

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage && !attachedFile) return;

  let messageContent = userMessage;
  if (attachedFile) {
    messageContent += `<br><img src="${attachedFile.data}" alt="uploaded image">`;
  }
  appendMessage("user", messageContent);
  input.value = "";

  const loadingIndicator = appendMessage("bot loading", "<span></span><span></span><span></span>", false);

  try {
    const historyForAPI = chatHistories[currentRole].slice(0, -1);

    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        role: currentRole,
        history: historyForAPI,
        file: attachedFile,
      }),
    });

    clearAttachedFile();
    chatBox.removeChild(loadingIndicator);

    if (!response.ok) throw new Error("Gagal mendapatkan respons dari server.");

    const data = await response.json();
    appendMessage("bot", data.reply);
  } catch (error) {
    console.error("Error:", error);
    if (chatBox.contains(loadingIndicator)) chatBox.removeChild(loadingIndicator);
    appendMessage("bot", "Maaf, sepertinya ada masalah. Coba lagi nanti ya.", false);
    clearAttachedFile();
  }
});

headerSubtitle.textContent = "Mode: Asisten Umum";
headerAvatar.src = roleAvatars[currentRole];
renderChat(currentRole);
