exports.createIframe = function(code) {
  // prepend CSP
  code = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' \'unsafe-inline\'">' + code
  
  // create iframe
  var iframe = document.createElement('iframe')
  iframe.setAttribute('srcdoc', code)
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('seamless', 'seamless')

  return iframe
}