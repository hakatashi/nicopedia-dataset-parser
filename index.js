const unzip = require('unzip-stream');
const parse = require('csv-parse');
const stringify = require('csv-stringify');
const striptags = require('striptags');
const {hiraganize} = require('japanese');
const fs = require('fs');

const normalizeMeaning = (input) => {
	let meaning = input;
	meaning = meaning.replace(/^.+?とは、/, '');
	meaning = meaning.replace(/^== (.+?) ==$/g, '$1');
	meaning = meaning.replace(/\[.+?\]/g, '');
	meaning = meaning.replace(/\(.+?\)/g, '');
	meaning = meaning.replace(/（.+?）/g, '');
	meaning = meaning.replace(/【.+?】/g, '');
	meaning = meaning.replace(/。.*$/, '');
	meaning = meaning.replace(/^.+? -/, '');
	meaning = meaning.replace(/(のこと|をいう|である)+$/, '');
	return meaning.trim();
};

(async () => {
	const files = [
		'head2008.csv',
		'head2009.csv',
		'head2010.csv',
		'head2011.csv',
		'head2012.csv',
		'head2013.csv',
		'head2014.csv',
	];

	const heads = new Map();

	for (const file of files) {
		const reader = fs.createReadStream(file);
		const parser = parse({
			escape: '\\',
			max_limit_on_data_read: 1e6,
		});
		let cnt = 0;

		reader.pipe(parser);

		parser.on('data', ([id, title, ruby, type]) => {
			heads.set(id, {id, title, ruby, type});
		});

		await new Promise((resolve) => {
			parser.on('end', () => {
				resolve();
			});
		});
	}

	{
		const reader = fs.createReadStream('latest.csv');
		const parser = parse({
			max_limit_on_data_read: 1e6,
		});
		let cnt = 0;

		reader.pipe(parser);

		parser.on('data', ([id, body]) => {
			if (!heads.has(id)) {
				return;
			}

			const {title, ruby, type} = heads.get(id);

			if (type !== 'a') {
				return;
			}

			if (title.endsWith('P')) {
				return;
			}

			const normalizedBody = striptags(body).trim().split('\n')[0];

			if (!normalizedBody.includes('とは、')) {
				return;
			}

			if (!normalizedBody.includes('である。')) {
				return;
			}

			const meaning = normalizeMeaning(normalizedBody);

			if (meaning.length < 5) {
				return;
			}

			if (meaning.match(/(歌い手|生主|生放送|MMD|大学生|MAD|Miku|アンチ|厨|投稿|タグ|プロデューサ|歌ってみた|演奏してみた|プレイヤー|以下|配信者|実況|絵師|作曲|ニコニコ|下記|m@s|レイヤー|作者|東方|幻想郷|アイドルマスター|空耳|動画)/)) {
				return;
			}

			if (meaning.endsWith('P')) {
				return;
			}

			const line = [
				title.replace(/\t/g, ''),
				hiraganize(ruby).replace(/\t/g, ''),
				meaning.replace(/\t/g, ''),
			].join('\t');
			console.log(line);
		});
	}
})();
