$(function() {
  $('.add-btn').on('click', function() {
    var addr = prompt('Address of the server (address[:port]).')
    if (!addr) return
    $('#add-form [name=address]').val(addr)
    $('#add-form').submit()
  })
  $('.del-form').on('submit', function() {
    return confirm('Are you sure you want to remove this server?')
  })
})