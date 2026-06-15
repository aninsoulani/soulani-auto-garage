const fs = require('fs');
const path = require('path');
const file = fs.readFileSync(path.resolve('node_modules', '@prisma', 'client', 'index.d.ts'), 'utf8');
const match = file.match(/export type PrismaClientOptions([\s\S]*?)}/g);
console.log(match ? match[0] : 'Not found in @prisma/client/index.d.ts');

const clientFile = fs.readFileSync(path.resolve('..', '..', 'node_modules', '.prisma', 'client', 'index.d.ts'), 'utf8');
const match2 = clientFile.match(/export type PrismaClientOptions =([\s\S]*?)(export|})/g);
console.log(match2 ? match2[0] : 'Not found in .prisma/client/index.d.ts');
