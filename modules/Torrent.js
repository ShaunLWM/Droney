const Utils = require('../lib/Utils');

const FIELDS = ["d.is_open", "d.is_hash_checking", "d.is_hash_checked", "d.get_state", "d.get_name", "d.get_size_bytes", "d.get_completed_chunks", "d.get_size_chunks", "d.get_bytes_done", "d.get_up_total", "d.get_ratio", "d.get_up_rate", "d.get_down_rate", "d.get_chunk_size", "d.get_custom1", "d.get_peers_accounted", "d.get_peers_not_connected", "d.get_peers_connected", "d.get_peers_complete", "d.get_left_bytes", "d.get_priority", "d.get_state_changed", "d.get_skip_total", "d.get_hashing", "d.get_chunks_hashed", "d.get_base_path", "d.get_creation_date", "d.get_tracker_focus", "d.is_active", "d.get_message", "d.get_custom2", "d.get_free_diskspace", "d.is_private", "d.is_multi_file"];

class Torrent {
    constructor() {
        this._info = null;
        this._hash = null;
    }

    parse(hash, data) {
        this._hash = hash;
        this._info = Utils.getTorrentInfo(data);
        return this;
    }

    get info() {
        return this._info;
    }

    get hash() {
        return this._hash;
    }

    stop() {

    }
}

module.exports = Torrent;
