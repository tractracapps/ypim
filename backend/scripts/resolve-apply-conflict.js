import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '../../Apply.html');
const content = fs.readFileSync(filePath, 'utf8');

const headMarker = '<<<<<<< HEAD';
const sepMarker = '=======';
const endMarker = '>>>>>>>';

const headStart = content.indexOf(headMarker);
if (headStart === -1) {
  console.log('No merge conflict found in Apply.html');
  process.exit(0);
}

const sep = content.indexOf(sepMarker, headStart);
const remoteEnd = content.indexOf(endMarker, sep);
const before = content.slice(0, headStart);
const remote = content.slice(sep + sepMarker.length, remoteEnd).trim();

const resolved = `${before}${remote}\n  </script>\n</body>\n</html>\n`;
fs.writeFileSync(filePath, resolved);
console.log('Resolved Apply.html merge conflict using remote version (posts to /api/submit-apply).');
