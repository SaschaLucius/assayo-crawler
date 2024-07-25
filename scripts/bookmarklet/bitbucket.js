(() => {
  function getConfig(code, repositories) {
    return code && repositories.length ? [{
      status: 1,
      log: {
        name: code
      },
      repositories: {
        folder: code,
        list: repositories,
      }
    }] : [];
  }

  function getRepositories(selector, getUrl) {
    const elements = document.body.querySelectorAll(selector);
    return Array.from(elements).map((node) => ({
      url: getUrl(node),
    }));
  }

  function getConfigFromBitbucketPage() {
    const domain = location.origin;
    const code = location.pathname.toLowerCase().split('/').pop() || '';
    const repositories = getRepositories(
      '.aui-iconfont-repository-small + .repository-name span',
      node => [domain, '/scm/', code, '/', node.innerText, '.git'].join('')
    );
    return getConfig(code, repositories);
  }

  function getConfigFromGitlabPage() {
    const code = (location.pathname.split('/')?.[1] || '')?.replace(/-/gim, '_');
    const repositories = getRepositories('li[itemprop=owns] > div > a', node => (node.href + '.git'));
    return getConfig(code, repositories);
  }

  function downloadForChrome(blob, suggestedName) {
    window.showSaveFilePicker({ suggestedName })
      .then(async (file) => {
        const writable = await file.createWritable();
        await writable.write(blob);
        await writable.close();
      });
  }

  function downloadForAll(blob, filename) {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  function download(text, filename) {
    const blob = new Blob([text], { type: 'application/json' });
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else if (window.showSaveFilePicker) {
      downloadForChrome(blob, filename);
    } else {
      downloadForAll(blob, filename)
    }
  }

  function getFileName(code) {
    const defaultFileName = [code || 'tasks', '.json'].join('');
    return window.showSaveFilePicker
      ? defaultFileName
      : (prompt('File name for save?', defaultFileName) || defaultFileName);
  }

  const config = [
    ...getConfigFromBitbucketPage(),
    ...getConfigFromGitlabPage(),
  ];
  const fileName = getFileName(config?.[0]?.code);
  download(JSON.stringify(config, 2, 2), fileName);
})();
