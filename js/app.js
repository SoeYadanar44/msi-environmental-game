(function () {
    const PLACEHOLDER_SVG = `
        <svg class="placeholder-icon" viewBox="0 0 64 96" aria-hidden="true">
            <rect width="64" height="96" fill="#e2e8f0"/>
            <path d="M6 70 L22 50 L34 62 L46 40 L58 70 Z" fill="#cbd5e1"/>
            <circle cx="46" cy="22" r="10" fill="#94a3b8"/>
        </svg>`;

    let levelIndex = 0;
    let droppedCause = null;
    let droppedSolution = null;
    let levelLocked = false;
    let draggedItem = null;
    
    // Store the current level data
    let currentLevelData = null;

    const els = {
        gameBoard: document.getElementById("game-board"),
        problemHeading: document.getElementById("problem-heading"),
        problemImage: document.getElementById("problem-image"),
        causeScroll: document.getElementById("cause-scroll"),
        solutionScroll: document.getElementById("solution-scroll"),
        causeDrop: document.getElementById("cause-drop"),
        solutionDrop: document.getElementById("solution-drop"),
        feedback: document.getElementById("game-feedback"),
        levelIndicator: document.getElementById("level-indicator"),
        levelProgress: document.getElementById("level-progress"),
        sticker: document.getElementById("result-sticker"),
        nextBtn: document.getElementById("next-level-sticker"),
        stickerProb: document.getElementById("sticker-prob"),
        stickerCause: document.getElementById("sticker-cause"),
        stickerSol: document.getElementById("sticker-sol"),
        stickerDescription: document.getElementById("sticker-description-text")
    };

    function getLevel() {
        if (!currentLevelData || currentLevelData.id !== levelIndex + 1) {
            currentLevelData = getLevelWithFreshDecoys(levelIndex + 1);
        }
        return currentLevelData;
    }
    
    function refreshLevelData() {
        currentLevelData = null;
        currentLevelData = getLevelWithFreshDecoys(levelIndex + 1);
        return currentLevelData;
    }

    function prefersReducedMotion() {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function runSwap(el, updateFn) {
        if (!el || prefersReducedMotion()) {
            updateFn();
            return;
        }
        el.classList.remove("swap-in");
        el.classList.add("swap-out");
        window.setTimeout(() => {
            updateFn();
            el.classList.remove("swap-out");
            el.classList.add("swap-in");
            window.setTimeout(() => el.classList.remove("swap-in"), 350);
        }, 220);
    }

    function renderImage(container, src, alt) {
        if (!container) return;
        container.innerHTML = src ? `<img src="${src}" alt="${alt || ""}" class="card-img">` : PLACEHOLDER_SVG;
    }

    function updateProgress() {
        if (!els.levelProgress || !LEVEL_COUNT) return;
        els.levelProgress.style.width = `${((levelIndex + 1) / LEVEL_COUNT) * 100}%`;
    }

    function handleScrollIndicators(scrollEl) {
        if (!scrollEl) return;
        const wrapper = scrollEl.closest('.scroll-wrapper');
        if (!wrapper) return;
        
        const upArrow = wrapper.querySelector('.scroll-arrow-container--up');
        const downArrow = wrapper.querySelector('.scroll-arrow-container--down');
        
        if (upArrow) upArrow.style.opacity = scrollEl.scrollTop > 10 ? '1' : '0';
        if (downArrow) {
            const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
            downArrow.style.opacity = scrollEl.scrollTop >= maxScroll - 10 ? '0' : '1';
        }
    }

    function setupScrollIndicators() {
        [els.causeScroll, els.solutionScroll].forEach(scrollEl => {
            if (scrollEl) {
                scrollEl.addEventListener('scroll', () => handleScrollIndicators(scrollEl));
                window.setTimeout(() => handleScrollIndicators(scrollEl), 100);
            }
        });
    }

    function createPickerCard(item, index, type) {
        const card = document.createElement("article");
        card.className = `picker-card picker-card--${type}`;
        card.setAttribute("role", "listitem");
        card.dataset.type = type;
        card.dataset.index = String(index);
        card.dataset.id = item.id;

        const imgHtml = item.image ? `<img src="${item.image}" alt="" class="card-img">` : PLACEHOLDER_SVG;
        card.innerHTML = `
            <div class="picker-card__image">${imgHtml}</div>
            <p class="picker-card__caption">${escapeHtml(item.text)}</p>
        `;

        setupDraggable(card, type, item, index);
        return card;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    function renderCardScroll(container, items, type) {
        if (!container) return;
        const existingCards = container.querySelectorAll('.picker-card');
        existingCards.forEach(card => card.remove());
        
        items.forEach((item, index) => {
            container.appendChild(createPickerCard(item, index, type));
        });
        container.scrollTop = 0;
        window.setTimeout(() => handleScrollIndicators(container), 50);
    }

    function updateProblemView(animate) {
        const level = getLevel();
        const apply = () => {
            els.problemHeading.textContent = level.problem.title;
            renderImage(els.problemImage, level.problem.image, level.problem.title);
            if (els.levelIndicator) {
                els.levelIndicator.textContent = `Level ${levelIndex + 1} of ${LEVEL_COUNT}`;
            }
            updateProgress();
        };

        if (animate) {
            runSwap(els.problemImage, apply);
        } else {
            apply();
        }
    }

    // Function to reset a specific drop zone to empty state
    function resetDropZone(zoneEl, type) {
        if (!zoneEl) return;
        const label = type === "cause" ? "Cause" : "Solution";
        zoneEl.className = `drop-zone drop-zone--${type}`;
        zoneEl.innerHTML = `
            <span class="drop-zone__label">${label}</span>
            <span class="drop-zone__hint">Drop here</span>
        `;
        zoneEl.classList.remove("drop-zone--filled", "drop-zone--correct", "drop-zone--wrong");
    }

    function handleDrop(type, item, index) {
        const isCorrect = (item.id === "correct");
        const zoneEl = type === "cause" ? els.causeDrop : els.solutionDrop;
        if (!zoneEl) return;

        // If a correct match is already locked for this type, prevent dropping
        if ((type === "cause" && droppedCause?.isCorrect) || (type === "solution" && droppedSolution?.isCorrect)) {
            showFeedback(`You already matched the correct ${type}!`, "info");
            return;
        }

        zoneEl.className = `drop-zone drop-zone--${type}`;
        void zoneEl.offsetWidth;

        const imgHtml = item.image ? `<img src="${item.image}" alt="" class="drop-zone__img">` : PLACEHOLDER_SVG;
        zoneEl.innerHTML = `
            <span class="drop-zone__label">${type === "cause" ? "Cause" : "Solution"}</span>
            <div class="drop-zone__content">${imgHtml}</div>
            <p class="drop-zone__caption">${escapeHtml(item.text)}</p>
        `;
        zoneEl.classList.add("drop-zone--filled");
        zoneEl.classList.add(isCorrect ? "drop-zone--correct" : "drop-zone--wrong");

        if (isCorrect) {
            // Correct match - keep it in the box and lock it
            if (type === "cause") {
                droppedCause = { item, isCorrect };
            } else {
                droppedSolution = { item, isCorrect };
            }
            
            clearFeedback();
            const scrollBox = type === "cause" ? els.causeScroll : els.solutionScroll;
            const matchedCard = scrollBox.querySelector(`.picker-card[data-index="${index}"]`);
            if (matchedCard) matchedCard.classList.add("is-locked");
            showFeedback(`Great! The correct ${type} has been matched!`, "success");
        } else {
            // Wrong match - show error, then clear the box after a delay
            showFeedback(`That is not the correct ${type}. Try a different option!`, "error");
            
            // Schedule removal of the wrong card from the drop zone
            setTimeout(() => {
                // Only reset if this specific type hasn't been correctly matched yet
                if ((type === "cause" && !droppedCause?.isCorrect) || (type === "solution" && !droppedSolution?.isCorrect)) {
                    resetDropZone(zoneEl, type);
                }
            }, 1200);
        }

        checkLevelCompletion();
    }

    function renderImageToSticker(container, src) {
        if (!container) return;
        const imageDiv = container.querySelector('.sticker-item__image');
        if (imageDiv) {
            imageDiv.innerHTML = src ? `<img src="${src}" alt="Sticker image">` : PLACEHOLDER_SVG;
        }
    }

    function checkLevelCompletion() {
        if (!droppedCause || !droppedSolution) return;
        
        if (droppedCause.isCorrect && droppedSolution.isCorrect) {
            levelLocked = true;
            
            const currentLevelNum = levelIndex + 1;
            const currentLevelData = LEVEL_COPY[currentLevelNum];
            
            if (els.stickerDescription && currentLevelData) {
                els.stickerDescription.textContent = currentLevelData.description;
            }

            const level = getLevel();
            renderImageToSticker(els.stickerProb, level.problem.image);
            renderImageToSticker(els.stickerCause, droppedCause.item.image);
            renderImageToSticker(els.stickerSol, droppedSolution.item.image);
            
            const probTitle = els.stickerProb.querySelector('.sticker-item__title');
            if (probTitle) probTitle.textContent = level.problem.title;
            
            const causeTitle = els.stickerCause.querySelector('.sticker-item__title');
            if (causeTitle) causeTitle.textContent = droppedCause.item.text;
            
            const solTitle = els.stickerSol.querySelector('.sticker-item__title');
            if (solTitle) solTitle.textContent = droppedSolution.item.text;

            window.setTimeout(() => {
                if (els.sticker) {
                    els.sticker.classList.add("is-visible");
                    launchConfetti();
                    els.sticker.setAttribute("aria-hidden", "false");
                }
            }, 300);
        }
    }

    function resetDropZones() {
        droppedCause = null;
        droppedSolution = null;
        resetDropZone(els.causeDrop, "cause");
        resetDropZone(els.solutionDrop, "solution");
    }

    function renderLevel(animate) {
        // Force refresh to get new decoys
        currentLevelData = null;
        const level = getLevel();
        
        levelLocked = false;
        resetDropZones();
        updateProblemView(animate);
        renderCardScroll(els.causeScroll, level.causes, "cause");
        renderCardScroll(els.solutionScroll, level.solutions, "solution");
        clearFeedback();

        [els.causeScroll, els.solutionScroll].forEach(s => {
            if (s) window.setTimeout(() => handleScrollIndicators(s), 100);
        });
    }

    function playLevelTransition() {
        if (!els.gameBoard || prefersReducedMotion()) return;
        els.gameBoard.classList.remove("level-transition");
        void els.gameBoard.offsetWidth;
        els.gameBoard.classList.add("level-transition");
    }

    function clearFeedback() {
        if (!els.feedback) return;
        els.feedback.textContent = "";
        els.feedback.className = "game-feedback";
    }

    function showFeedback(message, type) {
        if (!els.feedback) return;
        els.feedback.textContent = message;
        els.feedback.className = `game-feedback game-feedback--${type} is-visible`;
        
        window.setTimeout(() => {
            if (els.feedback && els.feedback.classList.contains('is-visible')) {
                els.feedback.classList.remove('is-visible');
            }
        }, 3000);
    }

    function goToNextLevel() {
        levelIndex = (levelIndex + 1) % LEVEL_COUNT;
        playLevelTransition();
        renderLevel(true);
    }

    function setupDraggable(card, type, item, index) {
        card.setAttribute("draggable", "true");
        
        card.addEventListener("dragstart", (e) => {
            if (levelLocked) {
                e.preventDefault();
                return false;
            }
            // Prevent dragging cards that are already locked (correct cards)
            if (card.classList.contains("is-locked")) {
                e.preventDefault();
                return false;
            }
            draggedItem = { type, item, index };
            card.classList.add("is-dragging");
            e.dataTransfer.setData("text/plain", "");
            e.dataTransfer.effectAllowed = "move";
        });
        
        card.addEventListener("dragend", () => {
            card.classList.remove("is-dragging");
            draggedItem = null;
        });
    }

    function setupDropZones() {
        const zones = document.querySelectorAll(".drop-zone");
        zones.forEach((zone) => {
            zone.addEventListener("dragover", (e) => {
                e.preventDefault();
                if (draggedItem && zone.dataset.accept === draggedItem.type && !levelLocked) {
                    zone.classList.add("drop-zone--over");
                    e.dataTransfer.dropEffect = "move";
                }
            });
            
            zone.addEventListener("dragleave", () => {
                zone.classList.remove("drop-zone--over");
            });
            
            zone.addEventListener("drop", (e) => {
                e.preventDefault();
                zone.classList.remove("drop-zone--over");
                if (levelLocked) {
                    showFeedback("You've already completed this level! Click continue.", "info");
                    return;
                }
                if (draggedItem && zone.dataset.accept === draggedItem.type) {
                    handleDrop(draggedItem.type, draggedItem.item, draggedItem.index);
                } else if (draggedItem) {
                    showFeedback(`Drop ${draggedItem.type} cards on the ${draggedItem.type} slot.`, "error");
                }
            });
        });
    }

    function launchConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement("div");
            confetti.className = "confetti";
            confetti.style.left = Math.random() * 100 + "vw";
            confetti.style.animationDelay = Math.random() * 1.5 + "s";
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 12 + 4 + "px";
            confetti.style.height = Math.random() * 12 + 4 + "px";
            confetti.style.animationDuration = Math.random() * 2 + 2 + "s";
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti && confetti.remove) confetti.remove();
            }, 3500);
        }
    }

    function init() {
        if (typeof LEVEL_COPY === "undefined") {
            showFeedback("No game data loaded.", "error");
            return;
        }
        
        setupDropZones();
        setupScrollIndicators();
        renderLevel(false);
        showFeedback("Scroll through the cards, then drag them onto the matching slots!", "info");

        if (els.nextBtn) {
            els.nextBtn.addEventListener("click", () => {
                if (els.sticker) {
                    els.sticker.classList.remove("is-visible");
                    els.sticker.setAttribute("aria-hidden", "true");
                }
                goToNextLevel();
            });
        }
        
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && els.sticker && els.sticker.classList.contains("is-visible")) {
                els.sticker.classList.remove("is-visible");
                els.sticker.setAttribute("aria-hidden", "true");
            }
        });
        
        if (els.sticker) {
            els.sticker.addEventListener("click", (e) => {
                if (e.target === els.sticker) {
                    els.sticker.classList.remove("is-visible");
                    els.sticker.setAttribute("aria-hidden", "true");
                }
            });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();