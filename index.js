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
  const shortenComCnDomainRegex = /^(?:.*\.)?(\w+\.com\.cn)$/
  const shortenDomainRegex = /^(?:.*\.)?(\w+\.\w+)$/
  const ipDomainRegex = /^(\d+\.\d+\.\d+\.\d+)$/
  let match = null;
  let results = domains.map(domain => {
    match = ipDomainRegex.exec(domain);
    if (match != null) {
      return match[1];
    }
    match = shortenComCnDomainRegex.exec(domain);
    if (match != null) {
      return match[1];
    }
    match = shortenDomainRegex.exec(domain);
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
  page.on('error', err => {
    console.log('\nError occurred: ', err);
  });
  page.on('pageerror', pageerr => {
    console.log('\nPageerror occurred: ', pageerr);
  })
  const urls = await getUrlList('./data.txt');
  let results = [];
  const totalUrls = urls.length;
  for (let i = 0; i < totalUrls; i++) {
    const url = urls[i];
    spinner = ora({ text: `(${i + 1}/${totalUrls}) Processing ${url}`, isEnabled: true }).start();
    try {
      // add the initial hostname even browse failed
      results.push(new URL(url).hostname);
      await page.goto(url, {
        waitUntil: 'networkidle0',
      });
      spinner.succeed(`(${i + 1}/${totalUrls}) Processed ${url}`);
    } catch (e) {
      console.log(`\nError occurred on open page ${url} `, e);
      spinner.fail(`(${i + 1}/${totalUrls}) Processed failed for ${url}`);
    }
  }
  await browser.close();
  // remove dumplicate
  console.info(`got all domains ${results.length}, ${results}`);
  results = [...new Set(results)];
  results.sort();
  writeFile('output-all.txt', results.join('\n'));
  console.info(`got unique domains ${results.length}, ${results}`);
  results = transformShortenDomain(results);
  console.info(`got unique sorted shorten domains ${results.length}, ${results}`);
  writeFile('output-shorten.txt', results.join('\n'));
  writeFile('output-shorten-squid.txt', results.map(item => `.${item}`).join('\n'));
})();