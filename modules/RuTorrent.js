const axios = require("axios");
const qs = require("querystring");
const FormData = require("form-data");
const Torrent = require("./Torrent");

class RuTorrent {
    constructor(options = {}) {
        if (Object.keys(options).length < 1) throw new Error("Missing parameters");
        const protocol = options["ssl"] ? "https" : "http";
        const host = options["host"] || "localhost";
        const port = options["port"] || 443;
        const path = options["path"] || "/rutorrent";
        this.axios = axios.create({ baseURL: `${protocol}://${host}:${port}${path}` });
        if (options["username"])
            this.axios.defaults.headers.common["Authorization"] = `Basic ${Buffer.from(`${options["username"]}:${options["password"] || ""}`).toString("base64")}`;
    }

    callServer(options) {
        if (!options.type) options.type = "application/x-www-form-urlencoded";
        if (!options.headers) options.headers = {};
        return new Promise(async (resolve, reject) => {
            try {
                const response = await this.axios.post(options.path, options.data, {
                    responseType: "json",
                    maxRedirects: 0,
                    headers: {
                        "Content-Type": options.type,
                        ...options.headers,
                    },
                });

                if (response.headers["content-type"].indexOf("application/json") === -1) throw new Error(response.data);
                return resolve(response.data);
            } catch (err) {
                console.log(err)
                if (err.response.status === 302 && err.response.headers.location.indexOf("Success") !== -1)
                    return resolve(true);
                return reject(err);
            }
        });
    }

    addFile(file, options = {}, fields = []) {
        const formData = new FormData();
        formData.append("torrent_file", file, "torrent");
        if (options.label) formData.append("label", options.label);
        if (options.destination) formData.append("dir_edit", options.destination);
        return new Promise((resolve, reject) => {
            this.callServer({
                type: "multipart/form-data",
                path: "/php/addtorrent.php",
                data: formData,
                headers: formData.getHeaders(),
            }).then(() => {
                return this.get(fields);
            }).then((data) => {
                resolve(data.pop());
            }).catch(err => {
                reject(err);
            });
        });
    }

    parseResponse(data) {
        if (typeof data === "boolean" && !data) return false;
        return true;
    }

    async get() {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "list" }),
        });

        return Object.keys(data.t).map((hashString) => {
            return new Torrent().parse(hashString, data["t"][hashString]);
        });
    }

    async stop(hash) {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "stop", hash }),
        });

        return parseResponse(data);
    }

    async start(hash) {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "start", hash }),
        });

        return parseResponse(data);
    }

    async pause(hash) {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "pause", hash }),
        });

        return parseResponse(data);
    }

    async unpause(hash) {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "unpause", hash }),
        });

        return parseResponse(data);
    }

    async remove(hash) {
        const data = await this.callServer({
            path: "/plugins/httprpc/action.php",
            data: qs.stringify({ mode: "remove", hash }),
        });

        return parseResponse(data);
    }
}

module.exports = RuTorrent;
