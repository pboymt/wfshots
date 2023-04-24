import path, { dirname } from 'node:path';
import path2 from 'node:path/posix';
import { mkdir, readFile, readdir, writeFile, watch } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { Dictionary, validateDictionary } from './schema.js';
import { existsSync } from 'node:fs';

function __dirname() {
    return dirname(fileURLToPath(import.meta.url));
}

const dictonaryPath = path.join(__dirname(), '../dictionary');
await mkdir(dictonaryPath, { recursive: true });
const screenshotsPath = path.join(__dirname(), '../screenshots');
const indexPath = path.join(dictonaryPath, 'README.md');
const listPath = path.join(screenshotsPath, 'list.yaml');

async function render() {

    const list: Dictionary = await YAML.parse(await readFile(listPath, 'utf-8'));
    const isDictionary = await validateDictionary(list);

    if (!isDictionary) {
        throw new Error('Invalid dictionary');
    }

    const indexLines = [
        '# 总览',
        '',
    ]

    const resolutions = await readdir(screenshotsPath, { withFileTypes: true });

    for (const res of resolutions) {
        if (res.isDirectory() === false) continue;
        const resolution = res.name;
        indexLines.push(`- [${resolution}](${resolution}/README.md)`);
        const resolutionPath = path.join(dictonaryPath, resolution, 'README.md');
        await mkdir(dirname(resolutionPath), { recursive: true });
        const resolutionLines = [
            `# 分辨率 ${resolution}`,
            '',
            '| ID | 描述 | 热图  | 预览|',
            '| --- | --- | --- | --- |',
        ];
        for (const screenshot of list.list ?? []) {
            const isExist = existsSync(path.join(__dirname(), '../screenshots', resolution, `${screenshot.id}.png`));
            // 截图
            const md = `![${screenshot.id}](${path2.join('../../screenshots', resolution, `${screenshot.id}.png`)})`;
            const screenshotPath = isExist ? md : '暂无截图';
            // 热图列表
            const rectsList = [
                '<ul>',
            ];
            for (const rect of screenshot.rects ?? []) {
                rectsList.push(`<li>${rect.name}</li>`);
            }
            rectsList.push('</ul>');
            const rects = rectsList.join('');
            resolutionLines.push(`| ${screenshot.id} | ${screenshot.description} | ${rects} | ${screenshotPath} |`);
        }
        await writeFile(resolutionPath, resolutionLines.join('\r\n'));
    }

    await writeFile(indexPath, indexLines.join('\r\n'));

    console.log('Rendered');

}

const signal = new AbortController();

const watcher = watch(screenshotsPath, { recursive: true, signal: signal.signal });

process.on('SIGINT', () => {
    signal.abort();
});

try {

    await render();

    for await (const event of watcher) {
        await render();
    }

} catch (error: any) {
    console.error(error);
}
