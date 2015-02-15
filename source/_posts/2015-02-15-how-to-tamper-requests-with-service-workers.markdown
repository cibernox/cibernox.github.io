---
layout: post
title: "How to: Tamper requests with service workers"
date: 2015-02-15 14:41:24 +0000
comments: true
categories: Javascript, service workers, tamper, request
comments: true
published: true
---

Service Workers are coming to town. By the time of this writing you can use them in Chrome stable
and in nightly versions of firefox. Not all features are ready, but the most basic ones are, so
you can start using it today.

There is still not much documentation out there about how to use it, this are my two cents:
How to tamper requests/responses with service workers.

<!--more-->

### Service workers might not work as you think

I was playing with service workers to add offline capabilities to a pet project of mine ([mobile-patterns](https://github.com/cibernox/mobile-patterns))
and I wanted to return responses from cache when there is no connection available.

It was very easy. The [offline cookbook](http://jakearchibald.com/2014/offline-cookbook) that Jake
Archibald put together has lots of good examples.

However, I wanted to let my app know that a response came from the cache instead of from the server.
I am not sure if that is a good practice (time will make us more aware of what is a good idea and what is not),
but I just wanted to do it, so I started inspecting the response and trying several ideas, but none
of it worked as I expected, and that was because I was not understanding how Service Workers and
Requests/Responses are designed.

### Request and responses are not normal objects, they are streams.

I misundestood this until I read [the spec](http://www.w3.org/TR/2015/WD-service-workers-20150205/)
and the [article in MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker_API). Well,
I haven't really read the spec cover to cover, but most of it.

The responses from the server are streams containinig binary data. Service Workers is a low level API
on purpose, so when we mangle responses we are playing with very low level objects.

Streams can only be consumed once. That means that if you read the content of a response and then
you forward that response to the browser, the browser will not be able to read it.

Every time you want to mangle a response and the return it, make a clone and mangle the clone instead

```js
fetch(fetchRequest).then(function(response) {
  var clonedResponse = response.clone();

  /* Do your stuff with the clon and return the original response */

  return response;
})
```

### In the Service Workers world, promises are everywhere.

Once you have a service worker in place, all requests that your web performs will pass throught it.
That means that any blocking code in your service worker will kill performance. For that reason, pretty
much everything in the service workers API returns a Promise.

`caches.match` returns a promise that resolves to some cached response. Responses have a `blob`, `text` and
`json` methods, and all of them return a Promise.

You have to go asynchronous.

### The content of a response is a Blob

Reponses are read-only, so if you want to tamper a response, you need play with the content and return
a new response instead, and the constructor of a response expects a Blob object.

In my example, I was receiving a JSON object and I wanted to add a key to the json. I knew that Blob
existed, but I was not familiar with them.

This is the code that obtains a response from the cache, reads its JSON, adds some information to it
and returns a new response with the modified content but respecting the original headers.

```js
return cachedResponse.then(function(response) {
  return response.json().then(function(json) {
    json.myCustomField = "you've been rickrolled by a service worker";

    var blob = new Blob([JSON.stringify(json)], { type: 'application/json' });

    return new Response(blob, { headers: response.headers });
  })
});
```

### Full example

You can see a full example with comments [here](https://github.com/cibernox/mobile-patterns/blob/7d6189a281d39ce558b2db8867fa2e804b75bd41/workers/offline-support.js).

**Start using Service Workers today!**