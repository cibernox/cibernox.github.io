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
that I almost take for granted that everybody has embraced them too.

While it's true that most ember devs have started using them, I've seen that many people haven't fully
grasped all its potential and the new patterns they enable, so I want to explain them a bit more,
starting from the basics and going towards more advanced patterns.

<!-- more -->

## What is a closure action?

First things first, let's see a few actions in the wild.

Which ones of these are closure actions?

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

The 1st line is a bit more fuzzy. That line is telling Ember to invoke the "sayHi" action when the button
is clicked. **Why doesn't it qualify as a closure action?**

We have to start by explaining that the `action` helper is overloaded and, depending on which context it is used in,
it does entirely different things.


### `action` in the "element space"

When invoked within the context of an html element (what is known as the _"element's space"_),
the `action` keyword does a quite a lot of stuff.
It registers in the global Ember dispatcher one (or some) handlers for events whose target is the element in
which it was invoked.

In the first line of the previous example, the helper is registering in the event handler for the `click`
attached automatically by Ember to the root of your app, a handler that will be invoked when
the target of the event is that button. It's also doing the same thing for the `keypress` event when
the pressed key is <kbd>enter</kbd>. That handler, in turn, will call the `sayHi` action on the context of that template.

Apart from all that, the action helper will call `preventDefault()` on that event, hijacking its default
behavior, like by example submitting the form in which that button lives. However, that will not
prevent the event from bubbling.

Both behaviors can be tuned from the template with options:

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

As we see, there is quite a process involved here, but this is not a closure action.

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
_Note: This is an oversimplification. Closure actions don't even use `Function#bind` at all, but it's close enough to grasp the basics._

It does nothing else. It doesn't register any event handler, doesn't prevent default or stop bubbling. It just
binds the given function to the current context and arguments. When provided with a string it will assume that
it's the name of an action and will extract it from the current context.

So, if it is such a simple helper, why is it so cool?

### The good parts of being a function

Converting your actions to functions you can pass around has many advantages.

#### **Simpler mental model**
This one is often understated.

{% raw %}

A function is a value. <code>{{my-component foo=bar}}</code>
in a template means that we're passing to the component a property named `"foo"` whose value is the value in `bar`. What if `bar`
is a function? Nothing: it's the same idea. We're just passing a value.

What if we do <code>{{yield (action "submit")</code>? Same thing, we're just yielding a value that happens
to be a function. That is all.

{% endraw %}

#### **Detect errors eagerly**
{% raw %}

On this usage, <code>{{action "foo"}}</code> is a helper and as such, tries to do its work as soon as the
template is rendered. If the current context doesn't have a function named `foo` it will fail right away,
unlike _element's space_ usage where it will fail at runtime when that event is fired and, oh surprise,
there is no action named <code>foo</code>!!

It still surprises me how many refactoring bugs this simple feature has caught for me.
{% endraw %}

#### **Return values**

Functions have return values. Closure actions are functions. Therefore _modus ponendo ponens_, closure actions have
return values too.

{% raw %}
If the component calls `this.attrs.foo("someArg")`, it is just invoking a function and will have access
to its return value, if any. This enables bidirectional communication with the parent context.

As a real world example, an <code>{{async-button action=(action "submit")}}</code> will invoke the action and that
action can return a promise. Thanks to having access to that promise, the button can then change to a "loading"
state while that returned promise is pending.
{% endraw %}

#### **Removes logic from middlemen**

Actions can be passed down/up as many levels as desired.

When passing actions as just strings with their names to be invoked with the `sendAction(actionName)` in the receiver
component, each call to `sendAction` will only reach the closest component in the hierarchy.
This means that when the logic to be executed lives a few layers up from where the event that triggers it
is fired, each one of the intermediate components has to define an action to capture and re-thorw the
call to the next level.

That is a lot of coupling.

Closure actions just being functions bound to a given scope means that they can just be passed as simple
values from the root to the leaves. Then, the last component in the chain can invoke that action with
via `this.attrs.functionName()` and it will be executed with the provided arguments in the correct
scope, releasing intermediate nodes of the chain of the burden of capture-and-rethrow actions by its name.

#### **Closure actions as event handlers**

When we attach a closure action to an event handler like this:

{% raw %}
```html
<button onclick={{action "sayHi"}}></button>
```
{% endraw %}

Ember.js is just doing

{% raw %}
```js
button.onclick = wrappedSayHiFunction;
```
{% endraw %}

That means that, as with all event handlers attached to DOM elements, it is invoked with the `event`
as first argument. But since the handler function already has one argument bound, the event is received
as the second argument instead.

There is little-to-no magic happening here, just regular javascript.

That also means that is up to the user to call _preventDefault_ or _stopPropagation_ on the received event.

#### **Not only actions can be actions**

{% raw %}
Tipically when using the `action` helper you will pass a string containing the name of some function
that lives in the `actions` property of your component, like this: `<button onclick={{action "sayHi"}}></button>`
{% endraw %}

But did you know that you can extract any function from your component by passed an unquoted reference?

{% codeblock template.hbs lang:html %}
{% raw %}
<button onclick={{action sayHi}}></button>
{% endraw %}
{% endcodeblock %}

{% codeblock component.js %}
export default Ember.Component.extend({
  actions: {
    // empty
  },
  sayHi() {
    console.log('Hi!');
  }
});
{% endcodeblock %}

This is useful by example if you want a component to execute some arbitrary logic that can be decided
by its parent, and passed as an argument.

{% codeblock my-button/template.hbs lang:html %}
{% raw %}
<button onclick={{action clickHandler}}></button>
{% endraw %}
{% endcodeblock %}

{% codeblock salutator/template.hbs lang:html %}
{% raw %}
{{my-button clickHandler=sayHi}}
{% endraw %}
{% endcodeblock %}

{% codeblock salutator/component.js %}
export default Ember.Component.extend({
  sayHi() {
    console.log('Hi!');
  }
});
{% endcodeblock %}

Now that you know that it's possible, **I strongly discourage you to do this.**

This enters the personal opinion realm but I feel that **if we start extracting methods of components
to use them as actions, why do we have the `actions` hash at all?**

Instead, when I want to be able to customize from outside a component what an action will do, I define
an action inside the component that just delegates all its logic to a method that can be passed in from
the outside.

{% codeblock my-button/template.hbs lang:html %}
{% raw %}
<button onclick={{action "clickHandler"}}></button>
{% endraw %}
{% endcodeblock %}

{% codeblock my-button/component.js %}
export default Ember.Component.extend({
  actions: {
    clickHandler() {
      this.clickHandler(...arguments);
    }
  },
  clickHanldler() {
    throw new Error('clickHandler must be provided!!');
  }
});
{% endcodeblock %}

{% codeblock salutator/template.hbs lang:html %}
{% raw %}
{{my-button clickHandler=sayHi}}
{% endraw %}
{% endcodeblock %}

{% codeblock salutator/component.js %}
export default Ember.Component.extend({
  sayHi() {
    console.log('Hi!');
  }
});
{% endcodeblock %}

The behavior is the same but reading the code of the component is crystal clear that `clickHandler`
is intended to be passed from the outside. I find this approach self-documented and more idiomatic.

#### **Currying**

Taken from the wikipedia:

_Currying is the technique of translating the evaluation of a function that takes multiple arguments (or a tuple of arguments) into evaluating a sequence of functions_

Without deep diving into Haskell theory and monad madness, let me only explain how you can apply this
technique for your own benefit with an example.

Having this declaration in the templates:

{% raw %}
```html
{{my-form onSubmit=(action "submitWithAjax" "/users/registration")}}

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

_Because currying_.

Each invocation of the `action` helper created a new closure and bound the given
arguments to the function. The first invocation bound the `this` to the current context and the
first arguments to the string `"/users/registration"`. The second invocation bound the data to the function.
Since the context and the first argument were already bound, that argument takes the 2nd position.
Last, but not least, that function is assigned to the `onclick` property of that DOM element, and when
it's invoked the event is passed, occupying the last position in the arguments list.

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

Using currying each level can augment the action with some extra arguments, and that frees the last
level of the chain of the responsibility of holding all the information needed to perform the action.
Each piece of data can live in the level it makes more sense, without leaking outside it.

#### **Extracting values out of the first argument**

The _action_ helper accepts a set of key/value pairs as last argument. One special option you can use
is the `value` option. This option holds a path, and the closure action will be invoked with the
value contained in that path on the first argument instead of the first argument.

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

This is specially useful when combined with the next point.

#### **DDAU and the `mut` helper**

The Data Down - Actions Up approach to propagate state changes in an app advices us to not rely on two-way
bindings for mutate state but on explicit function invocations. Consider the next code example:

{% codeblock template.hbs lang:html %}
{% raw %}
<p>Select shipment type</p>
<button onclick={{action "selectShipmentType" "regularDelivery"}}>Standard delivery</button>
<button onclick={{action "selectShipmentType" "urgent"}}>48h delivery</button>
<button onclick={{action "selectShipmentType" "next-day"}}>Next day delivery</button>
{% endraw %}
{% endcodeblock %}
{% codeblock component.js %}
{% raw %}
actions: {
  selectShipmentType(type /*, e */) {
    this.set('shipmentType', type);
  }
}
{% endraw %}
{% endcodeblock %}

Pretty common. Changing the selection invokes the `selectShipmentType` action with one value, and that
action mutates some value. However, set some state as result of some user interaction is so common
that there is a built-in way to avoid having to define such simple functions over and over: the `mut` helper.

This helper creates a function that will set on some property the first argument it receives. The following
code is equivalent.

{% codeblock template.hbs lang:html %}
{% raw %}
<p>Select shipment type</p>
<button onclick={{action (mut shipmentType) "regularDelivery"}}>Standard delivery</button>
<button onclick={{action (mut shipmentType) "urgent"}}>48h delivery</button>
<button onclick={{action (mut shipmentType) "next-day"}}>Next day delivery</button>
{% endraw %}
{% endcodeblock %}

This, in combination with the `value` option, can save you the tedium of defining super simple functions
to extract some attribute from the first argument.

{% raw %}

```html
<p>The mouse X position is: {{mouseX}}</p>
<div class="draw-canvas" onmousemove={{action (mut mouseX) value="screenX"}}></div>
```

{% endraw %}

Remember that you can use this not only with events but with any object.

For example, if you want to have an instance of [Ember Power Select](http://www.ember-power-select.com) bound to some
_queryParam_, you can do this:


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

{% codeblock template.hbs lang:html %}
{% raw %}
<p>Select a teacher to filter homework</p>
{{#power-select options=teachers selected=(find-by teachers 'id' teacherId) onchange=(action (mut teacherId) value="id") as |teacher|}}
  {{teacher.fullName}} - {{teacher.group.name}}
{{/power-select}}
{% endraw %}
{% endcodeblock %}

Selecting a teacher will pass that `Teacher` model to the `onchange` function. From that teacher
we extract only the `id` with `value="id"` which is passed to `(mut teacherId)` as first argument.
That updates the `teacherId` property in the controller, that is bound to a _queryParam_ in the URL,
tehen refreshing the model hook of the route.

Neat.

## Summary

Going forward the Ember 2.0 path, closure actions are one of the tools in your belt you're going to
use more often.

Understanding them fully will allow you to squeeze them to your advantage and write simpler and more maintainable
code.