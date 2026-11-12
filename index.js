/**
 * dsh-compactui 宿主侧（几乎空壳）。
 *
 * 界面改动全部发生在浏览器端：client.js 通过 window.__ModuleLoader__ 加载，
 * 往侧栏注入样式和少量代理控件。宿主侧必须导出一个 cordis 插件（带 apply 的对象），
 * 否则会被判定为 invalid plugin 而整个 bundle 加载失败。
 *
 * 这里额外挂一个只面向本机回环的升级接口：客户端点「升级到 vX.Y.Z」时调用，
 * 宿主负责下载 release 的 tgz、解包、覆盖本插件自己的目录，然后页面重载即可换新。
 */
import { Buffer } from 'node:buffer';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { get, request as httpRequest } from 'node:http';
import { get as httpsGet } from 'node:https';

export const name = 'compactui';

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = 'ifengz/dsh-compactui';
const DOWNLOAD_PREFIX = `https://github.com/${REPO}/releases/download/`;
const TAG_RE = /^v\d+\.\d+\.\d+$/;
const MAX_BYTES = 32 * 1024 * 1024;
const TIMEOUT_MS = 30000;
const ROUTE_PATH = '/api/compactui/upgrade';
/* 备份放在插件目录之外：copy 到自身子目录会直接抛错 */
const BACKUP_DIR = join(tmpdir(), 'dsh-compactui-upgrade-backup');

function cstring(buf, start, end) {
	const zero = buf.indexOf(0, start);
	const stop = zero === -1 || zero > end ? end : zero;
	return buf.toString('utf8', start, stop);
}

/** 极简 ustar 解析：只取文件内容，忽略目录/链接/扩属性。 */
function parseTar(buf) {
	const files = new Map();
	let offset = 0;
	while (offset + 512 <= buf.length) {
		const header = buf.subarray(offset, offset + 512);
		if (header.every(byte => byte === 0)) break;
		let fileName = cstring(header, 0, 100);
		const prefix = cstring(header, 345, 500);
		if (prefix !== '') fileName = `${prefix}/${fileName}`;
		const sizeText = cstring(header, 124, 136).trim();
		const size = sizeText === '' ? 0 : Number.parseInt(sizeText, 8);
		if (!Number.isFinite(size) || size < 0) break;
		const type = header[156] === 0 ? '0' : String.fromCharCode(header[156]);
		const dataStart = offset + 512;
		if ((type === '0' || type === '7') && fileName !== '') {
			files.set(fileName, buf.subarray(dataStart, dataStart + size));
		}
		offset = dataStart + Math.ceil(size / 512) * 512;
	}
	return files;
}

function fetchBuffer(url, redirects = 0) {
	const send = url.startsWith('https:') ? httpsGet : get;
	return new Promise((resolve, reject) => {
		const req = send(url, { headers: { 'user-agent': 'dsh-compactui-updater' } }, response => {
			const status = response.statusCode ?? 0;
			if (status >= 300 && status < 400 && typeof response.headers.location === 'string') {
				response.resume();
				if (redirects >= 4) {
					reject(new Error('too many redirects'));
					return;
				}
				const next = new URL(response.headers.location, url).toString();
				fetchBuffer(next, redirects + 1).then(resolve, reject);
				return;
			}
			if (status !== 200) {
				response.resume();
				reject(new Error(`download failed with HTTP ${String(status)}`));
				return;
			}
			const chunks = [];
			let size = 0;
			response.on('data', chunk => {
				size += chunk.length;
				if (size > MAX_BYTES) {
					req.destroy(new Error('download too large'));
					return;
				}
				chunks.push(chunk);
			});
			response.on('end', () => { resolve(Buffer.concat(chunks)); });
			response.on('error', reject);
		});
		req.setTimeout(TIMEOUT_MS, () => { req.destroy(new Error('download timed out')); });
		req.on('error', reject);
	});
}

export async function installRelease(tag, url) {
	if (!TAG_RE.test(tag)) throw new Error('invalid tag');
	// GitHub 把仓库名按 canonical 大小写下发（dsh-compactUI），这里按小写比对前缀
	const expected = `${DOWNLOAD_PREFIX}${tag}/`.toLowerCase();
	if (typeof url !== 'string' || !url.toLowerCase().startsWith(expected)) throw new Error('untrusted download url');
	const archive = gunzipSync(await fetchBuffer(url));
	const files = parseTar(archive);
	const manifest = files.get('package/package.json');
	if (manifest === undefined) throw new Error('package.json missing from archive');
	const meta = JSON.parse(manifest.toString('utf8'));
	if (meta.name !== 'dsh-compactui') throw new Error('unexpected package name');
	if (meta.version !== tag.slice(1)) throw new Error(`version mismatch: archive holds ${String(meta.version)}`);
	const staged = [...files.entries()].filter(([fileName]) => fileName.startsWith('package/'))
		.map(([fileName, data]) => [fileName.slice('package/'.length), data])
		.filter(([relative]) => relative !== '' && !relative.includes('..') && !relative.endsWith('/'));
	if (staged.length === 0) throw new Error('archive holds no files');
	rmSync(BACKUP_DIR, { recursive: true, force: true });
	cpSync(PLUGIN_DIR, BACKUP_DIR, {
		recursive: true,
		filter: source => !source.endsWith('.tgz'),
	});
	try {
		for (const [relative, data] of staged) {
			const target = join(PLUGIN_DIR, relative);
			mkdirSync(dirname(target), { recursive: true });
			writeFileSync(target, data);
		}
		// 装完马上读回版本，确认磁盘上真的是新版本
		const onDisk = JSON.parse(readFileSync(join(PLUGIN_DIR, 'package.json'), 'utf8'));
		if (onDisk.version !== meta.version) throw new Error('installed version does not match');
	} catch (error) {
		cpSync(BACKUP_DIR, PLUGIN_DIR, { recursive: true, force: true });
		throw error;
	}
	return meta.version;
}

function isLoopback(address) {
	if (typeof address !== 'string') return false;
	return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function sendJson(response, status, payload) {
	const body = JSON.stringify(payload);
	response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
	response.end(body);
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on('data', chunk => {
			size += chunk.length;
			if (size > 8 * 1024) {
				reject(new Error('body too large'));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on('end', () => {
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
			} catch {
				reject(new Error('invalid json'));
			}
		});
		req.on('error', reject);
	});
}

function handler(req, res) {
	if (req.method !== 'POST') {
		res.writeHead(405, { allow: 'POST' });
		res.end();
		return;
	}
	if (!isLoopback(req.socket.remoteAddress)) {
		sendJson(res, 403, { ok: false, error: 'loopback only' });
		return;
	}
	// 要求 JSON：跨站表单发不出来，浏览器也会先发预检，等于一层 CSRF 保护
	if (typeof req.headers['content-type'] !== 'string' || !req.headers['content-type'].includes('application/json')) {
		sendJson(res, 415, { ok: false, error: 'content-type must be application/json' });
		return;
	}
	const origin = req.headers.origin;
	if (typeof origin === 'string' && origin !== '' ) {
		let allowed = false;
		try {
			const parsed = new URL(origin);
			const host = req.headers.host ?? '';
			allowed = parsed.host === host;
		} catch {
			allowed = false;
		}
		if (!allowed) {
			sendJson(res, 403, { ok: false, error: 'cross origin' });
			return;
		}
	}
	void (async () => {
		try {
			const body = await readJsonBody(req);
			const tag = typeof body.tag === 'string' ? body.tag : '';
			const url = typeof body.url === 'string' ? body.url : '';
			const version = await installRelease(tag, url);
			sendJson(res, 200, { ok: true, version });
		} catch (error) {
			sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
		}
	})();
}

export function apply(ctx) {
	ctx.inject(['webServer'], host => {
		host.effect(() => host.webServer.register({ kind: 'exact', path: ROUTE_PATH, handler }));
	});
}
