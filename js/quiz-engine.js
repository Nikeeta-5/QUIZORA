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

    function cleanText(text) {
        return String(text || "")
            .replace(/\r/g, "\n")
            .replace(/```(?:\w+)?/gi, "")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

    function splitSentences(text) {
        const cleaned = cleanText(text);

        if (!cleaned) {
            return [];
        }

        return cleaned
            .split(/(?<=[.!?])\s+|\n+/)
            .map(function (sentence) {
                return sentence
                    .replace(/^[\s•\-*#]+/, "")
                    .replace(/^\d+[\.)]\s*/, "")
                    .trim();
            })
            .filter(function (sentence) {
                return sentence.length >= 20;
            });
    }

    function shuffleArray(items) {
        const result = items.slice();

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            const temporary = result[i];
            result[i] = result[j];
            result[j] = temporary;
        }

        return result;
    }

    function uniqueStrings(items) {
        const seen = new Set();

        return items.filter(function (item) {
            const key = String(item || "").toLowerCase().trim();

            if (!key || seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    function cleanPhrase(value) {
        return String(value || "")
            .replace(/^[\s,:;—–-]+/, "")
            .replace(/[\s,:;—–-]+$/, "")
            .trim();
    }

    /*
     * Convert a source sentence into a question-answer pair.
     * Every answer is extracted from the supplied study material.
     */
    function createQuestionCandidate(sentence, index) {
        const original = cleanPhrase(sentence)
            .replace(/[.!?]+$/, "")
            .trim();

        if (original.length < 20) {
            return null;
        }

        let match;
        let question;
        let answer;
        let kind;

        // Example:
        // "An operating system is defined as software that manages hardware."
        match = original.match(
            /^(.{2,100}?)\s+(?:is defined as|are defined as|refers to|means)\s+(.+)$/i
        );

        if (match) {
            question = "What does " + cleanPhrase(match[1]) + " mean?";
            answer = cleanPhrase(match[2]);
            kind = "definition";
        }

        // Example:
        // "A compiler is used to translate source code."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(?:is|are)\s+(?:primarily\s+)?(?:used|designed|intended)\s+to\s+(.+)$/i
            );

            if (match) {
                question = "What is " + cleanPhrase(match[1]) + " used to do?";
                answer = cleanPhrase(match[2]);
                kind = "purpose";
            }
        }

        // Example:
        // "A database is used for storing organized information."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(?:is|are)\s+(?:primarily\s+)?used for\s+(.+)$/i
            );

            if (match) {
                question = "What is " + cleanPhrase(match[1]) + " used for?";
                answer = cleanPhrase(match[2]);
                kind = "purpose";
            }
        }

        // Example:
        // "A process consists of program code and its current activity."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(?:consists of|comprises|includes|contains)\s+(.+)$/i
            );

            if (match) {
                question = "What does " + cleanPhrase(match[1]) + " include?";
                answer = cleanPhrase(match[2]);
                kind = "components";
            }
        }

        // Example:
        // "The operating system manages hardware resources."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(manages|controls|provides|enables|allows|supports|coordinates|allocates|executes|performs|processes|converts|translates|stores|protects|schedules|facilitates|maintains|monitors|organizes|handles)\s+(.+)$/i
            );

            if (match) {
                question = "What does " + cleanPhrase(match[1]) + " do?";
                answer = cleanPhrase(match[3]);
                kind = "function";
            }
        }

        // Example:
        // "The critical section is a part of a program where shared data is accessed."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(?:is|are)\s+(?:a|an|the)\s+(.+)$/i
            );

            if (match) {
                question = "What is " + cleanPhrase(match[1]) + "?";
                answer = cleanPhrase(match[2]);
                kind = "definition";
            }
        }

        // Example:
        // "Deadlock occurs when processes wait indefinitely for resources."
        if (!question) {
            match = original.match(
                /^(.{2,100}?)\s+(occurs when|happens when|takes place when|refers to)\s+(.+)$/i
            );

            if (match) {
                question = "When does " + cleanPhrase(match[1]) + " occur?";
                answer = cleanPhrase(match[3]);
                kind = "condition";
            }
        }

        // Fallback for sentences that do not match a known pattern.
        // This still uses the actual source statement, rather than
        // claiming that a more specific question can be inferred.
        if (!question || !answer || answer.length < 3) {
            const words = original.split(/\s+/);
            const topic = words.slice(0, Math.min(5, words.length)).join(" ");

            question =
                "Which statement best describes this point about " +
                topic +
                "?";

            answer = original;
            kind = "statement";
        }

        return {
            question: question,
            answer: answer,
            sourceSentence: original,
            kind: kind,
            difficulty: ""
        };
    }

    function makeOptions(candidate, candidates, difficulty) {
        const correctAnswer = candidate.answer;
        const correctKey = correctAnswer.toLowerCase().trim();

        const optionLimit = difficulty === "Easy" ? 3 : 4;

        // Prefer answers produced by similar question types.
        let distractorPool = candidates
            .filter(function (item) {
                return (
                    item.kind === candidate.kind &&
                    item.answer.toLowerCase().trim() !== correctKey
                );
            })
            .map(function (item) {
                return item.answer;
            });

        // If the material has too few similar answers, use other
        // source-based answers as a fallback.
        if (uniqueStrings(distractorPool).length < optionLimit - 1) {
            distractorPool = distractorPool.concat(
                candidates
                    .filter(function (item) {
                        return (
                            item.answer.toLowerCase().trim() !== correctKey
                        );
                    })
                    .map(function (item) {
                        return item.answer;
                    })
            );
        }

        distractorPool = uniqueStrings(distractorPool).filter(function (item) {
            return (
                item.toLowerCase().trim() !== correctKey &&
                item.length > 0
            );
        });

        const selectedDistractors = shuffleArray(distractorPool)
            .slice(0, optionLimit - 1);

        const options = shuffleArray(
            uniqueStrings([correctAnswer].concat(selectedDistractors))
        );

        return {
            options: options,
            correctIndex: options.findIndex(function (option) {
                return option.toLowerCase().trim() === correctKey;
            })
        };
    }

    function generateQuestions(text, config) {
        const settings = config || {};

        const requestedCount = Math.max(
            1,
            Math.min(50, Number(settings.count) || 10)
        );

        const difficulty = ["Easy", "Medium", "Hard"].includes(
            settings.difficulty
        )
            ? settings.difficulty
            : "Medium";

        const shouldShuffle = settings.shuffle !== false;

        const sentences = uniqueStrings(splitSentences(text));

        if (sentences.length < 2) {
            return {
                questions: [],
                message:
                    "Please provide more study material containing at least two distinct, meaningful statements."
            };
        }

        let candidates = sentences
            .map(function (sentence, index) {
                return createQuestionCandidate(sentence, index);
            })
            .filter(Boolean);

        // Remove duplicate questions and answers.
        const seenQuestions = new Set();

        candidates = candidates.filter(function (candidate) {
            const key = candidate.question.toLowerCase().trim();

            if (seenQuestions.has(key)) {
                return false;
            }

            seenQuestions.add(key);
            return true;
        });

        if (shouldShuffle) {
            candidates = shuffleArray(candidates);
        }

        const selectedCandidates = candidates.slice(
            0,
            requestedCount
        );

        const questions = selectedCandidates.map(function (
            candidate,
            index
        ) {
            const result = makeOptions(
                candidate,
                candidates,
                difficulty
            );

            return {
                id: "question-" + (index + 1),
                question: candidate.question,
                options: result.options,
                correctAnswer: candidate.answer,
                correctIndex: result.correctIndex,
                explanation:
                    "Based on the provided study material: " +
                    candidate.sourceSentence +
                    ".",
                difficulty: difficulty
            };
        });

        let message = "";

        if (questions.length < requestedCount) {
            message =
                "The material supports " +
                questions.length +
                " distinct question(s), rather than the " +
                requestedCount +
                " requested. Add more study material for additional questions.";
        }

        return {
            questions: questions,
            message: message
        };
    }

    window.QuizoraEngine = {
        generateQuestions: generateQuestions,
        cleanText: cleanText,
        splitSentences: splitSentences
    };
})();
