const { app, BrowserWindow, ipcMain } = require("electron");
const electronPug = require("electron-pug");
const path = require("path");
const url = require("url");

let mainWindow;
const width = 480;
const height = 620;

app.on("ready", () => {
    setTimeout(() => {
        const woptions = {
            webPreferences: {
                nodeIntegration: true,
                devTools: false
            },
            show: false,
            frame: false,
            transparent: true,
            width,
            minWidth: width,
            maxWidth: width,
            height,
            minHeight: height,
            maxHeight: height,
            icon: path.join(__dirname, "images", "favicon.png")
        };

        electronPug({ pretty: true })
        .then(() => {
            // pug.on("error", console.error);

            mainWindow = new BrowserWindow(woptions);

            mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, "views", "index.pug"),
                protocol: "file:",
                slashes: true
            }));

            mainWindow.on("closed", () => {
                app.quit();
            });

            mainWindow.once("ready-to-show", () => {
                mainWindow.show();
            });

            mainWindow.on("maximize", () => console.log("full-screen"));

            mainWindow.setFullScreenable(false);
            mainWindow.setMaximizable(false);
            mainWindow.setResizable(false);
        })
        .catch(console.error);

    }, 100);
});

ipcMain.on("window:minimize", () => {
    const window = BrowserWindow.getFocusedWindow();
    if(window.isMinimized()) {
        return window.restore();
    }
    return window.minimize();
});

process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);