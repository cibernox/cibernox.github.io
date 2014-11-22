---
layout: post
title: "SASS placeholders versus mixins and extends"
date: 2013-07-11 21:32
comments: true
published: true
categories: [sass,frontend]
keywords: sass,mixins,placeholders,extend,scss,differences,versus
description: "A quick summary pointing out the differences between mixins, extends and placeholders"
---

Sass preprocessors have reached critical mass to consider them a mainstream technology.
Nowadays almost nobody that does some serius frontend still uses plain old css, but some people
that uses [sass](http://sass-lang.com/) (or [less](http://lesscss.org/)) are using
it like if it where just regular css with nesting and some sintax sugar, without squeezing
all the power that those technologies put in our hands.

This a summary of the main 3 features o SASS, pointing out its differences.

<!--more-->

## @mixin

Mixins are the most known feature of sass. They allow us to create a sort of _functions_ to
share **similar** styles among our selectors (well, sass also has **functions**, but I can't find a better word).
The most evident use case is the mixins that apply vendor prefixes:

{% codeblock lang:scss %}
@mixin border-radius($radius){
  border-radius: $radius;
  -o-border-radius: $radius;
  -ms-border-radius: $radius;
  -moz-border-radius: $radius;
  -webkit-border-radius: $radius;
}

button{
  @include border-radius(10px)
}
{% endcodeblock %}

Mixins are the first feature that a sass beginner learns, but is surprising how often I see
them used the wrong way.

By example:

{% codeblock lang:scss %}
@mixin rounded{
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
}

button{
  @include rounded;
  background: #ccc;
  color: #222;
}

// Several lines down, in the same file, or even in another different file
//...
.simple-form input{
  @include rounded;
}

.main-nav .item{
  color: white;
  a:hover, a:active {
    @include rounded;
  }
}
{% endcodeblock %}

**Whats wrong with that?** It's not **DRY**.

This is the generated output:

{% codeblock lang:css %}
button{
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
  background: #ccc;
  color: #222;
}

.simple-form input{
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
}

.main-nav .item{
  color: white;
}

.main-nav .item  a:hover, .main-nav .item a:active {
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
}
{% endcodeblock %}

We see the _**exact same 6 lines**_ repeated _**over and over**_ in our css.

The golden rule of where a mixin is a good choice is just a few line above:

{% blockquote %}
They allow us to [...] share similar styles among our rules
{% endblockquote %}

The keyword here is _similar_.

A mixin is used to reuse rules, not values. In this case
to create rounded borders of different radius, but if your ever find yourself writting a mixin
that don't take arguments, **you are doing it wrong**.

## @extends

The `@extends` directive, on the other hand, is the static cousin of `@mixin`.
It is designed for sharing rules and values between selectors while avoiding repetitions.

{% codeblock lang:scss %}
.rounded{
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
}

button{
  @extend rounded
}

// Some lines down the road..

.simple-form input{
  @extend .rounded;
}

.main-nav .item{
  color: white;
  a:hover, a:active {
    @extend .rounded;
  }
}
{% endcodeblock %}

This time, the generated CSS looks like this:

{% codeblock lang:css %}
.rounded, button, .simple-form input, .main-nav .item a:hover, .main-nav .item a:active{
  border-radius: 5px;
  -o-border-radius: 5px;
  -ms-border-radius: 5px;
  -moz-border-radius: 5px;
  -webkit-border-radius: 5px;
}
.main-nav .item{
  color: white;
}
{% endcodeblock %}

It has just a fraction of the lines that the mixin approach, which is nice because lighter stylesheets
means faster loading times, specially with slow connections (mobiles), and for the browser
is also much more efficient to parse one single rule applied to several selectors than apply
the same rule once for each selector.

This is awesome because thanks to `@extend` we can have human-readable sass stylesheets (you know, split stylesheets in
several files, put together rules that apply to the same sections or components of the design, ...) and at the
same time have machine-optimized css (all selectors that extend the same parent are chained in one single rule, no
matter in which file or how conceptually unrelated they are) and at the same time we can keep clean our html because
we don't need to add all over the markup classes like `.rounded-border` or `.highlighted-text` that have no
meaning from the point of view of the application's domain.


I know that some people disagree on what html classes are, but I am a big fan of use classes
to represent what that element means (`.warning`, `.user-avatar` and `.selected-day` by example) and not
how they must look (`.red-box.bordered`, `.rounded-corners.` and `.highlighted-text` respectively)

After reading this you might wonder why if `@extend` are so cool, is not so popular and used as _mixins_.

That's because `@extend` can be **dangerous**.

The problem with this directive extending classes or id's, is that when that rules you are extending
appears nested on the application, sass must generate all the posible combinations between the nesting classes and
the rules that includes them.

Example:

{% codeblock lang:scss %}
.button {
  display: block;
  padding: 10px;
  background: green;
}
.sidebar .signup .button {
  margin-top: 22px;
}
.registration, .remember-password {
  .button  {
    margin-bottom: 33px;
  }
}
.edit-account .delete-area .button{
  background-color: red;
  color: white;
}

.article a {
  @extend .button;
}
{% endcodeblock %}

generates

{% codeblock lang:css %}
.button, .article a { /* This is probably what you intended to do */
  display: block;
  padding: 10px;
  background: green;
}

/* But it also generates this combinational mess */
.sidebar .signup .button, .sidebar .signup .article a, .article .sidebar .signup a {
  margin-top: 22px;
}

.registration .button, .registration .article a, .article .registration a, .remember-password .button, .remember-password .article a, .article .remember-password a {
  margin-bottom: 33px;
}

.edit-account .delete-area .button, .edit-account .delete-area .article a, .article .edit-account .delete-area a {
  background-color: red;
  color: white;
}
{% endcodeblock %}

`.button` is a class that is very likely to be customized depending on its containing form, so if with
just 3 appearances generates this dissaster, with 10 appearances just let your imagination fly.

So the rule of thumb is: _"Only extend a selector if you are absolutely sure that it is never reused in several places"_.

But the bad part is that you can't always be sure of this, and even if you are sure that at this moment you satisfy that rule,
in the future, you or one of your coworkers can, inadvertently, screw things up.

## %placeholders

Placeholders are an killer-feature added in sass 3.2, and they come to fix the mess I described before.

Unlike normal selectors, like `.classes` or `#ids`, placeholders won't be never compiled. In other words, this little piece of sass

{% codeblock lang:scss %}
%button{
  display: block;
  padding: 10px;
  background: green;
}
a{ color: blue; }
{% endcodeblock %}

will generate

{% codeblock  lang:css %}
a{ color: blue; }
{% endcodeblock %}

There is no reference to `%button` because placeholders are just named sets of styles meant to be extended by
other selectors, and don't have existence on its own.

Since they don't have existence on its own, they can't be nested, so you can use `@extend %placeholder-name` with complete safety.

The previous messy example that used `@extend` on a class could have been written using placeholders this way:

{% codeblock lang:scss %}
.button, %button {
  display: block;
  padding: 10px;
  background: green;
}
.sidebar .signup .button {
  margin-top: 22px;
}
.registration, .remember-password {
  .button  {
    margin-bottom: 33px;
  }
}
.edit-account .delete-area .button{
  background-color: red;
  color: white;
}

.article a {
  @extend %button;
}
{% endcodeblock %}

and you only get the rules you intended to get:

{% codeblock lang:css %}
.button, .article a {
  display: block;
  padding: 10px;
  background: green;
}

.sidebar .signup .button {
  margin-top: 22px;
}

.registration .button, .remember-password .button {
  margin-bottom: 33px;
}

.edit-account .delete-area .button {
  background-color: red;
  color: white;
}
{% endcodeblock %}

## Wrapping up

After reading about the differences between mixins, extending classes and extending placeholders, these
are some of the golden rules that I follow when writing stylesheets:

* NEVER declare mixins that don't accept params: This are not mixins, the are classes/placeholders
* NEVER (or almost never) extend normal selectors. You can get unexpected results if that selector appears nested somewhere else on the stylesheets. Use placeholders instead.
* Don't over-nest selectors. With sass is easy to forget about the chain an create infamous selectors with 6-7 chained rules.
* Don't use tag names in selectors if you can avoid it. That not a taxative rule, but the are less efficient that classes or ids.
* Don't use inheritance operator(">"). It is VERY unefficient.
* Don't use the sibling selector("+"). It is VERY unefficient AND is tightly coupled to your current markup. Some javascript libraries,
  like Ember.js by example, can insert invisible elements and break that kind of rules.
* Don't trust blindly on what you think that sass is generating. Check the generated css from time to time. You can discover mistakes than are unnoted in sass.
* Create a colour pallete using variables from the beginning. If you don't do so, you can easily end with 18 different tones
  of gray thar are only used in one or two places.
* Refactor. While most people cares about its backend/frontend code, the percentage of people that just open existing stylesheets and adds some new rules to
  style that new widget he created without trying to reuse existing styles is much higher.

