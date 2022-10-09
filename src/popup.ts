import { Config, sendShuffleSuggestionsRequest } from './utils';

let config: Config = {
    serverUrl: '',
    serverAccessToken: '',
    roomId: '',
    showButtons: true,
};

const $ = document.querySelector.bind(document);
const $serverUrlInput = $('#server-url')! as HTMLInputElement;
const $serverAccessTokenInput = $('#server-access-token')! as HTMLInputElement;
const $roomIdInput = $('#room-id')! as HTMLInputElement;
const $showButtonsInput = $('#show-buttons')! as HTMLInputElement;
const $saveButton = $('#save-settings')! as HTMLButtonElement;
const $showSuggestionsButton = $('#show-suggestions')! as HTMLButtonElement;
const $shuffleSuggestionsButton = $('#shuffle-suggestions')! as HTMLButtonElement;

function updateUI() {
    const disabled = !config.serverUrl || !config.roomId;
    $showSuggestionsButton.disabled = disabled;
    $shuffleSuggestionsButton.disabled = disabled;
}

function saveOptions() {
    chrome.storage.sync.set(config);
}

function loadOptions() {
    chrome.storage.sync.get(['serverUrl', 'serverAccessToken', 'roomId', 'showButtons'], (result) => {
        config.serverUrl = result.serverUrl || '';
        config.serverAccessToken = result.serverAccessToken || '';
        config.roomId = result.roomId || '';
        config.showButtons = result.showButtons;
        $serverUrlInput.value = config.serverUrl;
        $serverAccessTokenInput.value = config.serverAccessToken;
        $roomIdInput.value = config.roomId;
        $showButtonsInput.checked = config.showButtons;
        updateUI();
    });
}

function updateServerUrl() {
    config.serverUrl = $serverUrlInput.value.replace(/\/$/, '');
    saveOptions();
    updateUI();
}

function updateServerAccessToken() {
    config.serverAccessToken = $serverAccessTokenInput.value;
    saveOptions();
}

function updateRoomId() {
    config.roomId = $roomIdInput.value;
    saveOptions();
    updateUI();
}

function updateShowButtons() {
    config.showButtons = $showButtonsInput.checked;
    saveOptions();
}

function sendShowSuggestionsMessage() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
        if (id) {
            chrome.tabs.sendMessage(id, { type: 'show-suggestions' });
        }
    });
}

function saveSettingsAndReloadPage() {
    saveOptions();
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
        if (id) {
            chrome.tabs.reload(id);
        }
    });
}

~function init() {
    loadOptions();
    $serverUrlInput.addEventListener('input', updateServerUrl);
    $serverAccessTokenInput.addEventListener('input', updateServerAccessToken);
    $roomIdInput.addEventListener('input', updateRoomId);
    $saveButton.addEventListener('click', saveSettingsAndReloadPage);
    $showSuggestionsButton.addEventListener('click', sendShowSuggestionsMessage);
    $shuffleSuggestionsButton.addEventListener('click', () => sendShuffleSuggestionsRequest(config));
    $showButtonsInput.addEventListener('change', updateShowButtons);
}();
