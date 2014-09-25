$(function() {
  $('form.publisher textarea').on('keyup', togglePostBtn)
  $('form.publisher textarea').on('keyup', markdownPreview)
  togglePostBtn({ target: $('form.publisher textarea') })

  // yeeaaaa probably should refactor the frontend
  $('.feed .content p:nth-child(2)').each(function (index) {
    $(this).html(markdown.toHTML($(this).html()));
  });

  function togglePostBtn(e) {
    //ctrl-enter to post when inside textarea

    if(e.keyCode == 13 && e.ctrlKey)
      return $('form.publisher button').click()

    var $target = $(e.target);
    var str = $target.val() || ''
    if (str.trim()) {
      $('form.publisher .btn').removeClass('hide')
      $target.attr('rows', 3)
    } else {
      $('form.publisher .btn').addClass('hide')
      $target.attr('rows', 1)
    }
  }

  function markdownPreview (e) {
    // Render markdown in preview panel
    var preview = markdown.toHTML(e.target.value);

    $('.js-preview-panel').html(preview);
  }

  $('.add-btn').on('click', function() {
    var token = prompt('Introduction token of the user:')
    if (!token) return
    $('#add-form [name=token]').val(token)
    $('#add-form').submit()
  })
})
