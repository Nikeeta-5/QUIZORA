/*
====================================================
 QUIZORA: ASSESSMENT STUDIO
 Copyright © 2026 Nikeeta Malik.
 All Rights Reserved.

 Unauthorized copying, modification, reproduction,
 or redistribution of this source code is prohibited.
====================================================
*/
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        const $ = function (selector) {
            return document.querySelector(selector);
        };

        const studyText = $("#study-text");
        const characterCount = $("#character-count");
        const pdfUpload = $("#pdf-upload");
        const fileStatus = $("#file-status");
        const questionCount = $("#question-count");
        const difficulty = $("#difficulty");
        const timeLimit = $("#time-limit");
        const shuffleQuestions = $("#shuffle-questions");
        const showExplanations = $("#show-explanations");
        const generateButton = $("#generate-quiz");
        const appMessage = $("#app-message");
        const quizSection = $("#quiz-section");
        const resultsSection = $("#results-section");
        const historySection = $("#quiz-history");
        const clearHistoryButton = $("#clear-history");

        if (!studyText || !generateButton || !quizSection) {
            console.error(
                "QUIZORA: Required HTML elements are missing. Check index.html."
            );
            return;
        }

        let questions = [];
        let answers = {};
        let reviewQuestions = new Set();
        let currentIndex = 0;
        let remainingSeconds = 0;
        let timerInterval = null;
        let quizStartedAt = null;
        let quizSubmitted = false;
        let quizSettings = {};

        studyText.addEventListener("input", updateCharacterCount);

        if (pdfUpload) {
            pdfUpload.addEventListener("change", handlePDFUpload);
        }

        generateButton.addEventListener("click", startQuiz);

        if (clearHistoryButton) {
            clearHistoryButton.addEventListener("click", clearHistory);
        }

        quizSection.addEventListener("click", handleQuizClick);
        if (historySection) {
    historySection.addEventListener("click", handleHistoryClick);
}

if (resultsSection) {
    resultsSection.addEventListener("click", handleQuizClick);
}

        renderHistory();
        updateCharacterCount();

        function updateCharacterCount() {
            if (characterCount) {
                characterCount.textContent =
                    studyText.value.length.toLocaleString() + " characters";
            }
        }

        function showMessage(message, type) {
            if (!appMessage) {
                if (message) {
                    alert(message);
                }
                return;
            }

            appMessage.textContent = message;
            appMessage.className = "app-message";

            if (type) {
                appMessage.classList.add(type);
            }

            appMessage.hidden = !message;
        }

        async function handlePDFUpload(event) {
            const file = event.target.files[0];

            if (!file) {
                return;
            }

            if (!file.name.toLowerCase().endsWith(".pdf")) {
                showMessage("Please select a PDF file.", "error");
                event.target.value = "";
                return;
            }

            if (!window.QuizoraPDF) {
                showMessage(
                    "The PDF reader is not loaded. Check your internet connection and reload the page.",
                    "error"
                );
                return;
            }

            if (fileStatus) {
                fileStatus.textContent = "Reading " + file.name + "...";
            }

            try {
                const extractedText = await window.QuizoraPDF.extractText(file);

                if (!extractedText || !extractedText.trim()) {
                    throw new Error(
                        "No readable text was found in this PDF."
                    );
                }

                studyText.value = (
                    studyText.value.trim()
                        ? studyText.value.trim() + "\n\n"
                        : ""
                ) + extractedText.trim();

                updateCharacterCount();

                if (fileStatus) {
                    fileStatus.textContent = "Loaded: " + file.name;
                }

                showMessage(
                    "PDF text added. You can now generate your quiz.",
                    "success"
                );
            } catch (error) {
                if (fileStatus) {
                    fileStatus.textContent = "Could not read this PDF.";
                }

                showMessage(
                    error.message || "Unable to read the PDF.",
                    "error"
                );
            }
        }

        function startQuiz() {
            const text = studyText.value.trim();

            if (!text) {
                showMessage(
                    "Please paste your study material or upload a text-based PDF first.",
                    "error"
                );
                studyText.focus();
                return;
            }

            if (!window.QuizoraEngine) {
                showMessage(
                    "The quiz engine did not load. Check js/quiz-engine.js and reload the page.",
                    "error"
                );
                return;
            }

            const count = Number(questionCount ? questionCount.value : 10);
            const selectedDifficulty = difficulty
                ? difficulty.value
                : "Medium";
            const shouldShuffle = shuffleQuestions
                ? shuffleQuestions.checked
                : true;

            quizSettings = {
                count: count,
                difficulty: selectedDifficulty,
                shuffle: shouldShuffle,
                showExplanations: showExplanations
                    ? showExplanations.checked
                    : true
            };

            const result = window.QuizoraEngine.generateQuestions(
                text,
                quizSettings
            );

            if (!result || !Array.isArray(result.questions)) {
                showMessage(
                    "The quiz engine returned an unexpected result. Check js/quiz-engine.js.",
                    "error"
                );
                return;
            }

            if (result.questions.length === 0) {
                showMessage(
                    result.message ||
                        "Please provide more study material.",
                    "error"
                );
                return;
            }

            questions = result.questions.map(function (question, index) {
                return Object.assign({}, question, {
                    id: question.id || "question-" + (index + 1)
                });
            });

            answers = {};
            reviewQuestions = new Set();
            currentIndex = 0;
            quizSubmitted = false;
            quizStartedAt = Date.now();

            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            const minutes = Number(timeLimit ? timeLimit.value : 0);
            remainingSeconds = Math.max(0, minutes * 60);

            if (resultsSection) {
                resultsSection.hidden = true;
            }

            quizSection.hidden = false;

            showMessage(
                result.message ||
                    "Quiz ready! Answer each question and submit when finished.",
                result.message ? "warning" : "success"
            );

            renderQuiz();

            if (remainingSeconds > 0) {
                startTimer();
            }

            quizSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

        function handleQuizClick(event) {
            const button = event.target.closest("button");

            if (
    !button ||
    (
        !quizSection.contains(button) &&
        (!resultsSection || !resultsSection.contains(button))
    )
) {
    return;
}

            if (button.matches(".answer-option")) {
                selectAnswer(button);
                return;
            }

            switch (button.dataset.action) {
                case "previous":
                    goToPrevious();
                    break;

                case "next":
                    goToNext();
                    break;

                case "mark-review":
    toggleReview();
    break;

case "go-to-question": {
    const targetIndex = Number(button.dataset.questionIndex);

    if (
        !quizSubmitted &&
        Number.isInteger(targetIndex) &&
        targetIndex >= 0 &&
        targetIndex < questions.length
    ) {
        currentIndex = targetIndex;
        renderQuiz();
    }
    break;
}

case "submit":
    submitQuiz(false);
    break;

                
case "return-to-input":
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    quizSection.hidden = true;

    if (resultsSection) {
        resultsSection.hidden = true;
    }

    showMessage(
        "Ready to create another quiz! Enter or update your study material below.",
        "success"
    );

    studyText.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    studyText.focus();
    break;

            }
        }

        
function selectAnswer(button) {
    if (quizSubmitted) {
        return;
    }

    const question = questions[currentIndex];

    if (!question) {
        return;
    }

    const selectedIndex = Number(button.dataset.optionIndex);

    if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= question.options.length
    ) {
        return;
    }

    // Clicking the currently selected answer again removes it.
    if (answers[question.id] === selectedIndex) {
        delete answers[question.id];
    } else {
        answers[question.id] = selectedIndex;
    }

    renderQuiz();
}


        function goToPrevious() {
            if (currentIndex > 0 && !quizSubmitted) {
                currentIndex--;
                renderQuiz();
            }
        }

        function goToNext() {
            if (currentIndex < questions.length - 1 && !quizSubmitted) {
                currentIndex++;
                renderQuiz();
            }
        }

        function toggleReview() {
            if (quizSubmitted) {
                return;
            }

            const question = questions[currentIndex];

            if (reviewQuestions.has(question.id)) {
                reviewQuestions.delete(question.id);
            } else {
                reviewQuestions.add(question.id);
            }

            renderQuiz();
        }

        function startTimer() {
            updateTimerDisplay();

            timerInterval = setInterval(function () {
                if (quizSubmitted) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    return;
                }

                remainingSeconds--;
                updateTimerDisplay();

                if (remainingSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    submitQuiz(true);
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const timer = $("#quiz-timer");

            if (!timer) {
                return;
            }

            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;

            timer.textContent =
                String(minutes).padStart(2, "0") +
                ":" +
                String(seconds).padStart(2, "0");

            timer.classList.toggle("timer-warning", remainingSeconds <= 60);
        }

        function renderQuiz() {
            if (!questions.length) {
                return;
            }

            const question = questions[currentIndex];
            const selectedAnswer = answers[question.id];
            const isMarked = reviewQuestions.has(question.id);

            const optionMarkup = question.options
                .map(function (option, index) {
                    const isSelected = selectedAnswer === index;

                    return (
                        '<button type="button" class="answer-option' +
                        (isSelected ? " selected" : "") +
                        '" data-option-index="' +
                        index +
                        '" aria-pressed="' +
                        String(isSelected) +
                        '">' +
                        '<span class="option-letter">' +
                        String.fromCharCode(65 + index) +
                        "</span>" +
                        '<span class="option-text">' +
                        escapeHTML(option) +
                        "</span>" +
                        "</button>"
                    );
                })
                .join("");

            const answeredCount = Object.keys(answers).length;

            quizSection.innerHTML =
                '<div class="quiz-panel">' +
                '<div class="quiz-topline">' +
                '<span class="question-counter">Question ' +
                (currentIndex + 1) +
                " of " +
                questions.length +
                "</span>" +
                '<span class="quiz-timer" id="quiz-timer">' +
                formatTime(remainingSeconds) +
                "</span>" +
                "</div>" +
                '<div class="progress-track"><div class="progress-fill" style="width:' +
                (((currentIndex + 1) / questions.length) * 100) +
                '%"></div></div>' +
                '<div class="quiz-meta">' +
                '<span class="difficulty-tag">' +
                escapeHTML(question.difficulty || quizSettings.difficulty) +
                "</span>" +
                '<span class="answered-count">' +
                answeredCount +
                " answered</span>" +
                "</div>" +
                '<h2 class="question-title">' +
                escapeHTML(question.question) +
                "</h2>" +
                '<div class="answer-options">' +
                optionMarkup +
                "</div>" +
                '<div class="quiz-actions">' +
                '<button type="button" data-action="previous" class="secondary-button"' +
                (currentIndex === 0 ? " disabled" : "") +
                ">Previous</button>" +
                '<button type="button" data-action="mark-review" class="secondary-button"' +
                (isMarked ? ' aria-pressed="true"' : ' aria-pressed="false"') +
                ">" +
                (isMarked ? "Remove Review Mark" : "Mark for Review") +
                "</button>" +
                '<button type="button" data-action="next" class="primary-button"' +
                (currentIndex === questions.length - 1 ? " disabled" : "") +
                ">Next</button>" +
                "</div>" +
                
'<div class="question-navigation" style="display:block;margin-top:22px;padding:16px;border:1px solid #d1d5db;border-radius:14px;">' +
'<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-weight:600;">' +
'<span>All Questions</span>' +
'<span>Marked for review: ' + reviewQuestions.size + '</span>' +
'<span>Unanswered: ' + (questions.length - answeredCount) + '</span>' +
'</div>' +
'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(42px,1fr));gap:8px;margin-top:14px;">' +
questions.map(function (item, index) {
    const itemAnswered = Object.prototype.hasOwnProperty.call(answers, item.id);
    const itemMarked = reviewQuestions.has(item.id);
    const itemCurrent = index === currentIndex;

    let background = "#f3f4f6";
    let textColor = "#374151";
    let borderColor = "#d1d5db";

    if (itemAnswered) {
        background = "#dcfce7";
        textColor = "#166534";
        borderColor = "#16a34a";
    }

    if (itemMarked) {
        background = "#f3e8ff";
        textColor = "#6b21a8";
        borderColor = "#9333ea";
    }

    if (itemCurrent) {
        borderColor = "#2563eb";
    }

    const status = itemMarked
        ? (itemAnswered ? "answered and marked for review" : "marked for review")
        : (itemAnswered ? "answered" : "not answered");

    return (
        '<button type="button" data-action="go-to-question" data-question-index="' +
        index +
        '" aria-label="Go to question ' +
        (index + 1) +
        ', ' +
        status +
        '"' +
        (itemCurrent ? ' aria-current="step"' : '') +
        ' style="min-height:42px;border:2px solid ' +
        borderColor +
        ';border-radius:10px;background:' +
        background +
        ';color:' +
        textColor +
        ';font-weight:700;cursor:pointer;padding:8px;">' +
        (index + 1) +
        '</button>'
    );
}).join("") +
'</div>' +
'<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;font-size:13px;">' +
'<span>⬜ Not answered</span>' +
'<span style="color:#166534;">🟩 Answered</span>' +
'<span style="color:#6b21a8;">🟪 Marked for review</span>' +
'<span style="color:#2563eb;">🔵 Blue border = current question</span>' +
'</div>' +
'</div>' +
'<div class="quiz-submit-row">' +
                '<button type="button" data-action="submit" class="submit-button">Submit Quiz</button>' +
                "</div>" +
                "</div>";

            updateTimerDisplay();
        }

        function formatTime(totalSeconds) {
            const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
            const seconds = Math.max(0, totalSeconds) % 60;

            return (
                String(minutes).padStart(2, "0") +
                ":" +
                String(seconds).padStart(2, "0")
            );
        }

        function submitQuiz(autoSubmitted) {
            if (quizSubmitted || !questions.length) {
                return;
            }

            if (
                !autoSubmitted &&
                !window.confirm("Submit this quiz and view your results?")
            ) {
                return;
            }

            quizSubmitted = true;

            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            const correctCount = questions.reduce(function (total, question) {
                return total +
                    (answers[question.id] === question.correctIndex ? 1 : 0);
            }, 0);

            const answeredCount = Object.keys(answers).length;
            const score = Math.round(
                (correctCount / questions.length) * 100
            );
            const elapsedSeconds = Math.max(
                0,
                Math.floor((Date.now() - quizStartedAt) / 1000)
            );

           
const result = {
    id: String(Date.now()),
    date: new Date().toISOString(),
    score: score,
    correct: correctCount,
    total: questions.length,
    answered: answeredCount,
    difficulty: quizSettings.difficulty,
    durationSeconds: elapsedSeconds,

    review: questions.map(function (question) {
        const selectedIndex = answers[question.id];

        return {
            question: question.question,
            options: question.options,
            correctIndex: question.correctIndex,
            selectedIndex: selectedIndex === undefined
                ? null
                : selectedIndex,
            explanation: question.explanation || ""
        };
    })
};


            renderResults(result, autoSubmitted);

            try {
                if (window.QuizoraStorage) {
                    window.QuizoraStorage.addResult(result);
                }
            } catch (error) {
                console.warn("QUIZORA: Could not save quiz history.", error);
            }

            renderHistory();
        }

        function renderResults(result, autoSubmitted) {
            if (!resultsSection) {
                alert(
                    "Quiz submitted. Score: " +
                    result.correct +
                    "/" +
                    result.total
                );
                return;
            }

            const reviewMarkup = questions
                .map(function (question, index) {
                    const selectedIndex = answers[question.id];
                    const selectedText =
                        selectedIndex === undefined
                            ? "Not answered"
                            : question.options[selectedIndex];
                    const correctText =
                        question.options[question.correctIndex] ||
                        question.correctAnswer ||
                        "Not available";
                    const isCorrect =
                        selectedIndex === question.correctIndex;

                    return (
                        '<article class="result-question">' +
                        "<h3>Question " +
                        (index + 1) +
                        "</h3>" +
                        '<p class="result-question-text">' +
                        escapeHTML(question.question) +
                        "</p>" +
                        '<p><strong>Your answer:</strong> ' +
                        escapeHTML(selectedText) +
                        "</p>" +
                        '<p><strong>Correct answer:</strong> ' +
                        escapeHTML(correctText) +
                        "</p>" +
                        '<p class="' +
                        (isCorrect ? "correct-text" : "incorrect-text") +
                        '">' +
                        (isCorrect ? "Correct" : "Incorrect") +
                        "</p>" +
                        (quizSettings.showExplanations && question.explanation
                            ? "<p><strong>Explanation:</strong> " +
                              escapeHTML(question.explanation) +
                              "</p>"
                            : "") +
                        "</article>"
                    );
                })
                .join("");

            resultsSection.innerHTML =
                '<div class="results-panel">' +
                "<h2>Quiz Results</h2>" +
                (autoSubmitted
                    ? "<p>Time is up. Your quiz was submitted automatically.</p>"
                    : "") +
                '<div class="score-summary">' +
                '<div class="score-circle"><strong>' +
                result.score +
                '%</strong><span>Score</span></div>' +
                '<div class="score-details"><p><strong>' +
                result.correct +
                "</strong> correct out of <strong>" +
                result.total +
                "</strong></p><p>" +
                result.answered +
                " answered · " +
                (result.total - result.answered) +
                " unanswered</p></div>" +
                "</div>" +
                '<h3>Answer Review</h3>' +
                '<div class="answer-review-list">' +
                reviewMarkup +
                "</div>" +
                '<button type="button" data-action="return-to-input" class="primary-button">Create Another Quiz</button>' +
                "</div>";

            resultsSection.hidden = false;
            quizSection.hidden = true;

            resultsSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }

 
function renderHistory() {
    if (!historySection) {
        return;
    }

    let history = [];

    try {
        if (window.QuizoraStorage) {
            history = window.QuizoraStorage.getHistory() || [];
        }
    } catch (error) {
        console.warn("QUIZORA: Could not load quiz history.", error);
    }

    if (!history.length) {
        historySection.innerHTML =
            '<p class="empty-history">Your completed quizzes will appear here.</p>';
        return;
    }

    historySection.innerHTML = history
        .map(function (item, index) {
            const date = item.date
                ? new Date(item.date).toLocaleString()
                : "Date unavailable";

            return (
                '<button type="button" class="history-item" data-history-index="' +
                index +
                '">' +
                '<span class="history-item-main"><strong>' +
                escapeHTML(date) +
                '</strong><span>' +
                escapeHTML(item.difficulty || "Medium") +
                '</span></span>' +
                '<span class="history-item-score">' +
                Number(item.score || 0) +
                "% · " +
                Number(item.correct || 0) +
                "/" +
                Number(item.total || 0) +
                '</span>' +
                '<span class="history-open-hint">Click to review</span>' +
                '</button>'
            );
        })
        .join("");
}

function handleHistoryClick(event) {
    const button = event.target.closest("button[data-history-index]");

    if (!button || !historySection.contains(button)) {
        return;
    }

    if (!window.QuizoraStorage || !resultsSection) {
        showMessage("Unable to open the saved quiz review.", "error");
        return;
    }

    let history = [];

    try {
        history = window.QuizoraStorage.getHistory() || [];
    } catch (error) {
        console.warn("QUIZORA: Could not open saved result.", error);
    }

    const index = Number(button.dataset.historyIndex);
    const item = history[index];

    if (!item) {
        showMessage("Could not find this saved quiz result.", "error");
        return;
    }

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    quizSection.hidden = true;

    const date = item.date
        ? new Date(item.date).toLocaleString()
        : "Unavailable";

    let reviewMarkup = "";

    if (Array.isArray(item.review) && item.review.length > 0) {
        reviewMarkup = item.review.map(function (question, index) {
            const options = Array.isArray(question.options)
                ? question.options
                : [];

            const selectedIndex = question.selectedIndex;
            const correctIndex = question.correctIndex;

            const hasSelectedAnswer =
                Number.isInteger(selectedIndex) &&
                selectedIndex >= 0 &&
                selectedIndex < options.length;

            const hasCorrectAnswer =
                Number.isInteger(correctIndex) &&
                correctIndex >= 0 &&
                correctIndex < options.length;

            const selectedText = hasSelectedAnswer
                ? options[selectedIndex]
                : "Not answered";

            const correctText = hasCorrectAnswer
                ? options[correctIndex]
                : "Not available";

            const isCorrect =
                hasSelectedAnswer &&
                hasCorrectAnswer &&
                selectedIndex === correctIndex;

            return (
                '<article class="result-question">' +
                '<h3>Question ' + (index + 1) + '</h3>' +
                '<p class="result-question-text">' +
                escapeHTML(question.question) +
                '</p>' +
                '<p><strong>Your answer:</strong> ' +
                escapeHTML(selectedText) +
                '</p>' +
                '<p><strong>Correct answer:</strong> ' +
                escapeHTML(correctText) +
                '</p>' +
                '<p class="' +
                (isCorrect ? "correct-text" : "incorrect-text") +
                '">' +
                (isCorrect ? "Correct" : "Incorrect") +
                '</p>' +
                (question.explanation
                    ? '<p><strong>Explanation:</strong> ' +
                      escapeHTML(question.explanation) +
                      '</p>'
                    : '') +
                '</article>'
            );
        }).join("");
    }

    resultsSection.innerHTML =
        '<div class="results-panel">' +
        '<h2>Saved Quiz Results</h2>' +
        '<p><strong>Date:</strong> ' +
        escapeHTML(date) +
        '</p>' +
        '<p><strong>Score:</strong> ' +
        Number(item.score || 0) +
        '%</p>' +
        '<p><strong>Correct answers:</strong> ' +
        Number(item.correct || 0) +
        ' out of ' +
        Number(item.total || 0) +
        '</p>' +
        '<p><strong>Answered:</strong> ' +
        Number(item.answered || 0) +
        '</p>' +
        '<p><strong>Difficulty:</strong> ' +
        escapeHTML(item.difficulty || "Medium") +
        '</p>' +
        '<p><strong>Time taken:</strong> ' +
        formatTime(Number(item.durationSeconds || 0)) +
        '</p>' +
        (
            reviewMarkup
                ? '<h3>Question-by-Question Review</h3>' +
                  '<div class="answer-review-list">' +
                  reviewMarkup +
                  '</div>'
                : '<p>Detailed review is unavailable for this older quiz. New quizzes can save their question-level review after the result-saving code is updated.</p>'
        ) +
        '<button type="button" data-action="return-to-input" class="primary-button">Close Review</button>' +
        '</div>';

    resultsSection.hidden = false;

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


        function clearHistory() {
            if (!window.QuizoraStorage) {
                showMessage(
                    "Quiz history storage is not available.",
                    "error"
                );
                return;
            }

            if (!window.confirm("Clear all saved quiz history?")) {
                return;
            }

            window.QuizoraStorage.clearHistory();
            renderHistory();

            showMessage("Quiz history cleared.", "success");
        }

        function escapeHTML(value) {
            return String(value == null ? "" : value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    }
})();
