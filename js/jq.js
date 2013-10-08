jQuery( document ).ready(function( $ ) {

    //testing the lightbox
    $('a, button').click( function()
    {
        var fromtop = $(document).scrollTop();
        $('.lightbox').css({ marginTop: fromtop });
        $('.lightbox').show();
        $('.black-overlay').fadeIn(500);
        $('.lightbox').delay(100).animate({
            opacity: 1,
            top: '100'
        }, 500, function() {
            $('.lightbox').show();
        });
        event.preventDefault();
    });

    $('.cancel, .lightbox .close, .black-overlay').click(function() 
    {
        $('.black-overlay').fadeOut(500);
        $('.lightbox').animate({
            opacity: 0,
            top: '0'
        }, 500, function() {
            $('.lightbox').hide();
        });
        event.preventDefault();
    });

    //sidebar bg full doc height
    $('.sidebar-bg').css({height: $(document).height()});

    //until loop-end active, vertical line reaches bottom of list
    $('.line-vert').css({height: $('.timestamp-list').height()});

    //connect selected start and end points
    $('.loop-end').click( function()
    {
        $(this).addClass('active');
        var loopConnector = $('.loop-end.active').offset().top - $('.loop-start.active').offset().top
        if( $('.loop-start, .loop-end').hasClass('active') )
        {
            $('.loop-start.active').find('.line-vert').css({height: loopConnector - 10});
        }
    });

});