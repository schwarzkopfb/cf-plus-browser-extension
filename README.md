# cf-plus-browser-extension

* [What's this?](https://github.com/schwarzkopfb/cf-plus)
* [Server](https://github.com/schwarzkopfb/cf-plus-server)

The extension extracts `username` and `numOfPowerUps` from the UI and automatically registers a user with the `roomId` coming from the config. Then it periodically pulls the generated random powerUp suggestions for that user and highlights them.
It also has a button to send a request to the server to regenerate all the suggestions for users with the same `roomId`.

Tested in Chrome and Edge, available in the [Chrome Web Store](https://chrome.google.com/webstore/detail/iohchpjmenfkbbpkecchfpomhnmgfmlc).

| extension UI | example config |
| --- | --- |
| <img width="227" alt="popup_empty" src="https://user-images.githubusercontent.com/1900242/194119461-ce2e7024-36ab-4ca2-b1f6-91b13d147319.png">  | <img width="225" alt="popup_example" src="https://user-images.githubusercontent.com/1900242/194119827-8d5b010d-82d4-43aa-ab74-19808bf5ab8c.png"> |

<img width="852" alt="suggestions" src="https://user-images.githubusercontent.com/1900242/194119911-8bbdc43e-f195-4d00-a30e-910728c78560.png">

## Development

1. Clone the repo
2. Run `npm i` in the repo's folder
3. Make your changes in the `src` folder
4. Run `npm run lint` to check for common mistakes in the code
5. (Put static assets into the `public` folder)
6. Run `npm run build` to compile the extension into the `dist` folder
7. Use the **Load unpacked** button in Chrome's extensions tab (`chrome://extensions`) and select the path of the `dist` folder you just created to test it

[MIT licensed](LICENSE)
