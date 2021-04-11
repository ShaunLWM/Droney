import "dotenv/config";
import "jest-extended";

import path from "path";
import RuTorrent from "../modules/RuTorrent";
import type { Torrent } from "../typings";

describe("RUTorrent API", () => {
	let torrents: Torrent[];

	const client = new RuTorrent({
		host: process.env.TEST_RTORRENT_HOST as string,
		username: process.env.TEST_RTORRENT_USERNAME as string,
		password: process.env.TEST_RTORRENT_PASSWORD as string,
		path: process.env.TEST_RTORRENT_PATH as string,
		port: Number(process.env.TEST_RTORRENT_PORT),
		ssl: (process.env.TEST_RTORRENT_SSL as string) === "true",
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should initialize properly", async () => {
		torrents = (await client.getTorrents()) as Torrent[];
		expect(torrents).toBeDefined();
		expect(torrents).toBeArray();
	});

	it("should parse torrent details", async () => {
		torrents = (await client.getTorrents()) as Torrent[];
		let torrent = await client.getTorrentDetails(torrents[0].hash);
		expect(torrent.trackers.length).toBeGreaterThan(0);
	});

	it("should upload simple torrent file", async () => {
		const add = await client.addFile(path.join(__dirname, "./big-buck-bunny.torrent"));
		expect(add).toBeUndefined();
	});

	fit("should get torrent file list", async () => {
		torrents = (await client.getTorrents()) as Torrent[];
		let torrent = await client.getFileList(torrents[0].hash);
		console.log(torrent);
	});
});
