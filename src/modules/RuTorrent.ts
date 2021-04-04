import fs from "fs";
import XMLRPC from "xmlrpc";
import { TorrentStatus } from "../lib/Enums";
import { XMLRPC_EXTRA_PADDING, XMLRPC_MINIMUM_SIZE } from "../lib/Helper";
import type { RawTorrentObject, RuTorrentOptions, Torrent } from "../typings";

export default class RuTorrent {
	client: XMLRPC.Client;
	version: number = -1;

	constructor(options: RuTorrentOptions) {
		// TODO: fix typings
		const xmlOptions: any = {
			...options,
			// headers: {
			// 	"User-Agent": "NodeJS XML-RPC Client",
			// 	"Content-Type": "text/xml",
			// 	Accept: "text/xml",
			// 	"Accept-Charset": "UTF8",
			// 	// Connection: "Close",
			// 	...options.headers,
			// },
		};

		if (options.username && options.password) {
			xmlOptions.basic_auth = {
				user: options.username,
				pass: options.password,
			};
		}

		this.client = options.ssl ? XMLRPC.createSecureClient(xmlOptions) : XMLRPC.createClient(xmlOptions);
	}

	getVersion = async () => {
		if (this.version === -1) {
			try {
				const versionObject = await this.makeRtorrentCall<string>("system.client_version", []);
				const versionRaw: number[] = versionObject.split(".").map(Number);
				this.version = versionRaw[0] * 10000 + versionRaw[1] * 100 + versionRaw[2];
			} catch (e) {
				this.version = 10000;
			}
		}
	};

	makeRtorrentCall = <T>(serverMethod: string, params: any[]): Promise<T> => {
		return new Promise((resolve, reject) => {
			this.client.methodCall(serverMethod, params, (error: Object, result: any) => {
				if (error) return reject(error);
				// console.log(result);
				return resolve(result as T);
			});
		});
	};

	getTorrents = async (raw = false): Promise<RawTorrentObject[] | Torrent[]> => {
		const torrents = await this.makeRtorrentCall<RawTorrentObject[]>("d.multicall2", [
			"",
			"main",
			"d.hash=",
			"d.name=",
			"d.state=",
			"d.down.rate=",
			"d.up.rate=",
			"d.peers_connected=",
			"d.peers_not_connected=",
			"d.peers_accounted=",
			"d.bytes_done=",
			"d.up.total=",
			"d.size_bytes=",
			"d.creation_date=",
			"d.left_bytes=",
			"d.complete=",
			"d.is_active=",
			"d.is_hash_checking=",
			"d.is_multi_file=",
			"d.base_filename=",
			"d.message=",
			"d.custom=addtime",
			"d.custom=seedingtime",
			"d.custom1=",
			"d.peers_complete=",
			"d.peers_accounted=",
			"d.is_open=",
		]);

		if (raw) return torrents;
		return torrents.map(this.parseTorrentData);
	};

	async getTorrentDetails(id: string) {
		return await this.makeRtorrentCall("t.multicall", [id, "", "t.url="]);
	}

	async getFileList(id: string) {
		return await this.makeRtorrentCall("f.multicall", [
			id,
			"",
			"f.path=",
			"f.size_bytes=",
			"f.priority=",
			"f.completed_chunks=",
			"f.size_chunks=",
			"f.priority=",
			"f.frozen_path=",
		]);
	}

	addFile = async (filePath: string) => {
		if (!fs.existsSync(filePath)) throw new Error("File not found: " + filePath);
		await this.getVersion();
		const file = fs.statSync(filePath);
		const size = Math.max(file.size * 2 + XMLRPC_EXTRA_PADDING, XMLRPC_MINIMUM_SIZE);
		if (this.version >= 904) {
			await this.makeRtorrentCall("network.xmlrpc.size_limit.set", ["", `${size + XMLRPC_EXTRA_PADDING}`]);
			await this.makeRtorrentCall("load.raw_start", ["", fs.readFileSync(filePath)]);
		} else {
			await this.makeRtorrentCall("set_xmlrpc_size_limit", ["", `${size + XMLRPC_EXTRA_PADDING}`]);
			await this.makeRtorrentCall("load_raw_start", ["", fs.readFileSync(filePath)]);
		}
	};

	async add(url: string) {
		await this.getVersion();
		if (this.version > 904) {
			return await this.makeRtorrentCall("load.start", ["", url]);
		}

		return await this.makeRtorrentCall("load_start", [url]);
	}

	async remove(id: string, includeData = false) {
		if (includeData) {
			await this.makeRtorrentCall("d.custom5.set", [id, "1"]);
		}

		return await this.makeRtorrentCall("d.erase", [id]);
	}

	async pause(id: string) {
		return await this.makeRtorrentCall("d.stop", [id]);
	}

	async pauseAll() {
		return await this.makeRtorrentCall("d.multicall2", ["", "main", "d.stop="]);
	}

	async resume(id: string) {
		return await this.makeRtorrentCall("d.start", [id]);
	}

	async resumeAll() {
		return await this.makeRtorrentCall("d.multicall2", ["", "main", "d.start="]);
	}

	async stop(id: string) {
		await this.makeRtorrentCall("d.stop", [id]);
		return await this.makeRtorrentCall("d.close", [id]);
	}

	async stopAll() {
		return await this.makeRtorrentCall("d.multicall2", ["", "main", "d.stop=", "d.close="]);
	}

	async start(id: string) {
		await this.makeRtorrentCall("d.open", [id]);
		return await this.makeRtorrentCall("d.start", [id]);
	}

	async startAll() {
		return await this.makeRtorrentCall("d.multicall2", ["", "main", "d.open=", "d.start="]);
	}

	async setFilePriorities() {}

	async setTransferRate(downloadRate?: number, uploadRate?: number) {
		await this.makeRtorrentCall("throttle.global_down.max_rate.set", ["", downloadRate ? `${downloadRate}k` : "0"]);
		return await this.makeRtorrentCall("throttle.global_up.max_rate.set", [
			"",
			uploadRate ? `${uploadRate}k` : "0",
		]);
	}

	async setLabel(id: string, label: string) {
		if (!label) return;
		return await this.makeRtorrentCall("d.custom1.set", [id, label]);
	}

	async forceRecheck(id: string) {
		return await this.makeRtorrentCall("d.check_hash", [id]);
	}

	convertTorrentStatus = (state: number, open: number, complete: number, active: number, checking: number) => {
		if (checking === 1) return TorrentStatus.Checking;
		if (open === 1) {
			if (state === 1 && active === 1) {
				if (complete === 1) {
					return TorrentStatus.Seeding;
				} else {
					return TorrentStatus.Downloading;
				}
			}

			return TorrentStatus.Paused;
		} else {
			return TorrentStatus.Queued;
		}
	};

	parseTorrentData = (raw: RawTorrentObject, index: number): Torrent => {
		const labels = new Map<string, number>();

		let added;
		if (isNaN(Number(raw[19].trim()))) {
			added = new Date(Number(raw[11]) * 1000);
		} else {
			added = new Date(Number(raw[19].trim()) * 1000);
		}

		let finished = null;
		if (!isNaN(Number(raw[20].trim()))) {
			finished = new Date(Number(raw[20].trim()) * 1000);
		}

		let label = null;
		try {
			label = decodeURI(raw[21]);
			labels.set(label, (labels.get(label) ?? 0) + 1);
		} catch (e) {}

		const baseFilename = `${raw[17]}/`;
		const eta = Number(raw[3]) > 0 ? Number(raw[12]) / Number(raw[3]) : -1;
		return {
			id: index,
			hash: raw[0],
			name: raw[1],
			statusCode: this.convertTorrentStatus(
				Number(raw[2]),
				Number(raw[24]),
				Number(raw[13]),
				Number(raw[14]),
				Number(raw[15])
			),
			locationDir: Number(raw[16]) === 1 ? baseFilename : "",
			rateDownload: Number(raw[3]),
			rateUpload: Number(raw[4]),
			seedersConnected: Number(raw[22]),
			seedersKnown: Number(raw[5]),
			leechersConnected: Number(raw[23]),
			leechersKnown: Number(raw[5]) + Number(raw[6]),
			eta,
			downloadedEver: Number(raw[8]),
			uploadedEver: Number(raw[9]),
			totalSize: Number(raw[10]),
			partDone: Number(raw[8]) / Number(raw[10]),
			available: 0,
			label: "",
			dateAdded: added,
			realDateDone: finished,
			error: raw[18] ?? null,
		};
	};
}
