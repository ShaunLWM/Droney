import "jest-extended";
import "dotenv/config";

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

	it("should return torrent details", async () => {
		const torrent = await client.getTorrentDetails(torrents[0].hash);
		expect(torrent).toBeDefined();
	});
});