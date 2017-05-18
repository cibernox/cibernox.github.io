---
layout: post
title: "The Future of Ember's testing and the beheading of jQuery"
date: 2017-04-11 23:35:53 +0100
comments: true
categories: Ember.js
keywords: Ember, testing, jquery, remove, beheading
published: true
---

For those writing Ember apps, jQuery has been an omnipresent shadow from the beginning.
It is included by default with the framework and seems to be infiltrated everywhere in it
and in the community. Well, that is about to end.

<!-- more -->

In reality Ember bundled jQuery with it as one of its "opinions" but the framework
itself it not SO dependent on jQuery. There is basically only three features in Ember
that rely in it:

- `this.$()`
- The event dispatcher (The thing that makes actions work and methods named after events like `click() {}` in you components
  be called)
- Testing. Pretty much everything.

But a lot of things have changed since Ember decided that bundling jQuery was a good idea back in 2011.
Then jQuery was the thing we all were building things on, mobile web apps were anecdotical at
best and IE 7/8 was so popular that few people dared to code stuff for them without the
cross-browser safety net of some library.

Today we build apps that run mostly for evergreen browsers and perhaps IE11, mobile
accounts for a good 50% of our visits if not more, and making a network request is no longer
something that requires you to copy-paste some obscure code from stackoverflow, so it's time
to make jQuery one of those Ember opinions you can disagree with.

Before you start following this post, consider if it's worth the effort for you to do this.

**If you have an app that is months or years old, it will take significant effort remove jQuery**.
It will require refactor ALL your tests, stop using jQuery it in all the places where you did (and I bet
you did in more places than you're aware of) and for now many of the addons your use won't work, starting
with some addons as important as `ember-data`.
An intermediate step could be to use a lighter version of jQuery with some features removed.
For you it might make more sense to use the _slim_ version of jQuery, which can save you
7KB with very little effort.

**If you are starting a new app right now and it targets mobile, it might make sense to try**.
You will save more than 35KB of min+gzip size, with it's associated parse and eval code and
that can save half a second in a cold boot even with decent device and connection and around
a second if other of those is bad.

**If, on the other hand, your app targets desktop, it is unlikely that a jQuery-less app will bring you a lot of advantages** and it will make your development harder, as a lot of addons need jQuery to work, so you will have to make
PRs to fix other people's addons as you go. It is important to keep in mind that jQuery
is not over 100K of random code someone wrote for the fun of it. It actually fixes tons of browser
quirks (run `curl -L https://code.jquery.com/jquery-git.js | grep -A 5 -n Support:` to
see some). It's a fantastic piece of software that we shouldn't disregard as obsolete.

That said, most of those quirks affect IE9 and 10 or ancient versions of safari and the
android browser which are legacy today and Ember shields you from almost all of them by
handing DOM manipulation, so a lot of Ember addons rely on jQuery for very simple tasks
just because _it has always been there_, not because it is intrinsic to their goal.
Usually fixing those addons takes little time.

**If you are maintaining an addon, you totally should**. Since the main problem people
will face building apps without jQuery is that addons break, try to make your addons to not
be one of those that break.

Now, let's get to the topic

## Disclaimer about Ember version

At the time of this writing, you need Ember.js >= 2.13.0-beta.2. Soon (a few weeks) the fix
will be in stable.
I'd also strongly recomend to be on ember-cli 2.13-beta too so you use ember-cli-babel 6. It's
not **required**, but in this tutorial I'm going to do it and explain why it's cool.

## Steps

Since the main missing point of the transition away from jQuery was testing, this post is
also going to explain a new way of doing testing that is an experiment towards the [Grand
Testing Unification RFC](https://github.com/rwjblue/rfcs/blob/42/text/0000-grand-testing-unification.md)
that has been long awaited and today we can almost touch it with the tips of our fingers.

On every step I'll explain you **why** this step is required, because some of them are
needed today but will probably not be required in the future as tools adapt. If you read
this post in a few weeks or months in the future, recheck if things have changed and skip
the step if possible.

The first step is top update your app/addon to use 2.13. Run `ember install ember-source@2.13.0-beta.2`

The reason for that is [this fix](https://github.com/emberjs/ember.js/pull/15065) that
makes Ember only setup `ajaxSend` and `ajaxComplete` events **only** if jQuery is present.
Without it jQuery-less apps where basically untestable.

The second step (entirely optional, feel free to skip): [Update ember-cli to 2.13-beta](https://github.com/ember-cli/ember-cli/releases/tag/v2.13.0-beta.3).
Go, I'll wait.

One nice feature of this beta version is the new [targets feature](https://github.com/ember-cli/rfcs/blob/master/complete/0095-standardise-targets.md)
In short, this feature allows you to express in what browsers your app is going to run so
tooling can be smart about it in many ways. The best example of this is that ember-cli-babel 6 will
only transpile what is necessary for running the app in the given and nothing else, so if
you target only modern browsers, features like arrow functions will not be transpiled.

If you are like me, you will usually develop in the latest chrome. If you do so, you don't need
most of the transpilation that Babel does by default even if you do for production, so for
a better debugging experience I use this settings:

```js
let browsers;
if (process.env.EMBER_ENV === 'development') {
  browsers = ['last 1 Chrome versions']
} else {
  browsers = [
    'ie 11',
    'last 1 Chrome versions',
    'last 1 Firefox versions',
    'last 1 Safari versions'
  ]
}
module.exports = {
  browsers
};
```

Your app will be transpiled in production and when running tests in CI but in development,
apart from `import/export`, your code will remain almost untouched. I've disabled JS sourcemaps
since I don't find them useful anymore with this settings.

The reason why I recomend following this step even if it's not necessary is because we're going
to rely a lot in some new features of the language and avoiding transpilation will make
your debugging experience better.
I actually recommend those settings regardless of if you plan to remove jQuery or not. It just
feels like living in a better future.

The third step is to replace the jQuery-based ember dispatcher that lives inside Ember with
one based in native events. As usual Robert Jackson got you covered and he developed
[ember-native-dom-event-dispatcher](https://github.com/rwjblue/ember-native-dom-event-dispatcher)
a while ago.

Run `ember install ember-native-dom-event-dispatcher` and your app will not use jQuery events anymore.

This will make components methods named after events (like `click(event) {}` or `mouseEnter(event) {}`) work
as usual with the subtle difference that the received `event` is no longer a jQuery event but a native one.
For the most part they are pretty interoperable, but there is some subtle differences in props/methods
and how `event.target` works, so pay attention.
To name the caveat that is most likely to bite you, to check if some code called `.preventDefault()` on an event,
in native events you use the `e.defaultPrevented` property while in jQuery events you use the `e.isDefaultPrevented()`
method.

The forth step if to install the last version I published of [ember-native-dom-helpers](https://github.com/cibernox/ember-native-dom-helpers).

Run `ember install ember-native-dom-helpers` and you will be introduced to a new way testing that
will delight you and I'll cover in a moment. This new way of testing is going to use `async/await`
instead of `andThen`, so any but the very latest browsers will need the regenerator
polyfill.

Run `ember install ember-maybe-import-regenerator` to get it. This addon already
uses the new targets feature so it will not import it if the browsers you target support async/await already.
I'm biased because I started the work on `ember-native-dom-helpers`, but **regardless of if you plan to remove jQuery, you should try it**.
It's going to make you love your tests again, particularly integration tests.

The next step is to remove `ember-ajax`. The addon is included in the default blueprint but it is a wrapper around
`$.ajax`, so it's evident that we need to find a replacement.

I've switched on my projects to
[`ember-fetch`](https://github.com/stefanpenner/ember-fetch) and it's very nice.
However at the time of this writing you must use the branch `patch-2` of my own
fork of the project ([cibernox/ember-fetch#patch-2](https://github.com/cibernox/ember-fetch/tree/patch-2)) while those changes are not
merged into master.

It is important to note that **you must not use the global `window.fetch` even if your browser matrix supports it**.
You must use the `import fetch from 'fetch';` import path that the addon provides.

You might wonder why we can't just "Use the platform". If you don't care about testing then using `window.fetch`
is fine, but in testing you will want to perform some operation that makes a network request
and then wait for it to finish before asserting that your UI has updated accordingly.
In order to do that Ember must instrument when a fetch request starts and finishes so it can
wait for them, and that is what this imported `fetch` function does. It's just [a thin wrapper](https://github.com/cibernox/ember-fetch/blob/15c04b029c3eed4b09f9e37d1636194cf95ac725/assets/browser-fetch.js.t#L23-L35)
over the global fetch with a polyfill for old browsers.

Another reason to not use the native fetch is that you will want to mock network requests in development/test
and [`ember-cli-mirage`](http://www.ember-cli-mirage.com/) is very popular for that. That addon
uses a mocking library called [Pretender.js](https://github.com/pretenderjs/pretender) which
at the time of this writing cannot mock requests made with the native `fetch`, but it can
however if you use the fetch polyfill that `ember-fetch` (which uses a regular XHR request underneath) provides you.
There is some ideas to fix pretender on this regard, so hopefully this will change soon.

BTW, there is a caveat about `fetch` (native or otherwise) that although I am aware of, I keep forgetting.
Unlike `$.ajax('/some-url').then(fn1).catch(fn2)` where 2XX and 3XX status codes trigger the `then` callback
and 4XX and 5XX statuses are considered failures and trigger the `catch`, using the `fetch` the
only situation that causes a request to fail and the `catch` handler to be called is a real
network error, like being offline or a timeout. Any request that was properly sent and
received, even if its status is a catastrofic 500 will call the `then` method, so you need to use
the `response.ok` flag to disambiguate. E.g:

```js
fetch("/some-endpoint").then((response) => {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}).then((response) => console.log("ok"))
  .catch((error) => console.log(error));
```

One last thing you have to remove is `ember-data`, for similar reasons. There is a plan to
decouple `ember-data` from `$.ajax`, but we're not there yet.

Enough with addons, let's remove jQuery itself. Open your `ember-cli-build.js` and make
it look like this:

```js
const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {
    vendorFiles: { 'jquery.js': null }
  });

  return app.toTree();
};
```

Done, no more jQuery. Now if you are on an empty app or addon you should be able boot it
and start working on it. If you are on an existing one, chances are some addon will
break, but the errors messages I've seen were always pretty evident.

The actual problem until now with jquery-less apps was testing, and this is the problem,
among others, that `ember-native-dom-helpers` wants to solve.

This addon provides you with a collection of test helpers that you can use in both acceptance
and integration tests and those helpers, unlike the ones in Ember.js itself, don't use jQuery internally.
It even offers a few useful new helpers like `tap` and `waitUntil` that will make your life
easier.

One key feature of the interaction helpers of that addon (`click`, `fillIn`, `tap` ...) is
that they return the promise generated by `wait()`, which is a promise that resolves once
the "world has settled" (No pending waiters, no pending route transitions, no pending ajax requests...).

This along with the new `async/await` syntax in ES2017 allows you to make your tests much
more readable.

Instead of

```js
moduleForAcceptance('Acceptance | Sign up');

test('Usage awaiting the world to settle', async function(assert) {
  visit('/sign-up');

  andThen(function() {
    fillIn('.first-name', 'Chuck');
    fillIn('.last-name', 'Berry');
    click('.submit-btn');
  });

  andThen(function() {
    assert.ok(find('.welcome-msg')[0], 'There is a welcome banner');
    assert.equal(find('.welcome-msg-name').text().trim(), 'Chuck');
  });
});
```

you can write:

```js
import { visit, click, find, fillIn } from 'ember-native-dom-helpers';

moduleForAcceptance('Acceptance | Sign up');

test('Usage awaiting the world to settle', async function(assert) {
  await visit('/sign-up');

  fillIn('.first-name', 'Chuck');
  fillIn('.last-name', 'Berry');
  await click('.submit-btn');

  assert.ok(find('.welcome-msg'), 'There is a welcome banner');
  assert.equal(find('.welcome-msg-name').textContent.trim(), 'Chuck');
});
```

With the benefit that you don't need to change your mindset when writing integration tests,
since the same helpers behave the same way on both kind of tests:
{% raw %}
```js
import { click, fillIn, find, findAll, keyEvent, triggerEvent } from 'ember-native-dom-helpers';

moduleForComponent('my-component', 'Integration | Component | my-component', {
  integration: true
});

test('I can interact with my component', async function(assert) {
  this.render(hbs```{{my-component}}```);

  await fillIn('.some-input');
  await click('.main-button');
  await keyEvent('.other-input', 'keyup', 40); // down arrow
  await triggerEvent('.some-drop-area', 'mouseenter');

  assert.ok(find('.result-of-event-happened'));
  assert.equal(findAll('.result-list-item').length, 3);
})
```
{% endraw %}

Since those helpers don't use jQuery and now we are making requests with `ember-fetch`, we
can write and tests apps nicer than ever!

Note that to prevent ESLint to freak out when using `async/await`, you must edit your `.eslintrc.js`
file and instruct to parse the javascript as the new ES2017 spec:

```js
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017, // <--- yeah!
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  env: {
    browser: true
  },
  rules: {
  }
};
```

If you are starting a new project and since the name of the test helpers provided by
`ember-native-dom-helpers` are the same of the global helpers provided by Ember, but you
really don't want to use those by mistake, I recommend to remove the configuration line
that explicitly whitelists those helpers as globals, so it will prevent you from using
the global `window.click/fillIn` that rely on jQuery by mistake.

```diff
module.exports = {
-  env: {
-    embertest: true
-  },
  globals: {
  }
}
```

This is pretty much all you need to know about the future of testing and removing jQuery
from your app addons.
Now it is the turn of the community of steadily but relentlessly make all the addons that
are not intentionally wrappers around jQuery plugins to work without it, so soon we move
from making jQuery an opt-out to make it an opt-in, which is part of the broader strategy
to create an easy path for apps to escalate from a barebone Glimmer.js component to the
full-featured Ember.js application as they need.

## Is it really any faster?

Yes, it is. This screen were taking on [www.ember-basic-dropdown.com](http://www.ember-basic-dropdown.com) running locally with CPU throttling set to 5X and networt set to "Good 3G". That is more or less like using a high end Android devise on a _meh_ connection. A pretty common situation in the first world.


With jQuery:
<img src="/images/with-jquery-small.jpg" alt="with jQuery" style="width: 100%"/>

Without jQuery:
<img src="/images/without-jquery-small.jpg" alt="without jQuery" style="width: 100%"/>

The TTI (time to interactive) is consistently around 0.7 seconds smaller on a cold boot. With a slower device or a worse connection the difference is a bit over one second.

## How can I help?

This is for addon maintainers. If you know that your addon doesn't have any reason to use
jQuery, what you can do is follow the steps in this tutorial, fix any possible unintended
usage of jQuery in your addon and then make sure you test without jQuery in CI.

You can use [this PR to ember-basic-dropdown](https://github.com/cibernox/ember-basic-dropdown/pull/260)
as an example of the changes that an addon with a mild usage of jQuery had to do to.
[This](https://github.com/cibernox/ember-basic-dropdown/pull/240/files) and [this](https://github.com/cibernox/ember-basic-dropdown/pull/253)
PRs that slowly introduced `ember-native-dom-helpers` before chopping jQuery might also
be helpful to see how to refactor a codebase to the new testing style.

## What is the big picture of things to make this a default.

This is just what **I think** should be required to the MVP of a jquery-less world that doesn't suck to live in.

- Enhance pretender (used by ember-cli-mirage) to reliably mock fetch. In practice it means to create the fetch counterpart of https://github.com/pretenderjs/FakeXMLHttpRequest
- Enhance `ember-fetch` to have some sort of feature-parity with `ember-ajax`, particularly exposing a service that allows to encapsulate authentication, headers and all that.
- Refactor `ember-data`'s internals to use some sort of `network` service that masks how that actually works inside. It could be implemented in terms of `$.ajax`, `fetch` or raw `XHR`. This service should be provided by the networking libraries (`ember-ajax`, `ember-network`, `ember-fetch`...). For backwards compatibility reasons probably this service's semantics should mimic `$.ajax`, but not sure.
- Put a carrot for developers to make their addons jquery-free. One idea I have is giving them one extra point in ember-observer.
We could detect this checking if `ember-native-dom-event-dispatcher` is present in some of the ember-try scenarios.
- Ensure that the top 15? 20? 25? addons in popularity work without jQuery. Like with mobile apps' usage, upgrading a few of most popular addons would cover a significant percentage of the apps.