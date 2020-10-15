const puppeteer = require('puppeteer-core');
const fs = require('fs/promises');
const ora = require('ora');

let spinner = ora({ text: 'Processing...', isEnabled: true }).stopAndPersist();

async function getUrlList(filePath = './data.txt') {
  // read contents of the file
  const data = await fs.readFile(filePath, {
    encoding: 'UTF-8'
  });
  // split the contents by new line
  let lines = data.split(/\r?\n/);
  // trim
  lines = lines.map(line => {
    line = line.trim();
    if (!line.startsWith('http://') && !line.startsWith('https://')) {
      line = `http://${line}`;
    }
    return line;
  });
  return lines;
}

async function writeFile(filePath = './output.txt', content) {
  await fs.writeFile(filePath, content, {
    encoding: 'UTF-8'
  });
}

function transformShortenDomain(domains) {
  const shortenComCnDomainRegex = /^.*\.(\w+\.com\.cn)$/
  const shortenDomainRegex = /^.*\.(\w+\.\w+)$/
  const ipDomainRegex = /^(\d+\.\d+\.\d+\.\d+)$/
  let results = domains.map(domain => {
    let match = shortenComCnDomainRegex.exec(domain);
    if (match != null) {
      return match[1];
    }
    match = shortenDomainRegex.exec(domain);
    if (match != null) {
      return match[1];
    }
    match = ipDomainRegex.exec(domain);
    if (match != null) {
      return match[1];
    }
    return null;
  });
  results = [...new Set(results)];
  results = results.filter(item => item != null);
  results.sort();
  return results;
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  });
  const [page] = await browser.pages();
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    results.push(url.hostname);
    request.continue();
  });
  const urls = await getUrlList('./data.txt');
  let results = [];
  const totalUrls = urls.length;
  for (let i = 0; i < totalUrls; i++) {
    const url = urls[i];
    spinner = ora({ text: `(${i + 1}/${totalUrls}) Processing ${url}`, isEnabled: true }).start();
    await page.goto(url, {
      waitUntil: 'networkidle0',
    });
    spinner.succeed(`(${i + 1}/${totalUrls}) Processed ${url}`);
  }
  await browser.close();
  // remove dumplicate
  console.info(`got all domains ${results.length}, ${results}`);
  results = [...new Set(results)];
  console.info(`got unique domains ${results.length}, ${results}`);
  results = transformShortenDomain(results);
  console.info(`got unique sorted shorten domains ${results.length}, ${results}`)
  writeFile('output.txt', results.join('\n'));
  writeFile('output-squid.txt', results.map(item => `.${item}`).join(','));
})();