const fs = require('fs');
let data = fs.readFileSync('app.js', 'utf8');
data = data.split('\\${').join('${');
fs.writeFileSync('app.js', data);
console.log('Fixed app.js');
