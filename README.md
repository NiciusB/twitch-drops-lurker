# twitch-drops-lurker

## Installation

1. Clone the repository to your device with `git clone https://github.com/NiciusB/twitch-drops-lurker.git`
2. Install npm depencencies. First go to the downloaded folder `cd twitch-drops-lurker` and run `npm install`
3. Create a `.env` file by copying and modifying the example `.env.example` file. For further information, refer to the .env section below
4. Create a `localStorage.json` file. For the content, run `copy(Object.entries(localStorage))` in the console when having twitch.tv open. This will fill your clipboard and you can paste it directly into `localStorage.json`
5. Create a `cookies.json` file. Some of the cookies are not accesible from javascript, so you'll need to export them using the extension EditThisCookie

## .env
* `CHROME_EXEC_PATH`: The path for your chrome executable. In windows it's usually `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`, in macOS `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, and in linux you can run `which chrome`
* `GAME`: The game you want to lurk. You can get this value by going to Browse -> Your game of choice. Then, copy the ID from the address bar. For example, for Dark Souls III the address bar will be `https://www.twitch.tv/directory/game/Dark%20Souls%20III`, so the GAME value will be `Dark%20Souls%20III`
* `PORT`: Port for the webserver that allows monitoring the bot's status
* `SCREENSHOT_INTERVAL`: Interval in seconds between every screenshot. The webserver serves these screenshots for easier debugging

## Deploying
We recommend using a tool like `pm2` to manage your node process. It will automatically launch on boot, recover from errors, and save logs and crashes to disk.