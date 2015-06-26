---
layout: post
title: "How to inject the current user using ember-simple-auth in Ember 2.0"
date: 2015-06-18 17:59:39 +0100
comments: true
categories: Ember.js
keywords: API, ember, ember-data, EmbeddedRecordsMixin
comments: true
published: true
---

Earlier this week I was updating a project to the latest version of ember (1.13.2)
and ember-data (beta.19.2) when everything broke.
This post is a disection of why it broke, how I blamed an Ember design change decision and the moment
I realized that the "workaround" I made was actually a much better solution than the one I had before.

<!-- more -->

Let's start with the troublemaker code:

```js
// app/initializers/current-user.js
import Ember from 'ember';

export default {
  name: 'current-user',
  after: 'simple-auth',

  initialize: function(registry, application) {
    registry.register('service:current-user', null, { instantiate: false, singleton: true });
    application.inject('route', 'currentUser', 'service:current-user');
    application.inject('controller', 'currentUser', 'service:current-user');
    application.inject('component', 'currentUser', 'service:current-user');

    let session = registry.lookup('simple-auth-session:main');

    application.deferReadiness();
    Ember.run.next(function() {
      let userId = session.get("user_id");
      let userType = session.get("user_type");
      if (userId && userType) {
        registry.lookup('store:main').find(userType, userId).then(function(user) {
          user.get('userPrivateInfo').then(() => {
            registry.register('service:current-user', user, { instantiate: false, singleton: true });
            application.advanceReadiness();
          });
        });
      } else {
        session.addObserver('user_id', null, function() {
          let userId = session.get("user_id");
          let userType = session.get("user_type");
          if (userId && userType) {
            registry.lookup('store:main').find(userType, userId).then(function(user) {
              registry.register('service:current-user', user, { instantiate: false, singleton: true });
            });
          }
        });
        application.advanceReadiness();
      }
    });
  }
};
```

I'm not proud if this piece of code, but I took it from a blog post somewhere else that was
explaining how to inject the current user in controller/routes/whatever using ember-simple-auth.
If it worked for the author it should work for me and it did after a couple changes.

In a nutshell, that initializer is executed after _ember-simple-auth_ has prepared the session and
its task is to register a service named `current-user` (initially null) and inject it everywhere.

The rest of the code is the logic that takes care of updating the injected value service once I got the current user
from my API.

It stopped the application's boot and tried to retrieve the user from the server before resuming
the app. If the user was not logged in the boot process continues but it adds an observer in the session
to fetch and replace the service once the session gets the user id.

I didn't expected to ever lay my eyes on this code again, but life had other plans.

I updated to ember 1.13 successfully, but then I updated ember-data the app suddenly stopped working.

Apart from some deprecation warnings about registering/injecting stuff using the container, the
problem with this initializer was that `lookup('store:main')` suddenly was undefined. **WAT?**

I dug a bit and I discovered that in recent version of ember-data the initialization of the store
was moved from a regular initializer to an instance initializer if you're on a version of ember that
supports them (1.12+). And since instance initializers are executed *after* regular initializers the
store wasn't available yet.

> Ok, not a big deal, I'll convert this into an instance initializer.
> - An naive developer (Me)

The new initializers have a different signature. Instead of receiving the container and the application
they receive an `applicationInstance` that gives access both to the _registry_ and the _container_. I
changed the relevant lines to look like this and refreshed the browser

```js
// app/instance-initializers/current-user.js
initialize: function(appInstance) {
  let registry = appInstance.registry;
  registry.register('service:current-user', null, { instantiate: false, singleton: true });
  registry.injection('route', 'currentUser', 'service:current-user');
  registry.injection('controller', 'currentUser', 'service:current-user');
  registry.injection('component', 'currentUser', 'service:current-user');

  let session = registry.lookup('simple-auth-session:main');

  appInstance.deferReadiness();
  // ...
}
```

> appInstance.deferReadiness is not a function
> - Mr. Chrome

I inspected the object and dove into the deep internet to confirm the bitter truth. You can't defer \
the readiness of the application from an instance initializer.
**Why would whoever did this remove that feature? Most of my app needs access to the current user in order to work!**
And that it's not the only problem. You no longer can inject `null` as a service.

> Ok, I inject an empty object later my observer will swap them.

Again, nope. Ember now doesn't allow to register something under the same name once the application
has started.

> Ok, initializers are not useful anymore. Thanks for nothing!

I was starting to feel angry. I tried then to create an autonomous service that takes care of all
the login. I can't show you the exact code because I never commited it but looked similar to this.

```js
export Ember.Service.extend(Ember.PromiseProxyObject, {
  store: Ember.inject.service(),

  init() {
    this._super(...arguments);
    const { user_id, user_type } = this.session.getProperties('user_id', 'user_type');
    if (user_id && user_type) {
      this.set('content', this.get('store').find(user_type, user_id));
    }
  }
})
```

My idea was: If my service is a `PromiseProxyObject` and its content is also another `PromiseProxyObject`
I should be able to access the user though a double proxied interface.
I thought I had been very clever. It was self contained and clear and it worked! ....ish.
It only worked if you already had a session, but not if you try to login.

When you're not logged the content of this PromiseProxyObject is undefined. I was planning to set
the content to the current user in my login action and remove it when I log out, but what I didn't
know was that `PromiseProxyObject`s doesn't support to change content after creation (and makes
sense, since it has to behave like a promise and promises can't change its status once it's settled).

Time to take a break and look at the problem with a different light. I had a tea while cursing
stability without stagnation and went to [Ember London's slack channel](https://emberlondon.slack.com) to share my dispair.

I exposed the problem in the general and [@nikz](https://github.com/nikz) told me that when he faced the same problem he
ended up creating a service `current-user` that had an `instance` property that is populated from
the application route.

That approach was a bit more manual but I was ok with that, the only thing that I didn't like was that
the public api of this approach was something like `currentUser.instance.isTeacher`. It doesn't feel
natural to have to call `.instance` and my app already had the assumption than the current user was a user
all over the place.

The inpiration came in that exact moment from combine my previous failed approach with this one.

What if my service is just an `Ember.ObjectProxy` that proxies an inner user record? That way
the service is aways there, I don't have to swap it when the user logs in. Instead I just set its
content. Ember won't compain and I can continue to use `currentUser` as if a it was a real user model.

The final code is very short and the public API remained exactly like it wanted.


```js
// app/instance-initializers/current-user.js
export default {
  name: "current-user",

  initialize: function({ registry }) {
    const service = Ember.ObjectProxy.create({ isServiceFactory: true });
    registry.register('service:current-user', service, { instantiate: false, singleton: true });
    registry.injection('route', 'currentUser', 'service:current-user');
    registry.injection('controller', 'currentUser', 'service:current-user');
    registry.injection('component', 'currentUser', 'service:current-user');
  }
};

// app/routes/application.js
export default Ember.Route.extend({
  beforeModel() {
    if (this.session.isAuthenticated) {
      return this._populateCurrentUser();
    }
  },

  actions: {
    sessionAuthenticationSucceeded() {
      this._populateCurrentUser().then(user => this.transitionTo('dashboard');
    },
  },

  _populateCurrentUser() {
    const { user_id, user_type } = this.get('session.secure');
    return this.store.find(user_type, user_id)
      .then(user => this.get('currentUser').set('content', user) && user);
  }
});
```

When I started this refactor I was annoyed because of ember's design decision, but looking back on the final
result I find that once more not fighting the frameworks tends to reward you with simpler and better
abstractions.

I find this new approach less magical (no hidden observers), with less metaprogramming (I not longer
have to reopen the Session class) while mantaining the same nice public API I had before.

As a final gift for my efforts on this refactor I discovered a very nice advantage of this approach.

Stopping the application's boot process with `deferReadiness()` until I have the current user before
continuing did not provide any feedback to the user, just a white screen of death, while with the new
approach the `loading.hbs` template renders as is does with any other promise returned from
`beforeModel/model/afterModel` hooks.

Even if the start time is the same, the user has the feedback that the app is working as expected faster.

I hope this helps anyone else using ember-simple-auth/torii to update to ride the stable wave and get
rid of all those deprecation warnings before Ember 2.0 cames out.