exports.createIframe = function(opts) {
  // prepend CSP
  if (opts.srcdoc)
    opts.srcdoc = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' \'unsafe-inline\'">' + opts.srcdoc
  
  // create iframe
  var iframe = document.createElement('iframe')
  if (opts.srcdoc)
    iframe.setAttribute('srcdoc', opts.srcdoc)
  else if (opts.src)
    iframe.setAttribute('src', opts.src)
  iframe.setAttribute('sandbox', 'allow-scripts')
  iframe.setAttribute('seamless', 'seamless')

  return iframe
}