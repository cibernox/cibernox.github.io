// https://squaresend.com/mailto.js
(function(a,b){function e(c){c=c||"";var d=(a.location.protocol||b.location.protocol).replace(/[^a-zA-Z]+/g,"");return d=d=="file"?"https":d,a.location.hostname=="app.squaresend.com"||a.location.hostname=="192.168.1.8"?d+"://"+a.location.hostname+("/"+c).replace(/\/\//,"/"):d+"://squaresend.com"+("/"+c).replace(/\/\//,"/")}function f(a){return a.replace(/[^a-zA-Z0-9-\_]+/g,"")}function g(b){return a.encodeURIComponent?encodeURIComponent(b):escape(b)}function h(b){return a.decodeURIComponent?decodeURIComponent(b):unescape(b)}function i(a){var b="";if(typeof a=="object"){for(var c in a)c&&(b+=c+"="+g(a[c])+"&");b=b.replace(/\&$/,"")}return b}function j(b,c,d){typeof c=="function"&&(d=c,c={});var e,f=!1;a.XMLHttpRequest?e=new XMLHttpRequest:e=new ActiveXObject("Microsoft.XMLHTTP"),e.onreadystatechange=function(){e.readyState==4&&e.status==200&&d(e.responseText)},f&&(e.onload=function(){d(e.responseText)});var g=i(c);e.open("POST",b,!0),e.setRequestHeader&&e.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),e.send(g)}function k(a){return a?(a+"").replace(/<|>/g,""):""}var c={},d=a.JSON||{parse:function(){}},l="mailto",m="/";c.mailto=function(b,c){if(typeof b!="object")throw"Data must be an object";var f=b.from.split("<"),g,h;b.from.indexOf("<")>-1?(h=k(f[0])||"",g=k(f[1])||""):(h="",g=k(f[0])||"");var i={send:!0,mailto:!0,to:b.to||"",url:a.location.href,name:h||"",email:g||"",subject:b.subject||"(empty subject)",message:b.message||"(empty message)"};j(e(m+l+":"+b.to),i,function(a){var b=d.parse(a);b.type=="error"||b.type=="notice"?c({error:b.action}):b.type=="success"&&c({success:b.action})})},a.Squaresend=c})(window,document)

// My javascript
$(function() {
  var element = $(".cover-image"),
      elementHeight = element.height(),
      steps = elementHeight / 10,
      startScroll = 0;

  $(window).on("scroll", function(a, b) {
    var self = $(this),
        scrollTop = self.scrollTop(),
        count = Math.abs(scrollTop - startScroll);

    if(scrollTop >= startScroll && count < elementHeight) {
      var blur = count / steps,
      scale = blur >= 0 ? 1 + (blur / 5) * .1 : 1

      // $(".cover-image, #header h2").css({
      //   'filter'         : 'blur('+blur+'px)',
      //   '-webkit-filter' : 'blur('+blur+'px)',
      //   '-moz-filter'    : 'blur('+blur+'px)',
      //   '-o-filter'      : 'blur('+blur+'px)',
      //   '-ms-filter'     : 'blur('+blur+'px)'
      // });

      element.css({'transform': 'scale('+ scale +')'});
    }
  });

  $('#43246101002333').submit(function(e){
    e.preventDefault();
    var $form = $(this);
    var data = {};
    data.to = "miguel.camba@gmail.com";
    data.from = $('#input_1').val() + '<' + $('#input_3').val() + '>';
    data.subject = "Miguelcamba.com contact form";
    data.message = $('#input_4').val();

    Squaresend.mailto(data, function(response){
      if ( response.error ) {
        alert("Something went wrong. Try on miguel.camba@gmail.com");
      } else {
        $form.css({opacity: 0, height: '50px'});
        setTimeout(function(){
          $form.html("<h3>Thanks! I'll get back to you soon</h3>");
          $form.css({opacity: 1});
        }, 300);
      }
    });
  });
});
