# python 3.8.5

import urllib.request

no_title = '手填'


def get_title(url):

    headers = {
        'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
    }
    request = urllib.request.Request(url=url, headers=headers)

    resource = urllib.request.urlopen(request, timeout=5)

    charset = resource.headers.get_content_charset()
    charset = charset if charset else 'utf-8'

    webpage = resource.read().decode(charset)

    if '<title>' in webpage and '</title>' in webpage:
        title = str(webpage).split('<title>')[1].split('</title>')[0]
    else:
        title = no_title

    return title


url_list = urllib.request.urlopen(
    'https://raw.githubusercontent.com/liudonghua123/ynu-domain-crawler/main/data.txt'
).read().decode().split()

buffer = []

for i, url in enumerate(url_list):

    if not url.startswith('http'):
        url = f'http://{url}'

    try:
        title = get_title(url)
        title = title.replace('\n', '')
        title = title.replace('\r', '')
        title = str(title).strip()

        title = title if title else no_title

        out = f'{i}," {title}"," {url}"'
    except Exception as ex:
        print(f'ERROR: {ex}')
        out = f'{i}," {no_title}"," {url}"'

    print(f'{out}')
    buffer.append(out)

with open('site_table.csv', 'w') as f:
    for line in buffer:
        f.write(f'{line}\n')
