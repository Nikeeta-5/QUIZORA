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

    const MAX_FILE_SIZE = 15 * 1024 * 1024;

    async function extractText(file) {
        if (!file) {
            throw new Error("Please select a PDF file.");
        }

        if (
            !file.name ||
            !file.name.toLowerCase().endsWith(".pdf")
        ) {
            throw new Error("The selected file must be a PDF.");
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new Error(
                "The PDF is too large. Please choose a file smaller than 15 MB."
            );
        }

        if (file.size === 0) {
            throw new Error("The selected PDF file is empty.");
        }

        if (!window.pdfjsLib) {
            throw new Error(
                "The PDF reader could not load. Check your internet connection and reload QUIZORA."
            );
        }

        try {
            const arrayBuffer = await file.arrayBuffer();

            const loadingTask = window.pdfjsLib.getDocument({
                data: new Uint8Array(arrayBuffer)
            });

            const pdf = await loadingTask.promise;
            const textPages = [];

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const content = await page.getTextContent();

                const pageText = content.items
                    .map(function (item) {
                        return typeof item.str === "string"
                            ? item.str
                            : "";
                    })
                    .filter(Boolean)
                    .join(" ");

                if (pageText.trim()) {
                    textPages.push(pageText.trim());
                }
            }

            const extractedText = textPages.join("\n\n").trim();

            if (!extractedText) {
                throw new Error(
                    "No readable text was found. This may be a scanned PDF, which requires OCR."
                );
            }

            return extractedText;
        } catch (error) {
            if (
                error &&
                typeof error.message === "string" &&
                (
                    error.message.includes("No readable text") ||
                    error.message.includes("scanned PDF") ||
                    error.message.includes("smaller than 15 MB") ||
                    error.message.includes("must be a PDF")
                )
            ) {
                throw error;
            }

            console.error("QUIZORA PDF extraction error:", error);

            throw new Error(
                "Unable to read this PDF. Please check that it opens correctly, then try again."
            );
        }
    }

    window.QuizoraPDF = {
        extractText: extractText
    };
})();
