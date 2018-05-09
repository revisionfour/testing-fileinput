const http = require('http');
const https = require('https');

const fs = require('fs');

const file = process.argv[2];

// Get the main object we are reading in
const obj = JSON.parse(fs.readFileSync(file, 'utf8'));

// This needs to return a promise
function getUrl(url){
  return new Promise((resolve, reject) => {
    (url.match(/https/) ? https : http).get(url, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => {
        resolve(data);
      });

    });
  });
}

// Allows us to do await
(async () => {
  let master = {};

  await Promise.all(obj.graph.map(obj => {
    if(obj.url !== undefined){
      return getUrl(obj.url).then(res => {
        master[obj.id] = parseInt(res);
      });
    }
  }));

  obj.graph.forEach(val => {
    if(val.operator !== undefined){
      let id = val.id;

      switch(val.operator){
        case 'sum':
          master[id] = val.depends.reduce((pre, curr) => pre + master[curr], 0);
          break;
        case 'average':
          let sum = val.depends.reduce((pre, curr) => pre + master[curr], 0);
          master[id] = sum / val.depends.length;
          break;
        case 'product':
          master[id] = val.depends.reduce((pre, curr) => pre * master[curr], 1);
          break;
        case 'max':
          let max = val.depends[0];
          val.depends.forEach(maxVal => {
            if(maxVal > max){
              max = maxVal;
            }
          });
          master[id] = max;
          break;
        case 'min':
          let min = val.depends[0];
          val.depends.forEach(minVal => {
            if(minVal > min){
              min = minVal;
            }
          });
          master[id] = min;
          break;
        default:
          break;
      }
    }
  });

  console.log(master[obj['target']]);
})();
