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

    const STORAGE_KEY = "quizora_quiz_history_v1";
    const MAX_HISTORY_ITEMS = 50;

    function getHistory() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (!savedData) {
                return [];
            }

            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                return [];
            }

            return parsedData.filter(function (item) {
                return (
                    item !== null &&
                    typeof item === "object" &&
                    typeof item.score === "number" &&
                    typeof item.total === "number"
                );
            });
        } catch (error) {
            console.warn(
                "QUIZORA: Unable to read saved quiz history.",
                error
            );

            return [];
        }
    }

    function saveHistory(history) {
        if (!Array.isArray(history)) {
            return false;
        }

        try {
            const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(limitedHistory)
            );

            return true;
        } catch (error) {
            console.warn(
                "QUIZORA: Unable to save quiz history.",
                error
            );

            return false;
        }
    }

    function prepareReview(review) {
        if (!Array.isArray(review)) {
            return [];
        }

        return review.map(function (item) {
            return {
                question: String(item.question || ""),
                options: Array.isArray(item.options)
                    ? item.options.map(function (option) {
                        return String(option);
                    })
                    : [],
                correctIndex: Number.isInteger(item.correctIndex)
                    ? item.correctIndex
                    : null,
                selectedIndex: Number.isInteger(item.selectedIndex)
                    ? item.selectedIndex
                    : null,
                explanation: String(item.explanation || "")
            };
        });
    }

    function addResult(result) {
        if (!result || typeof result !== "object") {
            return false;
        }

        const history = getHistory();

        const newResult = {
            id: String(result.id || Date.now()),
            date: result.date || new Date().toISOString(),
            score: Number(result.score) || 0,
            correct: Number(result.correct) || 0,
            total: Number(result.total) || 0,
            answered: Number(result.answered) || 0,
            difficulty: String(result.difficulty || "Medium"),
            durationSeconds: Number(result.durationSeconds) || 0,

            // Save question-level information for future review.
            review: prepareReview(result.review)
        };

        history.unshift(newResult);

        return saveHistory(history);
    }

    function clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.warn(
                "QUIZORA: Unable to clear quiz history.",
                error
            );

            return false;
        }
    }

    window.QuizoraStorage = {
        getHistory: getHistory,
        saveHistory: saveHistory,
        addResult: addResult,
        clearHistory: clearHistory
    };
})();
