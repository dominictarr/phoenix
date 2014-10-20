exports.createIframe = function(html) {
  // create iframe
  var iframe = document.createElement('iframe')
  iframe.setAttribute('src', '/gui-sandbox')
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('seamless', 'seamless')

  window.addEventListener('message', function(e) {
    if (e.source == iframe.contentWindow && e.data == 'loaded') {
      iframe.contentWindow.postMessage(html, '*')
    }
  })

  return iframe
}