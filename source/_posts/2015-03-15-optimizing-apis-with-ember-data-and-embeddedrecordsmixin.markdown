---
layout: post
title: "Optimizing APIs with ember-data and EmbeddedRecordsMixin"
date: 2015-03-15 19:42:08 +0000
comments: true
categories: Ember.js
keywords: API, ember, ember-data, EmbeddedRecordsMixin
comments: true
published: true
---

A couple days ago I had an *"aha!"* moment where I tipped my hat to Ember Data's design and flexibility.
This post also distills some tricks of API design I learned from building APIs that scale to millions
of users and many thousands of requests per minute, and how ember-data is totally aligned with it.

<!-- more -->


I had the great luck of have participated in the creation of a some very successful projects that
made me have some ruff moments trying to meet the scalability demands. I am very grateful for that
because those are the projects that really push your limits forward as a developer.

Nowadays creating a service will almost always mean creating a backend API consumed by one or many
frontend applications, web or mobile, so scaling a service is all about scaling its API.

If you foreseen tens of millions of users, you need to design your API carefully, and I learned some
of this things the hard way.

### API scaling is all about caching

That's the the biggest truth about scaling.

I don't care how much love love you have put in writing that service in Go or how you have optimized
your database, the most slow and bloated language/framework combination with the proper caching in
place will outperform your super-efficient implementation by an order of magnitude.

No matter how fast your app works, it will be slower than a slow app not doing anything at all, so
you must design your API with _cacheability_ in mind.

### API caching is all about homogeneity and slices

When you design a piece of software you put boundaries around parts of your code that you don't want to pollute
(logically speaking) other parts of your code, and you name that concept encapsulation. Proper encapsulation
is the main selling point of that little thing called OOP.

In APIs you do the same, but when performance is a concern, you must take into account that not only the
elements of your API influence its design. How those elements will be consumed is at least as important
as the elements itself, and expose them in a scalable way must be another requirement.
And polluting can also happen between the private/public boundaries.

Imagine that you are designing a system for a car parts provider. Your system will most likely have
a `/parts` endpoint. This endpoint is consulted all the time by mechanics to check for compatibility,
characteristics and **sometimes** price, so you add a `price` entry to your payload.

But not all clients get the same price because some got from you a better deal. You don't want the
others to find out this, so that field is calculated by in request based on the user that made the
request.

Congratulations, you're doomed. No caching for you.

Another common example of this is when an endpoint like `/users/123` conditionally returns the private
information of that used depending if you are that user or not.

This is an example of pollution as a consecuence of poor encapsulation. Your otherwise static and easy
cacheable API has been poisoned by one single dynamic field, and even worse, one you don't even need most of the time.

There is for me **two golden rules in API design**:

* **Make your payloads homogeneous**. Two different users requesting the same resource should get an identical
  representation of it.

* **Minimize the number of moving parts**. A good API is that one that is mostly static and do not
  vary depending on the identity of the consumer. You can call this also objective/subjective. If you
  are mixing static & objective field with variable & subjective ones in the same endpoint, specially if
  the variable information is not always required, you will have a bad time. Consider *slicing* your
  app into two separated static/variable endpoints.


### The objective/subjective encapsulation pattern.

The paradigmatic case of this getting the profile information of a user. Imagine an app where some
information of the users is public (username, avatar, etc...) and other fields are private (email,
facebook, money in the current account...).

Your `/user` endpoint will receive millions of requests per day. Searching users, displaying the author
of a publication, and many more, most of them from people that shouldn't know my personal phone number.
Only occasionally you want to display the private information to the user itself and maybe it's close friends.

You can be sure that walk the social graph of a user to determine if I can see the private information
on each request is an absolute performance killer.

I found slicing the `user` resource into `user` and `user_private_info` a pattern that has proven itself
very useful over and over, and I've enjoyed how ember-data async relations makes implementing this a breeze.

```js
// models/user.js
export default DS.Model.extend({
  username: DS.attr('string'),
  avatar: DS.attr('string'),
  userPrivateInfo: DS.belongsTo('user-private-info', { async: true })
});

// models/user-private-info.js
export default DS.Model.extend({
  email: DS.attr('string'),
  money: DS.attr('number')
});
```

The encapsulation rule is simple: If you have any reason to consider some field private, it lives
in the `UserPrivateInfo` model. Otherwise, it belongs to the `User` model.
Now you can fetch it in a dedicated endpoint, but since the relationship is asynchronous the private
information will only be fetched when its really necessary.

Any user without permission trying to the the private information will get a *403*. That shouldn't
occur anyway because your fronted won't try to access the private information if your are not allowed,
but you're safe if that happens.


Taking this approach, the payloads of the different endpoints will look like this:
`/api/users/123`
```js
{
  user: {
    id: 123,
    username: "Tomster",
    avatar: "url/to/avatar.jpg",
    user_private_info_id: 123
  }
}
```
`/api/user_private_infos/123`
```js
{
  user_private_info: {
    id: 123,
    email: "el_tomster@ember.js",
    money: 5000000
  }
}
```

You might have noticed that the `id` of the user and its private info are the same, so you might think
that I don't really need that field, but that would be leaking an implementation detail into your
business logic. It turns out that I have all the information in the same user table and therefore the ID
is the same, but I could change my mind and store that info in a different table with different ids,
and the same API is still valid.

Also, note that now `users` API is *objective*. I don't need to perform an any kind of check to see the
requester and that user are friends. In fact depending on the business logic you might not even need to
be logged to access this resource. This allows to cache this endpoint at a very high level, using Varnish
by example, and don't even touch our servers.

### Pitfalls of this approach: How do I save sliced resources?!?!

Simple answer is: **You don't**

If you have been paying attention you have noticed that this API slicing is more based in the usage of
the API than in the limits of the business logic itself. Conceptually speaking an user has both public
and private information, but it is still only one business object, so the moment will come when
you need to perform a save operation that affects information of both words.

It would be massively complicated to synchronize save operations to two endpoints at the same time, so
I take the approach of using `user` endpoint as single point of entry for write operations on the user
model, and send the private information embedded in the user data.

A `PUT` request to update the user's profile has this payload:

```js
{
  user: {
    id: 123,
    username: "Tomster",
    avatar: "url/to/new_avatar.jpg",
    user_private_info: {
      email: "new_email@ember.js",
      money: 5000000
    }
  }
}
```

The `create` action in the user endpoint will take care of update both the public and private
information and returns the user and also sideload the private info.

```js
{
  user: {
    id: 123,
    username: "Tomster",
    avatar: "url/to/new_avatar.jpg",
    user_private_info_id: 123
  },
  user_private_infos: [{
    id: 123,
    email: "new_email@ember.js",
    money: 5000000
  }]
}
```

Wrapping up this approach, you have:

* A public `/users/:id` endpoint highly cacheable, maybe even a candidate to perform HTTP caching.

* A read-only `/user_private_info/:id` endpoint to get the the private information of the users. This endpoint
  happens to encapsulate information that is variable, not usually needed, and would otherwise prevent the previous
  endpoint to benefit from caching.

* A write `/users/:id` endpoint that accepts to receive both public and private info and updated both
  in a transactional fashion.

### Ember Data and DS.EmbeddedRecordsMixin to the rescue

So we have a `User` model that when it's loaded from the API received the id of its associated private info,
but when saved carries that record embedded.

I thought I would have to implement some kind of custom serializer myself, but the I discovered that
`DS.EmbeddedRecordsMixin` accept a very useful configuration object.

```js
// serializers/user.js
import DS from 'ember-data';

export default DS.ActiveModelSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    userPrivateInfo: {
      serialize: 'records',
      deserialize: 'ids'
    }
  }
});
```

That's all I needed to implement this functionality.

When this record is serialized, it will receive ids but when serialized it will embed the relation,
just like the previous examples. My hands bled of how much I clapped.

I really think that Ember Data and [json-api](http://jsonapi.org) are not only useful tools, but also
tools that make you a better programmer by carrying with them the opinions of other very good programmers,
letting you stand on the shoulders of giants.


