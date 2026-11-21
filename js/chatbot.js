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

    document.addEventListener("DOMContentLoaded", initChatbot);

    function initChatbot() {
        if (document.getElementById("quizora-chatbot")) {
            return;
        }

        const container = document.createElement("div");
        container.id = "quizora-chatbot";

        container.innerHTML =
            '<button type="button" id="chatbot-toggle" ' +
            'class="chatbot-toggle" aria-label="Open QUIZORA assistant" ' +
            'aria-expanded="false">Chat</button>' +

            '<section id="chatbot-panel" class="chatbot-panel" hidden ' +
            'aria-label="QUIZORA study assistant">' +

            '<header class="chatbot-header">' +
            '<div><strong>QUIZORA Assistant</strong>' +
            '<p>Your study companion</p></div>' +
            '<button type="button" id="chatbot-close" ' +
            'aria-label="Close chatbot">×</button>' +
            '</header>' +

            '<div id="chatbot-messages" class="chatbot-messages" ' +
            'aria-live="polite">' +
            '<div class="chat-message bot-message">' +
            'Hi! I can help you understand how to use QUIZORA. ' +
            'Ask me about creating quizzes, difficulty levels, or results.' +
            '</div></div>' +

            '<form id="chatbot-form" class="chatbot-form">' +
            '<input id="chatbot-input" type="text" ' +
            'placeholder="Type your message..." ' +
            'aria-label="Your message" maxlength="500" required>' +
            '<button type="submit">Send</button>' +
            '</form>' +

            '</section>';

        document.body.appendChild(container);

        const toggleButton = document.getElementById("chatbot-toggle");
        const closeButton = document.getElementById("chatbot-close");
        const panel = document.getElementById("chatbot-panel");
        const form = document.getElementById("chatbot-form");
        const input = document.getElementById("chatbot-input");
        const messages = document.getElementById("chatbot-messages");

        addChatbotStyles();

        toggleButton.addEventListener("click", function () {
            const isOpening = panel.hidden;

            panel.hidden = !isOpening;
            toggleButton.setAttribute(
                "aria-expanded",
                String(isOpening)
            );

            if (isOpening) {
                input.focus();
            }
        });

        closeButton.addEventListener("click", function () {
            panel.hidden = true;
            toggleButton.setAttribute("aria-expanded", "false");
            toggleButton.focus();
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const message = input.value.trim();

            if (!message) {
                return;
            }

            addMessage(message, "user-message");
            input.value = "";

            const response = getResponse(message);

            window.setTimeout(function () {
                addMessage(response, "bot-message");
            }, 250);
        });

        function addMessage(text, className) {
            const messageElement = document.createElement("div");

            messageElement.className = "chat-message " + className;
            messageElement.textContent = text;

            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        }

        function getResponse(message) {
            const text = message.toLowerCase();

            if (
                text.includes("hello") ||
                text.includes("hi") ||
                text.includes("hey")
            ) {
                return "Hello! Paste your study material into QUIZORA to get started.";
            }

            if (
                text.includes("create") ||
                text.includes("generate") ||
                text.includes("quiz")
            ) {
                return "To create a quiz, enter your study material, choose the question count and difficulty, then select Generate Quiz.";
            }

            if (
                text.includes("pdf") ||
                text.includes("upload")
            ) {
                return "Use the PDF upload option to extract text from a readable PDF. Scanned PDFs are not supported by the current version.";
            }

            if (
                text.includes("difficulty") ||
                text.includes("easy") ||
                text.includes("medium") ||
                text.includes("hard")
            ) {
                return "Choose Easy, Medium, or Hard in the quiz settings. The current rule-based generator changes the number of answer options by difficulty.";
            }

            if (
                text.includes("timer") ||
                text.includes("time")
            ) {
                return "Choose a time limit before generating your quiz. When the timer reaches zero, the quiz is submitted automatically.";
            }

            if (
                text.includes("score") ||
                text.includes("result") ||
                text.includes("history") ||
                text.includes("mark")
            ) {
                return "Submit your quiz to see your score and answer review. Completed quiz results can also appear in your local quiz history.";
            }

            if (
                text.includes("answer") ||
                text.includes("option") ||
                text.includes("select")
            ) {
                return "Select an answer option, use Previous and Next to navigate, or use Mark for Review to flag a question.";
            }

            if (
                text.includes("thank")
            ) {
                return "You're welcome! Keep your study material clear and specific for better quiz results.";
            }

            return "I can help with QUIZORA's quiz creation, PDF uploads, difficulty settings, timer, answers, results, and history. Ask me about one of these features.";
        }
    }

    function addChatbotStyles() {
        if (document.getElementById("quizora-chatbot-styles")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "quizora-chatbot-styles";

        style.textContent = `
            #quizora-chatbot {
                position: fixed;
                right: 22px;
                bottom: 22px;
                z-index: 9999;
                font-family: Arial, sans-serif;
            }

            #quizora-chatbot * {
                box-sizing: border-box;
            }

            #quizora-chatbot .chatbot-toggle {
                display: block;
                margin-left: auto;
                padding: 14px 20px;
                border: 0;
                border-radius: 28px;
                background: #8b5cf6;
                color: #ffffff;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            }

            #quizora-chatbot .chatbot-panel {
                width: min(350px, calc(100vw - 32px));
                height: 440px;
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid #343750;
                border-radius: 16px;
                background: #151729;
                color: #f4f5ff;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
            }

            #quizora-chatbot .chatbot-panel[hidden] {
                display: none;
            }

            #quizora-chatbot .chatbot-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 16px;
                background: #20233b;
            }

            #quizora-chatbot .chatbot-header p {
                margin: 5px 0 0;
                color: #b8bad1;
                font-size: 12px;
            }

            #quizora-chatbot #chatbot-close {
                border: 0;
                background: transparent;
                color: #ffffff;
                font-size: 25px;
                cursor: pointer;
            }

            #quizora-chatbot .chatbot-messages {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
                padding: 14px;
            }

            #quizora-chatbot .chat-message {
                max-width: 90%;
                padding: 10px 12px;
                border-radius: 12px;
                font-size: 13px;
                line-height: 1.5;
                overflow-wrap: anywhere;
            }

            #quizora-chatbot .bot-message {
                align-self: flex-start;
                background: #262a43;
                color: #f4f5ff;
            }

            #quizora-chatbot .user-message {
                align-self: flex-end;
                background: #6841c6;
                color: #ffffff;
            }

            #quizora-chatbot .chatbot-form {
                display: flex;
                gap: 8px;
                padding: 12px;
                border-top: 1px solid #343750;
            }

            #quizora-chatbot .chatbot-form input {
                width: 0;
                min-width: 0;
                flex: 1;
                padding: 11px;
                border: 1px solid #454964;
                border-radius: 8px;
                outline: none;
                background: #20233b;
                color: #ffffff;
                font-size: 13px;
            }

            #quizora-chatbot .chatbot-form button {
                padding: 10px 12px;
                border: 0;
                border-radius: 8px;
                background: #8b5cf6;
                color: #ffffff;
                font-weight: 700;
                cursor: pointer;
            }

            #quizora-chatbot button:focus-visible,
            #quizora-chatbot input:focus-visible {
                outline: 2px solid #22d3ee;
                outline-offset: 3px;
            }

            @media (max-width: 480px) {
                #quizora-chatbot {
                    right: 12px;
                    bottom: 12px;
                }

                #quizora-chatbot .chatbot-panel {
                    height: min(440px, 65vh);
                }
            }
        `;

        document.head.appendChild(style);
    }
})();
