---
layout: post
title: "Import bootstrap glyphicons in ember-cli"
date: 2014-08-10 00:28
comments: true
published: true
categories: Ember.js
keywords: Ember,ember.js,ember-cli,bootstrap,glyphicons,import
description: "How-to import bootstrap glyphicons in ember-cli apps"
---
Lately I've building a small internal tool using ember-cli. Although it is
intended to be used by the QA team, I like it to be pretty, or at least decent,
so I am using bootstrap to have a good set of base styles.

There is some documentation on the web about how to use bootstrap with ember-cli,
but I've found it to be outdated in general, since the syntax of the Brocfile.js
of ember-cli's projects has changes a lot in the last months, being now
`app.import` the swiss knife for almost everything.

Using bootstrap now is as simple as typing `bower install --save bootstrap` and
adding this two lines to your brocfile:

```js
app.import('vendor/bootstrap/dist/js/bootstrap.js');
app.import('vendor/bootstrap/dist/css/bootstrap.css');
```

The problem appears when you want to use the glyphicons fonts. Bootstraps expects
the fonts to be inside the `/fonts` folder and nowhere else, so we can't just
import the font like we do with js or css files.

All docs I've seen about how to do this involve using broccoli plugins and the
old syntax to move files within a tree, but that is not needed anymore.

`app.import` accepts a second argument which is an object to configure its
behaviour, including the output tree where we want a file to be placed.

Add this third sentence under the other two:

```js
app.import('vendor/bootstrap/dist/fonts/glyphicons-halflings-regular.woff', {
  destDir: 'fonts'
});
```

That's all. This also works with any other kind of file, like images or
sourcemaps.
