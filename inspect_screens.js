/* eslint-disable */
const fs = require('fs');

const content = fs.readFileSync('stitch-raw/stitch-raw-design-gabungan.tsx', 'utf8');
console.log('File length:', content.length, 'bytes');

const doctypes = [];
let idx = 0;
while ((idx = content.indexOf('<!DOCTYPE html>', idx)) !== -1) {
  doctypes.push(idx);
  idx += 15;
}

console.log('Total HTML screens found:', doctypes.length);

doctypes.forEach((pos, i) => {
  const nextPos = doctypes[i + 1] || content.length;
  const chunk = content.slice(pos, nextPos);
  const prevComment = content.slice(Math.max(0, pos - 400), pos);
  const h1 = chunk.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const title = chunk.match(/<title>([\s\S]*?)<\/title>/i);
  
  // Also check top headers, nav links, etc.
  const headerMatch = chunk.match(/<header[\s\S]*?<\/header>/i);
  const headerText = headerMatch ? headerMatch[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) : 'None';

  console.log('=== SCREEN #' + (i + 1) + ' (Offset: ' + pos + ', Size: ' + chunk.length + ') ===');
  console.log('Comment:', prevComment.replace(/[\r\n]+/g, ' ').trim());
  console.log('Header text:', headerText);
  console.log('H1:', h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : 'None');
  console.log('');
});
