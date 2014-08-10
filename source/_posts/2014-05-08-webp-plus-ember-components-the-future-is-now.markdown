---
layout: post
title: "WebP + Ember components. The future is now"
date: 2014-05-07 21:09
comments: true
published: true
categories: Ember.js
keywords: Ember,ember.js,components,webp,feature-detection
description: "Want to use webp"
---
This past weeked I attended to Barcelona's [Future JS](http://futurejs.org/) conference. It was an amazing conference and
the level of the talks was outstanding.

The _leitmotiv_ of the whole conference was, as its name suggest, the future of the javascript language
and the web: new APIs, new programming paradigms, web components... everything that is fashionable in the
web development world.

Today I want to talk about about web components and how they are for me, as concept, the most missed feature
in the web since ever, not only because they are awesome on their own, but because they can push the web
forward in new ways by helping us to support new features in new browsers and degrade gracefully in more crappy
ones.

I've been a heavy user of Ember for a year now and I love how Ember's components can bring us the power of
the newest features before thay are implementeda cross all browser, so this demo will leverage
its advantages to conditionally display the best possible image format.

WebP is a new image format created by google (but opensource) that allows images with similar quality but with
much lower weight. Since bandwidth is a valuable resource, specially for mobile devices, I want to use
webp right now, but it turns out that at the time of writting that post, only Chrome and Opera support
this image format. Neither firefox nor safari or IE.

There is a couple ways of acomplish that task on the server side.

One is by detecting in your nginx the images support of the browser by reading a header of the request,
but I serve images from a CDN, so that solution is not for me.

The other one depends on your CDN provider. Some of them support that very same detection: when a
browser requests an image, `landscape.jpg` by example, they will under the hood serve
to browser with support the webp image enmascarated with the same name.
I don't like this solution either because:

A) It forces you to have a webp version of every non-webp image, which is not always easy or even possible.

B) The worst one: IT LIES. The extension of the image says that is a JPG file but it isn't. If you save the image and
try to open it with you OS image viewer, it will say that the image is damaged. For some uses it might not be
a problem, but it doesn't feels right to me.

With ember components it's very easy to detect the support in the client side, then ask for one format
or another, and also you can out-out of this behavior in a very easy way.

```js
App = Ember.Application.create({});

App.deferReadiness();

(function(){
  var image = new Image();
  image.onerror = function() {
    App.SmartImgComponent.reopen({webpSupported: false});
    App.advanceReadiness();
  };
  image.onload = function() {
    App.SmartImgComponent.reopen({webpSupported: image.width == 1});
    App.advanceReadiness();
  };
  image.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
})();

App.SmartImgComponent = Ember.Component.extend({
  tagName: 'img',
  attributeBindings: ['bestSrc:src'],
  webp: 'auto',
  bestSrc: function(){
    var src = this.get('src');
    if (this.get('webpSupported') && this.get('webp') == 'auto'){
      return src.replace(/\.(png|jpg|jpeg)$/, '.webp');
    } else {
      return src;
    }
  }.property('src')
});
```

That's it.

`SmartImgComponent` is an ember component that is used like this:

{% raw %}
```
<td>{{smart-img src="https://www.gstatic.com/webp/gallery/1.png" webp=false}}</td>
<td>{{smart-img src="https://www.gstatic.com/webp/gallery/1.png"}}</td>
```
{% endraw %}

It receives the png/jpg version of the image and applying a simple rule, in my case just change the extension,
it outputs an `<img>` tag with an src to the good url, and you can opt-out to this behaviour using
the `webp=false` attribute.

The only trick I've done here has to do with the web support detection. Since is an async test, I need to
pause the start up of the application until I know the support, and then I reopen the component prototype
to add the proper flag and resume the application's start up.

Here is a jsbin showing this in practice: [Smart Img Component](http://jsbin.com/ucanam/4910/edit)

It's easy for me to imagine more use cases where ember components can be used to detect brower features and
offer a well suited fallback when some browsers doesn't support the native thing yet.

You don't need to wait for the future. Implement it.
