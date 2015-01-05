---
layout: post
title: "Why I believe that ember-cli is a game-changer"
date: 2014-09-28 23:42
comments: true
published: true
categories: Ember.js
keywords: Ember,ember.js,ember-cli,ember-addon
---

This post steps a bit out of the ordinary. Usually I write about technical stuff from a neutral
perspective. I write about something I've done, or learned, but that's all.
This one is highly opinionated. Is all about express a feeling I have.

This post is about why I *really* think that something big is happening right now in frontend
development that is going to change the way we think about it.

*That's what I think [Ember CLI](http://www.ember-cli.com/) is about to do.*

<!--more-->

### A few words words about Ember.js

I've been using Ember.js a bit more than a year and a half, since some beta version before the
new router saw the light, and I love it.

I won't listing all the reasons because of which I think Ember is great, but I'll mention one
that quite ofter appears in the middle of other people's list and it deserves to be
on top in my opinion.

The best asset that ember provides you is that it **brings uniformity to your code**.

Working in a [very big ember app](https://goldenmanager.com) over a year with other 5 or 6
developers makes you realize that this unformity is not a small matter. Follow a set of
conventions on your code is what makes the difference between working next to others and
working **with** other people.

The rules and conventions ember enforces, no matter if you agree with all of them or not, make
your code predictable. Everything has its place, and that is an incredible booster to your team's
productivity. More than once I was in charge of making a change in a part of the code I wasn't
even aware that it existed and I surprised myself being able to find the exact point where I had
to make the change in a matter of minutes.

That is for me the greatest advantage of ember among other options. It doesn't just gives you
the tools to do your job efficiently, it also gives you the guidelines and patterns to organize
logically your logic in a way any other ember developer, even a new one, can understand.

It bring uniformity *to the developer*.

### A few words about Rails.

But there is still some missing parts on this.

Frontend development has traditionally been like the wild west. While modularity is a battle
won long time ago in the backend word thanks to frameworks, package managers and patterns to
share and reuse code, modularity is still coming to javascript in ES6. And package managers,
like npm and bower are still relatively new and not completely widespread.

Develop an app is much more than add one feature after the other on a text file. You need
structures, build tools, deploy mechanisms, tests, patterns... The average toolset of a
frontend developer has expanded considerably in the last couple of years, and integrate a library
on your project is not drop in a file and you're done. Not anymore.

That is just the reason why Ruby on Rails was such a disruptive revolution 10 years ago.
It is not because it brought anything absolutely new to the dev world, but because it gave
a place to each piece of your app in a way that all projects shared the same common foundation.

When that happened, suddenly share and reuse libraries, not among some of your own projects
but with projects of people you don't even know, was simplified massively. Gems that extended
rails with al sort of functionalities expanded like mushrooms in autumn. Authentication,
logging, state managers, middlewares...you name it. All of them working out-of-the-box
with rails, with maybe just a few config lines. Compared with all the time and effort that it
used to require to integrate properly a 3rd party library in your *[put-your-favourite-old-technology-here]* project,
that made of rails a game-changer in the industry.

Now I believe that ember-cli is about to achieve the same thing.

### A few words about Ember CLI

I can't avoid thinking about Ember CLI as *"the missing parts"* I mentioned earlier.

To the strong opinions that ember has about how you should organize your code logically,
ember-cli adds the rules of how you must organize your code physically, including the
folder structure and naming, along with a powerful and extensible build pipeline based on
broccoli, package managers and a collection of wisely chosen tools and defaults.

In other terms, it brings uniformity *to the machine*.

It might not seem a big deal on itself, but that uniformity is what really makes a
difference. I just allows libraries authors to know the foundation of the environment where
its code will be plugged into.

If there is a word that summarizes the doors that ember-cli opens that would be **extensibility**.

That predefined structure along with its modular design, the package managers and an internal
API providing extension hooks open the doors to share addons that *just work™* with any app.

Ember CLI stands in the very same point that Rails did a decade ago.

### A few words about addons

I'll just illustrate a sample situations that prove the great change that this situation enables.

Is is a known fact that web components are a trendy thing. *The next big thing* according
to many, because they allow you to just reuse among projects isolated bits of UI that solve
common problems.

Imagine that you have to add a datepicker to a web app you're building. I'm sure you faced that problem before.

Since you don't want to reinvent the wheel, you surf the web an choose a cool web component
to make your life easier, but it turns out that *it's not so easy either*. Maybe the component
requires polymer.js. Almost certainly a datepicker will also require moment.js. Some specific versions.
You have to include in your build pipeline the js file. And also the html template. And the base
stylesheet too. All in the right order and after including its dependencies. And probably register
the component/directive to use it from your templates. The documentation is pretty good (hopefully)
and you will succeed, but it requires a lot of setup.

The standar architecture of Ember CLI allows authors that know their libraries better than you
to wire up things automatically. The ember addon only requires you to install it
```sh
npm install ember-cli-cool-datepicker --save-dev # Downloads the addon
ember generate ember-cli-cool-datepicker         # Fetches dependencies and wire all together.
```
**NOTE:  Since version `0.1.5` of ember-cli, an addon can be installed with only one command.
You can replace this 2 lines by `ember install:addon ember-cli-cool-datepicker` and it will
install the package from NPM and execute the corresponding generator.**

and use it right away
{% raw %}
```
{{cool-date-picker date=birthday format='YYYY-MM-DD'}}
```
{% endraw %}

And possibilities go far beyond this example.


Addons can modify your build process adding pre-processors (p.e. you can start using the new features
of ES6 like classes and generators with [ember-cli-esnext](https://github.com/rjackson/ember-cli-esnext)),
register [libraries](https://github.com/jamesarosen/ember-cpm),
change the behaviour of the browser ([ember-cli-content-security-policy](https://github.com/rwjblue/ember-cli-content-security-policy)),
deploy automatically your app to S3 using redis as synchronization mechanism ([ember-cli-depoy](https://github.com/achambers/ember-cli-deploy)),
add middlewares...

Imagination is the limit. And the angular <small>*(badum tsss)*</small> stone that enables all this possibilities
is **uniformity**.

A couple days ago I published [my first addon](https://github.com/cibernox/ember-cli-accounting)
that allows any ember-cli app to use accounting.js with ES6 modules executing just
a command. And creating it was a piece of cake.

That is a truly game-changer for me.

I can't imagine the frontend development following any path other than this. Share and
reuse code like this is the way to go. I don't know how much will take to other competitor projects
to have its own toolset as ember does, but I don't think they can remain on the sidelines
much longer.

New times are coming. Better times I think.
