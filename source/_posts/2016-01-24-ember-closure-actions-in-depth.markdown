---
layout: post
title: "Ember closure actions in depth"
date: 2016-01-24 09:24:56 +0000
comments: true
categories: Ember.js
keywords: actions, closure, ember
published: true
---


I've been using Ember's closure actions in all my projects for a while now and I like them so much
that I almost give for granted that everybody has embraced them too.

While it's true that most ember devs has started using them, I've seen that many people haven't fully
grasped all it's potential and the new patterns they enable, so I want to explain them a bit more,
starting from the basics and going towards more advanced patterns.

<!-- more -->

## What is a closure action?

First things first, lets see a few actions in the wild.

Which ones of this are closure actions?


{% raw %}
```html
<button {{action "sayHi"}}>Salute</button>
<button onclick={{action "sayHi"}}></button>
{{my-button action=(action "sayHi")}}
{{my-button action="sayHi"}}
```
{% endraw %}

If you said 2nd and 3rd you guessed right.

The 4th example is clearly just a regular attribute passing. It is named `action` but could be named `weasel`
and would be exactly the same, just a string.

The 1st line is a bit more fuzzy. That line is telling ember to invoke the "sayHi" action when the button
is clicked. **Why doesn't qualify as a closure action?**

We have to start explaining that the `action` helper is overloaded and depending on which context is used
it does entirely different things.


### `action` in the "element space"

When invoked withing the context of an html element (what is internally known as the _"elements space"_),
the `action` keyword does a quite a lot of stuff.
It registers in the global Ember dispatcher one (or some) handlers for events whose target is the element in
which it was invoked.

In the first line of the previous example, the helper is registering in the event handler for `click`
attached automatically by Ember in the root element of your app a function that will be invoked when
the target of the event is that button. It's also doing the same thing for the `keypress` event when
the pressed key is <kbd>enter<kbd>. That function will call the `sayHi` function on the context of that template.

Apart from all that, the action helper will call `preventDefault()` on that event, hijaking the default
behavior of the tag, like by example submitting the form in which that button lives. However, that will not
prevent the event from bubbling.

Both behaviours can be tunned from the template with options:

{% raw %}
```html
<button {{action "sayHi" preventDefault=false bubble=false}}>Salute</button>
```
{% endraw %}

By default the `action` helper registers for DOM click events but you can specify a different event name:

{% raw %}
```html
<button {{action "sayHi" on="double-click"}}>Salute</button>
```
{% endraw %}

As we see, there is a quite a process involved here, but this is not a closure action.

### `action` as a closure creator

On the other hand, the second usage of this helper is as _closure creator_. This is the behavior the
helper has in **any** other situation different than the one described above.

It does something much simpler but also much more powerful. **It creates a function with a closure that invokes another function**

That's it. You can think about it almost like this snippet:

{% raw %}
```js
function createClosureAction(func, ...args) {
  return func.bind(this, ...args);
}
```
{% endraw %}
_Note: This is an oversimplification. Closure actions dont even use `Function#bind` at all, but it's close enough to grasp the basics_

It does nothing else. It doesn't register any event handler, doesn't prevent default or prevent bubbling. It just
binds the given function to the current context and the given arguments. When given a string it will assume that
it's the name of an action and will extract it from the current context.

So, why is this so cool?

### The good things of being a function

Convert your actions to functions you can pass around has many advantages.

#### **Simpler mental model**
This one is often understated.

{% raw %}

A function is a value. <code>{{my-component foo=bar}}</code>
in a template means that we're passing to the component a property named `"foo"` whose value is the value is `bar`. What if `bar`
happens to be a function? Nothing, it's the same idea. We're just passing a value.

What if we do <code>{{yield (action "submit")</code>? Same thing, we're just passing a value that happens
to be a function.

{% endraw %}
#### **Return values**

Functions have return values. Closure actions are functions. _modus ponendo ponens_, closure actions then have
return values.

{% raw %}
If the component calls `this.attrs.foo("someArg")`, it is just invoking a function and will have access
to its return value. This enables bidirectional comunication with the parent context.
Per example, an <code>{{async-button action=(action "submit")}}</code> will invoke the action and that
actions can return a promise. The button having access to that promise can therefore change to a "loading"
state until that promise is fulfilled.
{% endraw %}

#### **Removes the middleman**

Closure actions can be passed down/up as many levels as desired. That means that in a deep hierarchy of
components, the intermediate nodes just need to forward the action to their children, but they don't have
to worry about bubbling the actions back to the parents using `sendAction(actionName)`.

#### **Closure actions as event handlers**

When we attach a closure action to an event handler like this:

{% raw %}
```html
<button onclick={{action "sayHi"}}></button>
```
{% endraw %}

ember is just doing

{% raw %}
```js
button.onclick = wrappedSayHiFunction;
```
{% endraw %}

That means that as with all event handlers attached to DOM elements, the `event` is passed as an
argument, but since the close already bound one argument, the event then becomes the second argument.

The downside of this approach is that unlike the usage of action in the "element space", this will add
many event handlers, instead of takind advantage or event delegation. In theory this is slighly more expensive,
although in modern browsers the the performance difference is negligible.

That also means that is up to the user to call _preventDefault_ or _stopPropagation_ on the received event.

#### **Currying**

From the wikipedia:

_Currying is the technique of translating the evaluation of a function that takes multiple arguments (or a tuple of arguments) into evaluating a sequence of functions_

Without deep diving into haskell theory, let me only explain what you can do with this.

Having this declaration in the templates:

{% raw %}
```html
{{my-form onSubmit=(action "sendWithAjax" "/users/registration")}}

<!-- Within my-form.hbs -->
{{my-button onUsage=(action onSubmit data)}}

<!-- Within my-button.hbs -->
<button onclick={{onUsage}}></button>
```
{% endraw %}

In the `sendWithAjax` function of the top-most scope:


{% raw %}
```js
actions: {
  submitWithAjax(url, data, e) {
    // how come do I receive 3 arguments?!?!111
  }
}
```
{% endraw %}

_Because currying_. Each invocation of the `action` helper created a new closure and bound the given
arguments to the function. The first invocation bound the `this` to the current context and the
first arguments to the string `"/users/registration"`. The second invocation bound the data to the function.
Since the context and the first argument were already bound, that arguments takes the 2nd position.
Last, but not least, that function is assigned to the `onclick` property of that DOM element, and when
it's invoked the event is passed, occuping the last position in the arguments list.

Translated to javascript, it's more or less equivalent to:

{% raw %}
```js
let funcOne = func.bind(context, "/users/registration");
// ...
let funcTwo = funcOne.bind(secondContext.data);
// ...
button.onclick = funcTwo;
```
{% endraw %}

Using currying each level can augment the action with one extra argument, and that frees the last
level of the chain of the responsability of holding all the information needed invoke the function with.
Each argument can live in the level it makes more sense, without leaking outside it.

#### **Extracting values out of the first argument**

The _action_ helper accepts a set of key/value pairs as last argument. One special option you can use
is the `value` options. The option contains a path, and the closure action will be invoked with the
value contained in that path on the first argument, instead of the argument itself.

The most common example of this is to extract some value out of the event.

{% raw %}

```html
<input type="text" onchange={{action "logArgs"}}> <!-- Logs `[event]` -->
<input type="text" onchange={{action "logArgs" value="target.value"}}> <!-- Logs the value of the input (e.target.input) -->
```

{% endraw %}

But often people doesn't realize that it works with anything, not only events. Per example:

{% raw %}

```html
<button onclick={{action "logArgs" "abcde" value="length"}}> <!-- Logs `[5]` -->
<button onclick={{action (action "logArgs" "foo" value="length") value="screenX"}}>Press me</button> <!-- Logs `[3, 741]` -->
```

{% endraw %}

This is specially useful when convined with the next point.

#### **DDAU and the `mut` helper**

The Data Down - Actions Up approach to propagate state changes in an app advices us to not rely on double
bindings for mutate state but on explicit function invocations. Consider the next select component:

Pretty common. Change the selection invokes the `selectShipment` action with one value, and that
action mutatates some value. However, set some state as result of some user interaction is so common
that there is a built in way to avoid having to define such simple functions over and over: The `mut` helper.

This helper creates a function that will set on some property the first argument it receives. The following
code is equivalent.

{% raw %}

```html
<p>Select shipment type</p>
<button onclick={{action (mut shipmentType) "regularDelivery"}}>Standard delivery</button>
<button onclick={{action (mut shipmentType) "urgent"}}>48h delivery</button>
<button onclick={{action (mut shipmentType) "next-day"}}>Next day delivery</button>
```

{% endraw %}

This, in combination with the `value` option, can save you the tedium of defining super simple functions
to extract some attribute from the first argument.

{% raw %}

```html
<p>The mouse X position is: {{mouseX}}</p>
<div class="draw-canvas" onmousemove={{action (mut mouseX) value="screenX"}}></div>
```

{% endraw %}

Remeber that you can use this not only with events but with any object.

Per example, if you want to have an instance of [Ember Power Select](http://www.ember-power-select.com) bound to some
_queryParam_, you can do this:


{% codeblock template.hbs lang:html %}
{% raw %}
<p>Select a teacher to filter homework</p>
{{#power-select options=teachers selected=(find-by teachers 'id' teacherId) onchange=(action (mut teacherId) value="id") as |teacher|}}
  {{teacher.fullName}} - {{teacher.group.name}}
{{/power-select}}
{% endraw %}
{% endcodeblock %}

{% codeblock controller.js %}
{% raw %}
export default Ember.Controller.extend({
  queryParams: ['teacherId']
});
{% endraw %}
{% endcodeblock %}

{% codeblock route.js %}
{% raw %}
export default Ember.Route.extend({
  queryParams: {
    teacherId: { refreshModel: true }
  },
  model({ teacherId }) {
    return this.store.query('homework', { teacherId });
  }
});
{% endraw %}
{% endcodeblock %}

{% codeblock helpers/find-by.js %}
{% raw %}
import Ember from 'ember';

export default Ember.Helper.helper(function([collection, attrName, attrValue]) {
  return collection.find(el => Ember.get(el, attrName) === attrValue);
});
{% endraw %}
{% endcodeblock %}

Changing selecting a teacher will pass a `Teacher` model to the `onchange` function. From that teacher
we extract the `id` with `value="id"` pass that is passed to `mut teacherId`, that updates
the property in the controller and therefore the _queryParams_ in the URL, refreshing the model.

Neat.

## Summary

Going forward the Ember 2.0 path, closure actions are one of the tools in your belt you're going to
use more often.

Understanding them fully will allow to squeeze them to your advantage.