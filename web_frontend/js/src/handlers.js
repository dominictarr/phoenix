var models = require('./models')

exports.setRoute = function(state, route) {
  route = route.substr(2) || 'feed'
  if (route.indexOf('profile/') === 0) {
    var profid = route.slice(8)
    state.fetchProfileFeed(profid)
  }
  else if (route == 'network') {
    state.fetchServers()
  }
  else {
    state.fetchFeed()
  }
  state.route.set(route)
}

exports.updatePublishFormTextField = function(state, data) {
  // expand/contract field if there's content in there
  state.publishForm.textFieldRows.set((data.publishText) ? 3 : 1)
}

exports.setPublishFormTextField = function(state, data) {
  // update internal data
  state.publishForm.textFieldValue.set(data.publishText)
}

exports.submitPublishForm = function(state, data) {
  // update textarea
  state.publishForm.textFieldValue.set(data.publishText)
  var str = (state.publishForm.textFieldValue()).trim()
  if (!str) return

  // make the post
  state.publishText(str, function(err) {
    if (err) throw err // :TODO: put in gui
    state.fetchFeed() // pull down the update
  })

  // this horrifying setTimeout hack is explained at [1]
  setTimeout(function() {
    // reset the form
    state.publishForm.textFieldValue.set('')
    state.publishForm.textFieldRows.set(1)
  }, 100)
}

/*
1: the setTimeout hack in submitPublishForm()
Basically, we need the `state.publishForm.textFieldValue.set(data.publishText)` to run its course
before we can call `state.publishForm.textFieldValue.set('')` and have an effect. This wouldn't be
an issue if the textarea's change event always fired before the submit event, but, because we trigger
with ctrl+enter and are trying not to much directly with the DOM events (Mercury-land) this is our solution.
*/