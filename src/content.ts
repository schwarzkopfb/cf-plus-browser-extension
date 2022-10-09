import { Config, sendShuffleSuggestionsRequest } from './utils';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const $body = document.body;
const createElement = document.createElement.bind(document);

let user: User;
let config: Config;
let $highlightUp: HTMLDivElement;
let $highlightDown: HTMLDivElement;
let $buttonsContainer: HTMLDivElement;

export interface User {
    username: string;
    numOfPowerUps: number;
    slotUp: string;
    slotDown: string;
    updatedAt: number;
    roomId: string;
}

function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function onBodyMutation(callback: MutationCallback) {
    const observer = new MutationObserver(callback);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    return observer;
}

function waitForElems(selector: string): Promise<NodeListOf<Element>> {
    return new Promise((resolve) => {
        let elems = $$(selector);

        if (elems.length) {
            return resolve(elems);
        }

        const observer = onBodyMutation(() => {
            elems = $$(selector);

            if (elems.length) {
                resolve(elems);
                observer.disconnect();
            }
        });
    });
}

async function loadConfig(): Promise<Config> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['serverUrl', 'serverAccessToken', 'roomId', 'showButtons'], (data) => resolve(data as Config));
    });
}

async function getUsername(): Promise<string> {
    const [$label] = await waitForElems('.c-user__name');
    return ($label as HTMLDivElement).innerText;
}

async function waitForUsername(): Promise<string> {
    let username = await getUsername();

    // this is the placeholder username while loading
    while (username === 'Loading...') {
        await sleep();
        username = await getUsername();
    }

    return username;
}

async function waitForNumOfPowerUps(): Promise<number> {
    const $modules = await waitForElems('.inventory__module-slot .module-card');
    return 30 - Array.from($modules).filter(m => m.classList.contains('module-card--locked')).length;
}

async function registerUser(): Promise<User> {
    const requestOptions = {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'X-Access-Token': config.serverAccessToken,
        },
        body: JSON.stringify({
            username: await waitForUsername(),
            numOfPowerUps: await waitForNumOfPowerUps(),
            roomId: config.roomId,
        })
    };
    const res = await fetch(`${config.serverUrl}/user`, requestOptions);
    return await res.json() as User;
}

async function fetchUser(): Promise<User> {
    const username = await getUsername();
    const res = await fetch(`${config.serverUrl}/user/${encodeURIComponent(username)}`, {
        headers: {
            'X-Access-Token': config.serverAccessToken,
        }
    });
    return await res.json() as User;
}

function createHighlights(): void {
    for (const isUp of [true, false]) {
        const $highlight = createElement('div');
        $highlight.classList.add('cfp__module_highlight', 'cfp__hidden');

        if (isUp) {
            $highlightUp = $highlight;
        } else {
            $highlight.classList.add('cfp__module_highlight--upside-down');
            $highlightDown = $highlight;
        }

        $body.insertBefore($highlight, $body.firstChild);
    }
}

function createButtons(): void {
    $buttonsContainer = createElement('div');
    const $showButton = createElement('button');
    const $shuffleButton = createElement('button');

    $buttonsContainer.classList.add('cfp__util-buttons', 'cfp__hidden');
    $showButton.classList.add('cfp__util-button', 'cfp__show-suggestions-button');
    $shuffleButton.classList.add('cfp__util-button', 'cfp__shuffle-suggestions-button');

    $showButton.innerText = 'Show suggestions';
    $shuffleButton.innerText = 'Shuffle for everyone';

    $showButton.addEventListener('click', () => {
        showHighlights();
    });
    $shuffleButton.addEventListener('click', () => {
        sendShuffleSuggestionsRequest(config);
    });

    $buttonsContainer.appendChild($showButton);
    $buttonsContainer.appendChild($shuffleButton);
    $body.insertBefore($buttonsContainer, $body.firstChild);
}

async function moveHighlightToModule($highlight: HTMLDivElement, moduleName: string): Promise<void> {
    const $modules = await waitForElems('.inventory__module-slot .module-card');
    $modules.forEach(m => {
        const name = (m.querySelector('.text-label')! as HTMLDivElement).innerText;

        if (moduleName === 'unavailable') {
            $highlight.style.left = `-100px`;
            $highlight.style.top = `-100px`;
        }
        else if (name === moduleName) {
            const content = m.querySelector('.module-card__content');
            const { x, y, width, height } = content!.getBoundingClientRect();

            $highlight.style.left = `${x}px`;
            $highlight.style.top = `${y}px`;
            $highlight.style.width = `${width}px`;
            $highlight.style.height = `${height}px`;
        }
    });
}

async function moveHighlightsToDesiredPositions(): Promise<void> {
    await Promise.all([
        moveHighlightToModule($highlightUp, user.slotUp),
        moveHighlightToModule($highlightDown, user.slotDown)
    ]);
}

async function showHighlights(): Promise<void> {
    await moveHighlightsToDesiredPositions();
    $highlightUp.classList.remove('cfp__hidden');
    $highlightDown.classList.remove('cfp__hidden');
}

async function updateHighlights(): Promise<void> {
    const key = `cfp_updated_at:${user.username}`;
    const value = localStorage.getItem(key);

    if (value === null || parseInt(value) < user.updatedAt) {
        await showHighlights();
        localStorage.setItem(key, Date.now().toString());
    }
}

function showButtons(): void {
    if (!$buttonsContainer) {
        return;
    }

    $buttonsContainer.classList.remove('cfp__hidden');
}

function isAdContainerVisible(): boolean {
    const $container = $('.fullscreen-ad-container') as HTMLDivElement;
    return $container?.style.display !== 'none';
}

function isPlayButtonExists() {
    return !!$('.play-button');
}

async function waitForAdContainerToBeHidden(): Promise<void> {
    while (isAdContainerVisible()) {
        await sleep();
    }
}

async function updateState(): Promise<void> {
    // checking the DOM is way more cheap than a network request and
    // we're only interested in updates of user's powerUp on selection page
    if (!isPlayButtonExists() || isAdContainerVisible()) {
        return;
    }

    user = await fetchUser();
    await updateHighlights();
}

~async function init() {
    config = await loadConfig();
    user = await registerUser();

    createHighlights();

    if (config.showButtons) {
        createButtons();
    }

    await waitForAdContainerToBeHidden();
    showButtons();
    await updateHighlights();

    setInterval(updateState, 5000);

    const eventSource = new EventSource(`${config.serverUrl}/room/${config.roomId}/event-stream?access_token=${config.serverAccessToken}`);
    eventSource.addEventListener('message', updateState);


    // hide highlights and buttons if user navigates away from the selection page
    onBodyMutation(() => {
        if (!isPlayButtonExists() || isAdContainerVisible()) {
            $highlightUp.classList.add('cfp__hidden');
            $highlightDown.classList.add('cfp__hidden');
        }

        if (isPlayButtonExists()) {
            $buttonsContainer.classList.remove('cfp__hidden');
        } else {
            $buttonsContainer.classList.add('cfp__hidden');
        }
    });

    window.addEventListener('resize', moveHighlightsToDesiredPositions);

    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'show-suggestions') {
            showHighlights();
        }
    });
}();