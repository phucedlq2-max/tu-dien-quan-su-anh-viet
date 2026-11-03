
"use strict";

/* =========================================================
   TỪ ĐIỂN QUÂN SỰ ANH – VIỆT
   File: app.js
   Dữ liệu: vocabulary.json
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let dictionary = [];
let favorites = new Set();
let activeView = "lookup";
let searchMode = "auto";

let practiceDeck = [];
let practiceIndex = 0;

let quizQuestions = [];
let quizIndex = 0;
let score = 0;
let answered = false;

/* -------------------- HÀM CƠ BẢN -------------------- */

const normalize = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/* -------------------- LƯU TỪ YÊU THÍCH -------------------- */

function loadFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("milDictFavorites") || "[]"
    );

    favorites = new Set(
      Array.isArray(saved) ? saved : []
    );
  } catch (error) {
    console.warn("Không đọc được danh sách yêu thích:", error);
    favorites = new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(
      "milDictFavorites",
      JSON.stringify([...favorites])
    );
  } catch (error) {
    console.error("Không lưu được từ yêu thích:", error);
  }

  updateFavCount();
}

function updateFavCount() {
  const count = $("#favCount");
  const summary = $("#favSummary");

  if (count) count.textContent = favorites.size;

  if (summary) {
    summary.textContent = `${favorites.size} thuật ngữ`;
  }
}

function isFavorite(term) {
  return favorites.has(term);
}

function toggleFavorite(term) {
  if (favorites.has(term)) {
    favorites.delete(term);
  } else {
    favorites.add(term);
  }

  saveFavorites();

  if (activeView === "favorites") {
    renderFavorites();
  } else {
    searchWords();
  }
}

/* -------------------- HIỂN THỊ THẺ TỪ -------------------- */

function cardHTML(word) {
  const saved = isFavorite(word.term);

  const alternateMeanings = Array.isArray(word.alternate_meanings)
    ? word.alternate_meanings
    : [];

  const tags = Array.isArray(word.tags) ? word.tags : [];

  const sources = Array.isArray(word.sources)
    ? word.sources
    : [word.source];

  return `
    <article class="word-card">
      <div class="word-top">
        <div>
          <h3 class="term">${escapeHtml(word.term)}</h3>
          <p class="ipa">
            ${escapeHtml(word.ipa || "IPA chưa có trong tài liệu")}
            ${word.pos ? ` · ${escapeHtml(word.pos)}` : ""}
          </p>
        </div>

        <div class="word-tools">
          <button
            class="tool-btn"
            type="button"
            title="Nghe phát âm"
            aria-label="Nghe phát âm"
            data-speak="${escapeHtml(word.term)}"
          >▶</button>

          <button
            class="tool-btn ${saved ? "saved" : ""}"
            type="button"
            title="${saved ? "Bỏ yêu thích" : "Lưu yêu thích"}"
            aria-label="${saved ? "Bỏ yêu thích" : "Lưu yêu thích"}"
            data-fav="${escapeHtml(word.term)}"
          >${saved ? "★" : "☆"}</button>
        </div>
      </div>

      <p class="meaning">
        ${escapeHtml(word.meaning || "Chưa có bản dịch")}
      </p>

      ${
        word.definition
          ? `<p class="part">${escapeHtml(word.definition)}</p>`
          : ""
      }

      ${
        word.example_en
          ? `
            <div class="example">
              <div class="example-en">
                ${escapeHtml(word.example_en)}
              </div>
              <div class="example-vi">
                ${escapeHtml(word.example_vi || "")}
              </div>
            </div>
          `
          : ""
      }

      ${
        alternateMeanings.length
          ? `
            <div class="example">
              <strong>Nghĩa khác trong tài liệu:</strong>
              <div class="example-vi">
                ${alternateMeanings.map(escapeHtml).join("; ")}
              </div>
            </div>
          `
          : ""
      }

      <div class="tags">
        <span class="tag">
          ${escapeHtml(word.category || "Từ điển mở rộng")}
        </span>

        ${
          word.status
            ? `<span class="tag">${escapeHtml(word.status)}</span>`
            : ""
        }

        ${tags.slice(0, 3).map((tag) =>
          `<span class="tag">${escapeHtml(tag)}</span>`
        ).join("")}

        ${sources.filter(Boolean).slice(0, 2).map((source) =>
          `<span class="tag">${escapeHtml(source)}</span>`
        ).join("")}
      </div>
    </article>
  `;
}

function renderWords(words, target = "#results") {
  const element = $(target);

  if (!element) return;

  element.innerHTML = words.map(cardHTML).join("");

  element.querySelectorAll("[data-fav]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleFavorite(button.dataset.fav);
    });
  });

  element.querySelectorAll("[data-speak]").forEach((button) => {
    button.addEventListener("click", () => {
      speak(button.dataset.speak);
    });
  });
}

/* -------------------- PHÁT ÂM -------------------- */

function speak(term) {
  if (!("speechSynthesis" in window)) {
    alert("Trình duyệt này chưa hỗ trợ phát âm tự động.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(term);
  utterance.lang = "en-GB";
  utterance.rate = 0.88;

  window.speechSynthesis.speak(utterance);
}

/* -------------------- TÌM KIẾM -------------------- */

function searchFields(word) {
  const english = [
    word.term,
    word.original_term,
    word.example_en,
    word.ipa,
    word.pos
  ].filter(Boolean).join(" ");

  const vietnamese = [
    word.meaning,
    ...(Array.isArray(word.alternate_meanings)
      ? word.alternate_meanings
      : []),
    word.original_meaning,
    word.example_vi
  ].filter(Boolean).join(" ");

  const other = [
    word.definition,
    word.category,
    ...(Array.isArray(word.tags) ? word.tags : []),
    ...(Array.isArray(word.sources) ? word.sources : []),
    word.source,
    word.status
  ].filter(Boolean).join(" ");

  return {
    english: normalize(english),
    vietnamese: normalize(vietnamese),
    other: normalize(other)
  };
}

function searchScore(word, query) {
  if (!query) return 0;

  const fields = searchFields(word);
  const term = normalize(word.term);
  const meaning = normalize(word.meaning);

  if (searchMode === "en-vi") {
    if (term === query) return 100;
    if (term.startsWith(query)) return 80;
    if (fields.english.includes(query)) return 60;
    if (fields.other.includes(query)) return 20;

    return -1;
  }

  if (searchMode === "vi-en") {
    if (meaning === query) return 100;
    if (meaning.startsWith(query)) return 80;
    if (fields.vietnamese.includes(query)) return 60;
    if (fields.other.includes(query)) return 20;

    return -1;
  }

  if (term === query) return 110;
  if (meaning === query) return 105;

  if (term.startsWith(query)) return 90;
  if (meaning.startsWith(query)) return 85;

  if (fields.english.includes(query)) return 70;
  if (fields.vietnamese.includes(query)) return 65;

  if (fields.other.includes(query)) return 30;

  return -1;
}

function searchWords() {
  const input = $("#searchInput");

  if (!input) return;

  const queryText = input.value.trim();
  const query = normalize(queryText);

  const matches = dictionary
    .map((word) => ({
      word,
      score: searchScore(word, query)
    }))
    .filter((item) => !query || item.score >= 0)
    .sort((a, b) =>
      b.score - a.score ||
      normalize(a.word.term).localeCompare(normalize(b.word.term))
    )
    .map((item) => item.word);

  renderWords(matches);

  const emptyState = $("#emptyState");
  if (emptyState) {
    emptyState.classList.toggle("hidden", matches.length !== 0);
  }

  const statusLine = $("#statusLine");

  if (statusLine) {
    statusLine.textContent = queryText
      ? `Tìm thấy ${matches.length} kết quả ${
          searchMode === "en-vi"
            ? "khi tra Anh → Việt"
            : searchMode === "vi-en"
              ? "khi tra Việt → Anh"
              : "ở cả hai chiều"
        }. Tìm kiếm không phân biệt chữ hoa/thường và dấu tiếng Việt.`
      : `${dictionary.length} thuật ngữ tích hợp · Có thể tra tiếng Anh hoặc tiếng Việt.`;
  }

  const expandButton = $("#expandSearch");

  if (expandButton) {
    expandButton.disabled = !queryText;
    expandButton.textContent = "Hỏi ChatGPT về thuật ngữ này ↗";
  }
}

/* -------------------- DANH SÁCH YÊU THÍCH -------------------- */

function renderFavorites() {
  const words = dictionary.filter((word) =>
    favorites.has(word.term)
  );

  renderWords(words, "#favoritesList");

  const emptyState = $("#noFavorites");

  if (emptyState) {
    emptyState.classList.toggle("hidden", words.length > 0);
  }
}

/* -------------------- CHUYỂN TAB -------------------- */

function showView(name) {
  activeView = name;

  $$(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === name);
  });

  ["lookup", "favorites", "practice", "quiz"].forEach((view) => {
    const element = $(`#${view}View`);

    if (element) {
      element.classList.toggle("hidden", view !== name);
    }
  });

  if (name === "favorites") {
    renderFavorites();
  }

  if (name === "practice" && !practiceDeck.length) {
    preparePractice();
  }
}

/* -------------------- THẺ ÔN TẬP -------------------- */

function preparePractice() {
  const favoriteWords = dictionary.filter((word) =>
    favorites.has(word.term)
  );

  const source = favoriteWords.length
    ? favoriteWords
    : dictionary;

  practiceDeck = shuffle(source).slice(
    0,
    Math.min(15, source.length)
  );

  practiceIndex = 0;

  const progress = $("#practiceProgress");

  if (progress) {
    progress.textContent = `${practiceDeck.length} thẻ`;
  }

  showFlashcard();
}

function showFlashcard() {
  const word = practiceDeck[practiceIndex];

  const termElement = $("#flashTerm");
  const meaningElement = $("#flashMeaning");
  const revealButton = $("#revealBtn");
  const againButton = $("#againBtn");
  const knownButton = $("#knownBtn");
  const progress = $("#practiceProgress");

  if (!word) {
    if (termElement) {
      termElement.textContent = "Hoàn thành lượt ôn tập!";
    }

    if (meaningElement) {
      meaningElement.classList.add("hidden");
    }

    if (revealButton) {
      revealButton.classList.add("hidden");
    }

    if (againButton) againButton.disabled = true;
    if (knownButton) knownButton.disabled = true;

    if (progress) {
      progress.textContent = "Hoàn thành";
    }

    return;
  }

  if (termElement) {
    termElement.textContent = word.term;
  }

  if (meaningElement) {
    meaningElement.textContent = word.meaning || "Chưa có bản dịch";
    meaningElement.classList.add("hidden");
  }

  if (revealButton) {
    revealButton.classList.remove("hidden");
    revealButton.textContent = "Hiện nghĩa";
  }

  if (againButton) againButton.disabled = true;
  if (knownButton) knownButton.disabled = true;

  if (progress) {
    progress.textContent =
      `Thẻ ${practiceIndex + 1}/${practiceDeck.length}`;
  }
}

function nextFlashcard() {
  practiceIndex++;
  showFlashcard();
}

/* -------------------- KIỂM TRA TỪ VỰNG -------------------- */

function startQuiz() {
  if (!dictionary.length) return;

  quizQuestions = shuffle(dictionary).slice(
    0,
    Math.min(10, dictionary.length)
  );

  quizIndex = 0;
  score = 0;
  answered = false;

  const scoreElement = $("#quizScore");

  if (scoreElement) {
    scoreElement.textContent = "Điểm: 0";
  }

  showQuestion();
}

function showQuestion() {
  const box = $("#quizBox");

  if (!box) return;

  if (quizIndex >= quizQuestions.length) {
    box.innerHTML = `
      <div class="eyebrow">KẾT QUẢ</div>

      <h3 class="quiz-question">
        Bạn đạt ${score}/${quizQuestions.length} câu
      </h3>

      <p>
        ${
          score >= 8
            ? "Rất tốt! Hãy tiếp tục duy trì việc ôn tập."
            : score >= 5
              ? "Khá tốt. Ôn lại các thuật ngữ chưa chắc chắn nhé."
              : "Hãy xem lại bộ từ vựng và thử lại."
        }
      </p>

      <button id="retryQuiz" class="primary-btn">
        Làm lại
      </button>
    `;

    $("#retryQuiz").addEventListener("click", startQuiz);

    return;
  }

  const question = quizQuestions[quizIndex];

  const wrongAnswers = shuffle(
    dictionary.filter((word) => word.term !== question.term)
  ).slice(0, 3);

  const options = shuffle([question, ...wrongAnswers]);

  box.innerHTML = `
    <div class="eyebrow">
      CÂU ${quizIndex + 1}/${quizQuestions.length}
    </div>

    <h3 class="quiz-question">
      ${escapeHtml(question.term)}
    </h3>

    <p>Chọn nghĩa tiếng Việt chính xác nhất.</p>

    <div class="quiz-options">
      ${options.map((option) => `
        <button
          class="quiz-option"
          type="button"
          data-answer="${escapeHtml(option.term)}"
        >
          ${escapeHtml(option.meaning || "Chưa có bản dịch")}
        </button>
      `).join("")}
    </div>

    <p id="quizFeedback" class="quiz-feedback"></p>

    <button
      id="nextQuestion"
      class="primary-btn hidden"
    >
      ${
        quizIndex === quizQuestions.length - 1
          ? "Xem kết quả"
          : "Câu tiếp theo →"
      }
    </button>
  `;

  box.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      if (answered) return;

      answered = true;

      const correct = button.dataset.answer === question.term;
      const feedback = $("#quizFeedback");

      if (correct) {
        score++;
        button.classList.add("correct");

        if (feedback) {
          feedback.textContent = "Chính xác!";
        }
      } else {
        button.classList.add("wrong");

        const correctButton = [...box.querySelectorAll("[data-answer]")]
          .find((item) => item.dataset.answer === question.term);

        if (correctButton) {
          correctButton.classList.add("correct");
        }

        if (feedback) {
          feedback.textContent = `Đáp án: ${question.meaning}`;
        }
      }

      box.querySelectorAll("[data-answer]").forEach((item) => {
        item.disabled = true;
      });

      const scoreElement = $("#quizScore");

      if (scoreElement) {
        scoreElement.textContent = `Điểm: ${score}`;
      }

      $("#nextQuestion").classList.remove("hidden");
    });
  });

  $("#nextQuestion").addEventListener("click", () => {
    quizIndex++;
    answered = false;
    showQuestion();
  });
}

/* -------------------- MỞ CHATGPT ĐỂ HỎI DỊCH -------------------- */

function expandLookup() {
  const input = $("#searchInput");
  const query = input ? input.value.trim() : "";

  if (!query) return;

  let direction = "dịch theo ngữ cảnh quân sự";

  if (searchMode === "en-vi") {
    direction = "dịch từ tiếng Anh sang tiếng Việt";
  } else if (searchMode === "vi-en") {
    direction = "dịch từ tiếng Việt sang tiếng Anh";
  } else {
    const hasVietnamese =
      /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừừữựýỳỷỹỵ]/i
        .test(query);

    direction = hasVietnamese
      ? "dịch từ tiếng Việt sang tiếng Anh"
      : "xác định ngôn ngữ nguồn và dịch sang ngôn ngữ còn lại (Anh–Việt hoặc Việt–Anh)";
  }

  const prompt =
    `Hãy hỗ trợ dịch thuật ngữ cho từ điển quân sự Anh–Việt. ` +
    `Cụm từ cần dịch: “${query}”. ` +
    `Yêu cầu: ${direction}. ` +
    `Ưu tiên thuật ngữ quân sự chính xác; nêu bản dịch đề xuất, ` +
    `nghĩa theo ngữ cảnh, và các cách dịch khác nếu có. ` +
    `Nếu thiếu ngữ cảnh, hãy nói rõ điểm chưa chắc chắn ` +
    `và không tự khẳng định là thuật ngữ chính thức. ` +
    `Đây là bản dịch tham khảo, không tự động thay thế bộ từ vựng nội bộ của tôi.`;

  const url = new URL("https://chatgpt.com/");
  url.searchParams.set("q", prompt);

  window.open(
    url.toString(),
    "_blank",
    "noopener,noreferrer"
  );

  const statusLine = $("#statusLine");

  if (statusLine) {
    statusLine.textContent =
      "Đã mở ChatGPT trong tab mới với câu hỏi dịch đã điền sẵn. " +
      "Nếu cần, đăng nhập rồi gửi câu hỏi; " +
      "bộ từ vựng nội bộ vẫn là nguồn ưu tiên.";
  }
}

/* -------------------- TẢI DỮ LIỆU -------------------- */

async function loadDictionary() {
  const statusLine = $("#statusLine");

  try {
    const dataUrl = new URL(
      "./vocabulary.json",
      document.baseURI
    );

    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(
        `Máy chủ trả về HTTP ${response.status}. ` +
        "Không tìm thấy hoặc không thể tải vocabulary.json."
      );
    }

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "Tệp vocabulary.json có lỗi cú pháp JSON. " +
        "Hãy kiểm tra dấu phẩy, dấu ngoặc kép và ngoặc đóng."
      );
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Cấu trúc vocabulary.json không đúng. " +
        "Dữ liệu cần là một mảng JSON bắt đầu bằng [ và kết thúc bằng ]."
      );
    }

    const validEntries = data.filter((word) => {
      return (
        word &&
        typeof word === "object" &&
        typeof word.term === "string" &&
        word.term.trim() !== ""
      );
    });

    if (!validEntries.length) {
      throw new Error(
        "Tệp JSON đã tải nhưng không có thuật ngữ hợp lệ. " +
        "Mỗi mục cần có trường term."
      );
    }

    dictionary = validEntries;

    if (validEntries.length !== data.length) {
      console.warn(
        `Đã bỏ qua ${data.length - validEntries.length} mục từ vựng không hợp lệ.`
      );
    }

    return true;
  } catch (error) {
    console.error("Lỗi tải từ điển:", error);

    if (statusLine) {
      statusLine.textContent = `Lỗi tải từ điển: ${error.message}`;
    }

    const results = $("#results");

    if (results) {
      results.innerHTML = "";
    }

    const emptyState = $("#emptyState");

    if (emptyState) {
      emptyState.classList.add("hidden");
    }

    return false;
  }
}

/* -------------------- KHỞI TẠO ỨNG DỤNG -------------------- */

async function init() {
  loadFavorites();
  updateFavCount();

  const loaded = await loadDictionary();

  if (!loaded) {
    return;
  }

  searchWords();

  /* Tìm kiếm */
  $("#searchInput").addEventListener("input", searchWords);

  /* Xóa nội dung tìm kiếm */
  $("#clearSearch").addEventListener("click", () => {
    $("#searchInput").value = "";
    searchWords();
    $("#searchInput").focus();
  });

  /* Từ khóa gợi ý */
  $$(".suggestion").forEach((button) => {
    button.addEventListener("click", () => {
      $("#searchInput").value = button.dataset.query;
      searchWords();
    });
  });

  /* Chọn chiều tra cứu */
  $$(".direction-btn").forEach((button) => {
    button.addEventListener("click", () => {
      searchMode = button.dataset.mode;

      $$(".direction-btn").forEach((item) => {
        const active = item === button;

        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      searchWords();
    });
  });

  /* Chuyển tab */
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  /* Hỏi ChatGPT */
  $("#expandSearch").addEventListener("click", expandLookup);

  /* Thẻ ôn tập */
  $("#revealBtn").addEventListener("click", () => {
    $("#flashMeaning").classList.remove("hidden");
    $("#revealBtn").classList.add("hidden");

    $("#againBtn").disabled = false;
    $("#knownBtn").disabled = false;
  });

  $("#againBtn").addEventListener("click", () => {
    const currentWord = practiceDeck[practiceIndex];

    if (currentWord) {
      practiceDeck.push(currentWord);
    }

    nextFlashcard();
  });

  $("#knownBtn").addEventListener("click", nextFlashcard);

  $("#startPractice").addEventListener("click", preparePractice);

  /* Kiểm tra */
  $("#startQuiz").addEventListener("click", startQuiz);

  /* Giao diện sáng / tối */
  $("#themeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    try {
      localStorage.setItem(
        "milDictDark",
        document.body.classList.contains("dark") ? "1" : "0"
      );
    } catch (error) {
      console.warn("Không lưu được tùy chọn giao diện:", error);
    }
  });

  try {
    if (localStorage.getItem("milDictDark") === "1") {
      document.body.classList.add("dark");
    }
  } catch (error) {
    console.warn("Không đọc được tùy chọn giao diện:", error);
  }

  /* Service Worker / PWA */
  if (
    "serviceWorker" in navigator &&
    location.protocol.startsWith("http")
  ) {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((error) => {
        console.warn("Không đăng ký được Service Worker:", error);
      });
  }
}

/* Chạy ứng dụng */
init();
