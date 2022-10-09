export interface Config {
    serverUrl: string;
    serverAccessToken: string;
    roomId: string;
    showButtons: boolean;
}

export function sendShuffleSuggestionsRequest({ serverUrl, roomId, serverAccessToken }: Config) {
    fetch(`${serverUrl}/room/${roomId}/powerups`, { 
        method: 'PATCH',
        headers: {
            'X-Access-Token': serverAccessToken,
        }
    });
}