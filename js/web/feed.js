$(function() {
  $('form.publisher textarea').on('keyup', togglePostBtn)
  togglePostBtn({ target: $('form.publisher textarea') })


  function togglePostBtn(e) {
    //ctrl-enter to post when inside textarea
    console.log(e.keyCode, e.ctrlKey)
    if(e.keyCode == 13 && e.ctrlKey)
      return $('form.publisher button').click()

    var $target = $(e.target);
    var str = $target.val() || ''
    console.log('got', str)
    if (str.trim()) {
      $('form.publisher .btn').removeClass('hide')
      $target.attr('rows', 3)
    } else {
      $('form.publisher .btn').addClass('hide')
      $target.attr('rows', 1)
    }
  }

  $('.add-btn').on('click', function() {
    var token = prompt('Introduction token of the user:')
    if (!token) return
    $('#add-form [name=token]').val(token)
    $('#add-form').submit()
  })
})
