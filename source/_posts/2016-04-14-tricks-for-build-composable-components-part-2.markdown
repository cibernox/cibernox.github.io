---
layout: post
title: "Trick for build composable components - Part 1"
date: 2016-04-14 09:24:56 +0000
comments: true
categories: Ember.js
keywords: actions, compose, ember
published: false
---

One common usage of components is to encapsulate widgets. Pieces of UI with that pack toguether
appearance and behaviour with a nice declarative API. Think about components like selects, datepickers,
text-editors, switches and that sort of stuff.

The difficult part when creating an open source widget that goes beyond a *dead simple* level is trying
to accomodate it to fit a wide range of configurations. Everybody wants to give a little twist to it and
it is absolutely impossible to foreseen all use cases. There is no amount of configuration optios that
can cover everything.

<!-- more -->

## Components like to play Mr Potato


Taking my previous statement as an axiome for now, I've identified three ways developers want to customize
components, in ascending order by how complex is to make that happen.

1. Apperance (markup & styles)
2. React to events.
3. Tamper (or change altoguether) default behaviour.
4. Bonus: All the previous

Lets break appart how each one of this things can be achieved.

### Appearance

This one is a big vague because it includes from changing the color of a border to creating an unrecognizable
monster that barely reminds the original.

I generally take the API of the closest native HTML relative I can find to inspire the API, even if
it's a a long shot. By example, I'd take inspiration from HTML's `<input>` or `<textarea>` elements
if I was creating a rich text editor so it would have properties like `disabled`, `ariaLabel`, `required`
and so on.

Pretty much every component that renders DOM must have a `class` property. If your component renders
several meaningful DOM elements you might have the temptation of adding more properties to customize
the classes of those and add things like `headerClass`, `footerClass`, `iconClass`, `that-thing-over-thereClass`
and God knows what else.
**Resist** the temptation as much as you can. Sometimes it's OK to add one extra property for
convenience if some customization is *very* common, but is soo hard to draw a line...

Instead, suggest your users other options.

#### Document how to replace the template

If a user wants the markup to be different just adding classes or having a `\{{yield}}` in your
component won't be enough. Besides, there is only one `yield` per component, so save it for the
most important or usual use-case.

Document how to extend your component and specify a different template:

{% raw %}
```js
// app/components/custom-datepicker.js
import DatepickerComponent from 'ember-omg-datepicker/components/datepicker';
import layout from './template.hbs';

export DatepickerComponent.extend({
  layout
  // Nothing else
});
```
{% raw %}

And the user just needs to copy-paste your original markup in the new template and add classes and
HTML at will. The user just needs to be aware that a next version of the component might alter the
template a bit and break, so he will need to revisit this template and update it.

Updating templates generally is a much less complex task than updating javascript code, specially if
the user just added some classes and HTML. Still, you probably don't want to advice this technique
until your component is reasonably mature and stable.

#### Leverage CSS preprocessors

When the changes the user want to do are not on a per component basis, usually is CSS enough to get
the job done, but people tend to feel unease doing that because it involves to overriding the default styles.

This is bad because adds unnecessary weight to the CSS because you are including the default styles to immediately
reset them to match your preferences, you have to define your CSS selectors with a higher specificity than the
default ones to actually *win*.

CSS is hard by definition, so when creating a component intended to be reusable keep your CSS selectors
as flat as possible. Maybe you doesn't need to follow BEM by the book but a avoiding over-nesting helps.

But today the bast majority of apps will use some kind of CSS preprocessor like SASS, LESS or Stylus,
all of which have variables.

You can create self-documenting stylesheets thanks to sass variables that allow the user to change
the styles without actually having to fight specificity problems, and using the `!default` modifier
you can still provide sensible defaults.

{% raw %}
```scss
// app/styles/custom-datepicker.scss

// General variables
$datepicker-border-color: #abacad !default;
$datepicker-default-border-radius: 5px !default;

// Header variables
$datepicker-header-border-color: $datepicker-border-color !default;            // Take the change to link properties toguther and create themes
$datepicker-header-border: 1px solid $datepicker-header-border-color !default; // Compose new properties based on previous ones
$datepicker-header-border-radius: $datepicker-default-border-color !default;

// Footer variables
$datepicker-footer-border: $datepicker-header-border !default;
$datepicker-footer-border-radius: $datepicker-default-border-color !default;

// Actual styles use the previous variables
.datepicker-header {
  border: $datepicker-border-color !default
  border-radius: $datepicker-header-border-radius;
}

.datepicker-footer {
  border: $datepicker-footer-border;
  border-radius: $datepicker-footer-border-radius;
}
```
{% raw %}

If a user want to change, say, the border-radius of the footer to make it sharper, he just needs to
go to the source code and see if there is a variable name for that. If so, changing just requires to
give a different value to the variables before importing the stylesheet.


{% raw %}
```scss
$datepicker-footer-border-radius: 2px;
@import 'datepicker';
```
{% raw %}

No need to care about class structure or specificity rules. And also, your variables become the
some sort of public API for your styles. Also, the CSS is smaller because you are not adding css to
override default styles. The default styles already look the way you want.

I won't tell this is a free lunch, it takes some time and dedication and probably doesn't worth the
effort for most components internal to your projects or company, but it does pay off for open source
addons. In exchange of that effor, your styles become self-documenting (if the variable names are
expresive enough).

There is another advantage on this for addon authors. As an addon author you don't want to break
apps of people using your stuff. If you decide you need to add something to a template or change a
class name, you can