---
layout: post
title: "Trick for builder composable components - Part 1"
date: 2016-04-13 09:24:56 +0000
comments: true
categories: Ember.js
keywords: actions, compose, ember, forward, options
published: true
---

Component composition has been my personal area of interest lately when using Ember.
[Ember Power Select](https://www.ember-power-select) started like me scratching my own itch and
trying to fill what I felt like a meaningful gap in the ecosystem but also became my playground to
try ideas and decide what works and what doesn't.

This posts starts a (probably short) series of post with things I've learned in the process. Some will
be concrete tricks, others will be just general advices.


Patronizing bores people, so I'll start with one simple trick.

<!-- more -->

## Allow mass assignment of properties

No, this is not about the well-known old rails security outage.

Imagine you have built a component that, despite of how hard you tried to avoid it, ends up accepting
quite a few options. You are a good Ember fellow so you decide leverage convention over configuration
and make most those option have sensitive default values.

Example:

```js
// cool-component/compoenent.js
export default Ember.Component.extend({
  placeholder: null,
  disabled: false,
  role: 'input',
  autofocus: true,
  dir: 'ltr'
});
```

Your goal is to allow a user to be able to create their own wrapper components that _compose_ yours,
so they can reuse some set of configuration options and actions that yield the behavior they want in
a less verbose manner. That user is also a very good ember citizen and decides that there is value
on that customized version of your component and it can be published as an addon.

That user will also want to give some degree of freedom to the consumer of his work and allow to, on turn,
customize the default values.

To allow that, the wrapper component must forward all possible attributes to the inner component, like
this:

{% raw %}
```html
// my-wrapper/template.hbs
{{cool-component
  disabled=disabled
  role=role
  autofocus=autofocus
  dir=dir
  value=value
  placeholder=placeholder
}}
```
{% endraw %}

So the user just does:

{% raw %}
```html
{{my-wrapper value=foo dir="rtl"}}
```
{% endraw %}

And here it comes the problem. If the consumer of the wrapper component doesn't specify every single possible
option those non-specified options being forwarded contain `undefined` and will override the default
values of the inner with it.

This is not really easy to fix by the creator of the wrapper component, because to fix that from the ouside,
the wrapper component has to copy the default values for every option accepted by the inner component, like this.

{% raw %}
```js
// cool-component/compoenent.js
export default Ember.Component.extend({
  disabled: false,    // Same default value as the inner component
  role: 'input',      // Same default value as the inner component
  autofocus: true,    // Same default value as the inner component
  dir: 'ltr',         // Same default value as the inner component
  placeholder: 'Type to search', // This default is different
});
```
{% endraw %}

This requires a lot of intimate knowledge of the internals of the inner component. You need to know
all options along with their values and update them if they change.

This can however be addressed in a more robust way by the creator of the inner component by defining
the default values in a way that don't get overridden by `undefined` values.

This can be done with a `defaultTo` computed property macro in a very clean way:

{% raw %}
```js
function defaultTo(value) {
  return Ember.computed({
    get() { return value; },
    set(_, newVal) { return newVal === undefined ? value : newVal; }
  });
}

export default Ember.Component.extend({
  placeholder: defaultTo(null),
  disabled: defaultTo(false),
  role: defaultTo('input'),
  autofocus: defaultTo(true),
  dir: defaultTo('ltr')
});
```
{% endraw %}

With this little macro people wrapping your components can carelessly forward all options
to the internal component with the peace of mind that default values are safe.

There is still two downsides with this.

The first one is that this is preventing the user to pass `undefined` to override a default value. I'd
argue that this is not a big problem since usually `null` can be used for the same purpose, although I
imagine there is some edge case where `undefined` is a perfectly valid value. I just haven't found one yet.

The second is that while it saves the component composing yours from having to know every
default value, it still requires it to know about every option and forward it the template.
Not yet ideal, but at least you removed half of the problem.

I hope some new HTMLBars/glimmer construction in the future, like the spread operator mentioned
in some RFCs will improve this.

Stay tunned for part 2.
